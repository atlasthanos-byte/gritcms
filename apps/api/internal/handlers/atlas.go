package handlers

import (
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"gritcms/apps/api/internal/models"
)

// AtlasHandler manages the ATLAS CRM module.
type AtlasHandler struct {
	db *gorm.DB
}

// NewAtlasHandler creates a new AtlasHandler.
func NewAtlasHandler(db *gorm.DB) *AtlasHandler {
	return &AtlasHandler{db: db}
}

// ============================================================
// Dashboard
// ============================================================

func (h *AtlasHandler) GetDashboard(c *gin.Context) {
	var contactCount, projectCount, agentCount, contentCount, productCount int64
	h.db.Model(&models.AtlasContact{}).Count(&contactCount)
	h.db.Model(&models.AtlasProject{}).Count(&projectCount)
	h.db.Model(&models.AtlasAgentClient{}).Count(&agentCount)
	h.db.Model(&models.AtlasContent{}).Count(&contentCount)
	h.db.Model(&models.AtlasProduct{}).Count(&productCount)

	// Pipeline counts
	var newLeads, contacted, proposalSent, won, lost int64
	h.db.Model(&models.AtlasContact{}).Where("status = ?", "new").Count(&newLeads)
	h.db.Model(&models.AtlasContact{}).Where("status = ?", "contacted").Count(&contacted)
	h.db.Model(&models.AtlasContact{}).Where("status = ?", "proposal_sent").Count(&proposalSent)
	h.db.Model(&models.AtlasContact{}).Where("status = ?", "won").Count(&won)
	h.db.Model(&models.AtlasContact{}).Where("status = ?", "lost").Count(&lost)

	// Revenue this month
	now := time.Now()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	var monthlyRevenue float64
	h.db.Model(&models.AtlasRevenueEntry{}).
		Where("payment_date >= ?", monthStart).
		Select("COALESCE(SUM(amount), 0)").Scan(&monthlyRevenue)

	// Revenue this week
	weekStart := now.AddDate(0, 0, -int(now.Weekday()))
	weekStart = time.Date(weekStart.Year(), weekStart.Month(), weekStart.Day(), 0, 0, 0, 0, weekStart.Location())
	var weeklyRevenue float64
	h.db.Model(&models.AtlasRevenueEntry{}).
		Where("payment_date >= ?", weekStart).
		Select("COALESCE(SUM(amount), 0)").Scan(&weeklyRevenue)

	// MRR from active agent clients
	var mrr float64
	h.db.Model(&models.AtlasAgentClient{}).
		Where("status = ?", "active").
		Select("COALESCE(SUM(monthly_fee), 0)").Scan(&mrr)

	// Today's interactions
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	var todayInteractions int64
	h.db.Model(&models.AtlasInteraction{}).Where("created_at >= ?", today).Count(&todayInteractions)

	// Followups due today
	tomorrow := today.AddDate(0, 0, 1)
	var followupsDue int64
	h.db.Model(&models.AtlasContact{}).
		Where("next_followup_at >= ? AND next_followup_at < ?", today, tomorrow).
		Count(&followupsDue)

	// Active projects
	var activeProjects int64
	h.db.Model(&models.AtlasProject{}).Where("status = ?", "in_progress").Count(&activeProjects)

	// Total students
	var totalStudents int64
	h.db.Model(&models.AtlasEnrollment{}).Count(&totalStudents)

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"contacts":           contactCount,
		"projects":           projectCount,
		"agent_clients":      agentCount,
		"content_pieces":     contentCount,
		"products":           productCount,
		"total_students":     totalStudents,
		"monthly_revenue":    monthlyRevenue,
		"weekly_revenue":     weeklyRevenue,
		"mrr":                mrr,
		"today_interactions": todayInteractions,
		"followups_due":      followupsDue,
		"active_projects":    activeProjects,
		"pipeline": gin.H{
			"new":           newLeads,
			"contacted":     contacted,
			"proposal_sent": proposalSent,
			"won":           won,
			"lost":          lost,
		},
	}})
}

// ============================================================
// Contacts
// ============================================================

func (h *AtlasHandler) ListContacts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	contactType := c.Query("type")
	status := c.Query("status")
	icpProfile := c.Query("icp_profile")
	search := c.Query("search")
	source := c.Query("source")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	q := h.db.Model(&models.AtlasContact{})
	if contactType != "" {
		q = q.Where("type = ?", contactType)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if icpProfile != "" {
		q = q.Where("icp_profile = ?", icpProfile)
	}
	if source != "" {
		q = q.Where("source = ?", source)
	}
	if search != "" {
		q = q.Where("name ILIKE ? OR email ILIKE ? OR company ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	q.Count(&total)

	var contacts []models.AtlasContact
	q.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&contacts)

	for i := range contacts {
		h.db.Model(&models.AtlasInteraction{}).Where("contact_id = ?", contacts[i].ID).Count(&contacts[i].InteractionCount)
		h.db.Model(&models.AtlasProject{}).Where("contact_id = ?", contacts[i].ID).Count(&contacts[i].ProjectCount)
	}

	c.JSON(http.StatusOK, gin.H{
		"data": contacts,
		"meta": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"pages":     int(math.Ceil(float64(total) / float64(pageSize))),
		},
	})
}

func (h *AtlasHandler) GetContact(c *gin.Context) {
	id := c.Param("id")
	var contact models.AtlasContact
	if err := h.db.Preload("Interactions", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at DESC").Limit(50)
	}).Preload("Projects").First(&contact, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contact not found"})
		return
	}
	h.db.Model(&models.AtlasInteraction{}).Where("contact_id = ?", contact.ID).Count(&contact.InteractionCount)
	h.db.Model(&models.AtlasProject{}).Where("contact_id = ?", contact.ID).Count(&contact.ProjectCount)
	c.JSON(http.StatusOK, gin.H{"data": contact})
}

func (h *AtlasHandler) CreateContact(c *gin.Context) {
	var contact models.AtlasContact
	if err := c.ShouldBindJSON(&contact); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	contact.TenantID = 1
	if contact.Status == "" {
		contact.Status = models.AtlasContactStatusNew
	}
	if err := h.db.Create(&contact).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create contact"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": contact})
}

func (h *AtlasHandler) UpdateContact(c *gin.Context) {
	id := c.Param("id")
	var contact models.AtlasContact
	if err := h.db.First(&contact, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contact not found"})
		return
	}
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sanitizeUpdates(input)
	h.db.Model(&contact).Updates(input)
	h.db.First(&contact, id)
	c.JSON(http.StatusOK, gin.H{"data": contact})
}

func (h *AtlasHandler) DeleteContact(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&models.AtlasContact{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete contact"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Contact deleted"})
}

func (h *AtlasHandler) GetColdLeads(c *gin.Context) {
	daysStr := c.DefaultQuery("days", "5")
	days, _ := strconv.Atoi(daysStr)
	if days < 1 {
		days = 5
	}
	cutoff := time.Now().AddDate(0, 0, -days)

	var contacts []models.AtlasContact
	h.db.Where("(last_contacted_at IS NULL OR last_contacted_at < ?) AND status NOT IN (?, ?)", cutoff, "won", "lost").
		Order("last_contacted_at ASC NULLS FIRST").Find(&contacts)

	c.JSON(http.StatusOK, gin.H{"data": contacts})
}

func (h *AtlasHandler) GetPipeline(c *gin.Context) {
	type PipelineGroup struct {
		Status string                `json:"status"`
		Count  int64                 `json:"count"`
		Items  []models.AtlasContact `json:"items"`
	}
	statuses := []string{"new", "contacted", "replied", "call_booked", "proposal_sent", "won", "lost", "churned"}
	var pipeline []PipelineGroup
	for _, s := range statuses {
		var items []models.AtlasContact
		h.db.Where("status = ?", s).Order("updated_at DESC").Limit(50).Find(&items)
		pipeline = append(pipeline, PipelineGroup{
			Status: s,
			Count:  int64(len(items)),
			Items:  items,
		})
	}
	c.JSON(http.StatusOK, gin.H{"data": pipeline})
}

func (h *AtlasHandler) GetFollowups(c *gin.Context) {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	tomorrow := today.AddDate(0, 0, 1)

	var contacts []models.AtlasContact
	h.db.Where("next_followup_at >= ? AND next_followup_at < ?", today, tomorrow).
		Order("next_followup_at ASC").Find(&contacts)

	c.JSON(http.StatusOK, gin.H{"data": contacts})
}

// ============================================================
// Interactions
// ============================================================

func (h *AtlasHandler) ListInteractions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	interactionType := c.Query("type")
	channel := c.Query("channel")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	q := h.db.Model(&models.AtlasInteraction{})
	if interactionType != "" {
		q = q.Where("type = ?", interactionType)
	}
	if channel != "" {
		q = q.Where("channel = ?", channel)
	}

	var total int64
	q.Count(&total)

	var interactions []models.AtlasInteraction
	q.Preload("Contact").Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&interactions)

	c.JSON(http.StatusOK, gin.H{
		"data": interactions,
		"meta": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"pages":     int(math.Ceil(float64(total) / float64(pageSize))),
		},
	})
}

func (h *AtlasHandler) GetContactInteractions(c *gin.Context) {
	contactID := c.Param("id")
	var interactions []models.AtlasInteraction
	h.db.Where("contact_id = ?", contactID).Order("created_at DESC").Find(&interactions)
	c.JSON(http.StatusOK, gin.H{"data": interactions})
}

func (h *AtlasHandler) CreateInteraction(c *gin.Context) {
	var interaction models.AtlasInteraction
	if err := c.ShouldBindJSON(&interaction); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	interaction.TenantID = 1
	if err := h.db.Create(&interaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create interaction"})
		return
	}
	// Update contact's last_contacted_at
	if interaction.Direction == "outbound" {
		now := time.Now()
		h.db.Model(&models.AtlasContact{}).Where("id = ?", interaction.ContactID).Update("last_contacted_at", now)
	}
	c.JSON(http.StatusCreated, gin.H{"data": interaction})
}

func (h *AtlasHandler) GetTodayInteractions(c *gin.Context) {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	var interactions []models.AtlasInteraction
	h.db.Preload("Contact").Where("created_at >= ?", today).Order("created_at DESC").Find(&interactions)
	c.JSON(http.StatusOK, gin.H{"data": interactions})
}

func (h *AtlasHandler) GetInteractionStats(c *gin.Context) {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekStart := now.AddDate(0, 0, -int(now.Weekday()))
	weekStart = time.Date(weekStart.Year(), weekStart.Month(), weekStart.Day(), 0, 0, 0, 0, weekStart.Location())
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	var todayCount, weekCount, monthCount, totalCount int64
	h.db.Model(&models.AtlasInteraction{}).Where("created_at >= ?", today).Count(&todayCount)
	h.db.Model(&models.AtlasInteraction{}).Where("created_at >= ?", weekStart).Count(&weekCount)
	h.db.Model(&models.AtlasInteraction{}).Where("created_at >= ?", monthStart).Count(&monthCount)
	h.db.Model(&models.AtlasInteraction{}).Count(&totalCount)

	// By type
	type TypeCount struct {
		Type  string `json:"type"`
		Count int64  `json:"count"`
	}
	var byType []TypeCount
	h.db.Model(&models.AtlasInteraction{}).Select("type, COUNT(*) as count").Group("type").Scan(&byType)

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"today":   todayCount,
		"week":    weekCount,
		"month":   monthCount,
		"total":   totalCount,
		"by_type": byType,
	}})
}

// ============================================================
// Projects & Deals
// ============================================================

func (h *AtlasHandler) ListProjects(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	status := c.Query("status")
	stage := c.Query("stage")
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	q := h.db.Model(&models.AtlasProject{})
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if stage != "" {
		q = q.Where("stage = ?", stage)
	}
	if search != "" {
		q = q.Where("name ILIKE ?", "%"+search+"%")
	}

	var total int64
	q.Count(&total)

	var projects []models.AtlasProject
	q.Preload("Contact").Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&projects)

	c.JSON(http.StatusOK, gin.H{
		"data": projects,
		"meta": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"pages":     int(math.Ceil(float64(total) / float64(pageSize))),
		},
	})
}

func (h *AtlasHandler) GetProject(c *gin.Context) {
	id := c.Param("id")
	var project models.AtlasProject
	if err := h.db.Preload("Contact").First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": project})
}

func (h *AtlasHandler) CreateProject(c *gin.Context) {
	var project models.AtlasProject
	if err := c.ShouldBindJSON(&project); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	project.TenantID = 1
	if project.Status == "" {
		project.Status = models.AtlasProjectStatusDiscovery
	}
	if project.Stage == "" {
		project.Stage = models.AtlasProjectStageLead
	}
	if err := h.db.Create(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": project})
}

func (h *AtlasHandler) UpdateProject(c *gin.Context) {
	id := c.Param("id")
	var project models.AtlasProject
	if err := h.db.First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sanitizeUpdates(input)
	h.db.Model(&project).Updates(input)
	h.db.Preload("Contact").First(&project, id)
	c.JSON(http.StatusOK, gin.H{"data": project})
}

func (h *AtlasHandler) GetProjectPipeline(c *gin.Context) {
	type PipelineGroup struct {
		Stage      string                `json:"stage"`
		Count      int64                 `json:"count"`
		TotalValue float64               `json:"total_value"`
		Items      []models.AtlasProject `json:"items"`
	}
	stages := []string{"lead", "qualified", "proposal", "closing", "won", "lost"}
	var pipeline []PipelineGroup
	for _, s := range stages {
		var items []models.AtlasProject
		h.db.Preload("Contact").Where("stage = ?", s).Order("deal_value DESC").Find(&items)
		var totalValue float64
		h.db.Model(&models.AtlasProject{}).Where("stage = ?", s).Select("COALESCE(SUM(deal_value), 0)").Scan(&totalValue)
		pipeline = append(pipeline, PipelineGroup{
			Stage:      s,
			Count:      int64(len(items)),
			TotalValue: totalValue,
			Items:      items,
		})
	}
	c.JSON(http.StatusOK, gin.H{"data": pipeline})
}

func (h *AtlasHandler) GetProjectRevenue(c *gin.Context) {
	var totalWon, totalPaid float64
	var wonCount, paidCount int64

	h.db.Model(&models.AtlasProject{}).Where("stage = ?", "won").Count(&wonCount)
	h.db.Model(&models.AtlasProject{}).Where("stage = ?", "won").Select("COALESCE(SUM(deal_value), 0)").Scan(&totalWon)
	h.db.Model(&models.AtlasProject{}).Where("status = ?", "paid").Count(&paidCount)
	h.db.Model(&models.AtlasProject{}).Where("status = ?", "paid").Select("COALESCE(SUM(deal_value), 0)").Scan(&totalPaid)

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"won_deals":     wonCount,
		"won_value":     totalWon,
		"paid_deals":    paidCount,
		"paid_value":    totalPaid,
		"pending_value": totalWon - totalPaid,
	}})
}

func (h *AtlasHandler) GetOverdueProjects(c *gin.Context) {
	now := time.Now()
	var projects []models.AtlasProject
	h.db.Preload("Contact").
		Where("deadline < ? AND delivered_date IS NULL AND status NOT IN (?, ?)", now, "delivered", "paid").
		Order("deadline ASC").Find(&projects)
	c.JSON(http.StatusOK, gin.H{"data": projects})
}
