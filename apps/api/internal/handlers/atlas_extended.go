package handlers

import (
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"gritcms/apps/api/internal/models"
)

// ============================================================
// Courses & Students
// ============================================================

func (h *AtlasHandler) ListAtlasCourses(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	status := c.Query("status")
	pillar := c.Query("pillar")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	q := h.db.Model(&models.AtlasCourse{})
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if pillar != "" {
		q = q.Where("pillar = ?", pillar)
	}

	var total int64
	q.Count(&total)

	var courses []models.AtlasCourse
	q.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&courses)

	c.JSON(http.StatusOK, gin.H{
		"data": courses,
		"meta": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"pages":     int(math.Ceil(float64(total) / float64(pageSize))),
		},
	})
}

func (h *AtlasHandler) CreateAtlasCourse(c *gin.Context) {
	var course models.AtlasCourse
	if err := c.ShouldBindJSON(&course); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	course.TenantID = 1
	if course.Status == "" {
		course.Status = models.AtlasCourseStatusPlanned
	}
	if course.Slug == "" {
		course.Slug = generateAtlasSlug(course.Title)
	}
	if err := h.db.Create(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create course"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": course})
}

func (h *AtlasHandler) UpdateAtlasCourse(c *gin.Context) {
	id := c.Param("id")
	var course models.AtlasCourse
	if err := h.db.First(&course, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sanitizeUpdates(input)
	h.db.Model(&course).Updates(input)
	h.db.First(&course, id)
	c.JSON(http.StatusOK, gin.H{"data": course})
}

func (h *AtlasHandler) GetAtlasCourseStudents(c *gin.Context) {
	courseID := c.Param("id")
	var enrollments []models.AtlasEnrollment
	h.db.Preload("Contact").Where("course_id = ?", courseID).Order("enrolled_at DESC").Find(&enrollments)
	c.JSON(http.StatusOK, gin.H{"data": enrollments})
}

func (h *AtlasHandler) EnrollStudent(c *gin.Context) {
	courseID, _ := strconv.Atoi(c.Param("id"))
	var enrollment models.AtlasEnrollment
	if err := c.ShouldBindJSON(&enrollment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	enrollment.TenantID = 1
	enrollment.CourseID = uint(courseID)
	enrollment.EnrolledAt = time.Now()
	if enrollment.Status == "" {
		enrollment.Status = models.AtlasEnrollmentStatusEnrolled
	}
	if enrollment.PaymentStatus == "" {
		enrollment.PaymentStatus = models.AtlasPaymentStatusPending
	}
	if err := h.db.Create(&enrollment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to enroll student"})
		return
	}
	// Update course student count
	h.db.Model(&models.AtlasCourse{}).Where("id = ?", courseID).
		UpdateColumn("total_students", h.db.Model(&models.AtlasEnrollment{}).Where("course_id = ?", courseID).Select("COUNT(*)"))
	c.JSON(http.StatusCreated, gin.H{"data": enrollment})
}

func (h *AtlasHandler) GetAtlasCourseStats(c *gin.Context) {
	var totalCourses, publishedCourses, totalStudents int64
	var totalRevenue float64

	h.db.Model(&models.AtlasCourse{}).Count(&totalCourses)
	h.db.Model(&models.AtlasCourse{}).Where("status = ?", "published").Count(&publishedCourses)
	h.db.Model(&models.AtlasEnrollment{}).Count(&totalStudents)
	h.db.Model(&models.AtlasEnrollment{}).Where("payment_status = ?", "paid").Select("COALESCE(SUM(amount_paid), 0)").Scan(&totalRevenue)

	// By pillar
	type PillarStat struct {
		Pillar   string `json:"pillar"`
		Count    int64  `json:"count"`
		Students int64  `json:"students"`
	}
	var byPillar []PillarStat
	h.db.Model(&models.AtlasCourse{}).Select("pillar, COUNT(*) as count").Where("pillar != ''").Group("pillar").Scan(&byPillar)

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"total_courses":     totalCourses,
		"published_courses": publishedCourses,
		"total_students":    totalStudents,
		"total_revenue":     totalRevenue,
		"by_pillar":         byPillar,
	}})
}

func (h *AtlasHandler) GetPlannedCourses(c *gin.Context) {
	var courses []models.AtlasCourse
	h.db.Where("status IN (?, ?)", "planned", "building").Order("created_at DESC").Find(&courses)
	c.JSON(http.StatusOK, gin.H{"data": courses})
}

// ============================================================
// AI Agent Clients
// ============================================================

func (h *AtlasHandler) ListAgentClients(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	status := c.Query("status")
	career := c.Query("career")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	q := h.db.Model(&models.AtlasAgentClient{})
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if career != "" {
		q = q.Where("career = ?", career)
	}

	var total int64
	q.Count(&total)

	var clients []models.AtlasAgentClient
	q.Preload("Contact").Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&clients)

	c.JSON(http.StatusOK, gin.H{
		"data": clients,
		"meta": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"pages":     int(math.Ceil(float64(total) / float64(pageSize))),
		},
	})
}

func (h *AtlasHandler) CreateAgentClient(c *gin.Context) {
	var client models.AtlasAgentClient
	if err := c.ShouldBindJSON(&client); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	client.TenantID = 1
	if client.Status == "" {
		client.Status = models.AtlasAgentStatusDiscovery
	}
	if err := h.db.Create(&client).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create agent client"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": client})
}

func (h *AtlasHandler) UpdateAgentClient(c *gin.Context) {
	id := c.Param("id")
	var client models.AtlasAgentClient
	if err := h.db.First(&client, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Agent client not found"})
		return
	}
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sanitizeUpdates(input)
	h.db.Model(&client).Updates(input)
	h.db.Preload("Contact").First(&client, id)
	c.JSON(http.StatusOK, gin.H{"data": client})
}

func (h *AtlasHandler) GetActiveAgentClients(c *gin.Context) {
	var clients []models.AtlasAgentClient
	h.db.Preload("Contact").Where("status = ?", "active").Order("next_maintenance ASC").Find(&clients)
	c.JSON(http.StatusOK, gin.H{"data": clients})
}

func (h *AtlasHandler) GetAgentRevenue(c *gin.Context) {
	var mrr, totalSetup float64
	var activeCount, totalCount int64

	h.db.Model(&models.AtlasAgentClient{}).Count(&totalCount)
	h.db.Model(&models.AtlasAgentClient{}).Where("status = ?", "active").Count(&activeCount)
	h.db.Model(&models.AtlasAgentClient{}).Where("status = ?", "active").Select("COALESCE(SUM(monthly_fee), 0)").Scan(&mrr)
	h.db.Model(&models.AtlasAgentClient{}).Select("COALESCE(SUM(setup_fee), 0)").Scan(&totalSetup)

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"mrr":          mrr,
		"arr":          mrr * 12,
		"total_setup":  totalSetup,
		"active_count": activeCount,
		"total_count":  totalCount,
	}})
}

func (h *AtlasHandler) GetAgentsByCareer(c *gin.Context) {
	type CareerGroup struct {
		Career string `json:"career"`
		Count  int64  `json:"count"`
		MRR    float64 `json:"mrr"`
	}
	var groups []CareerGroup
	h.db.Model(&models.AtlasAgentClient{}).
		Select("career, COUNT(*) as count, COALESCE(SUM(CASE WHEN status = 'active' THEN monthly_fee ELSE 0 END), 0) as mrr").
		Group("career").Scan(&groups)
	c.JSON(http.StatusOK, gin.H{"data": groups})
}

// ============================================================
// Content Tracker
// ============================================================

func (h *AtlasHandler) ListContent(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	platform := c.Query("platform")
	status := c.Query("status")
	pillar := c.Query("pillar")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	q := h.db.Model(&models.AtlasContent{})
	if platform != "" {
		q = q.Where("platform = ?", platform)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if pillar != "" {
		q = q.Where("pillar = ?", pillar)
	}

	var total int64
	q.Count(&total)

	var content []models.AtlasContent
	q.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&content)

	c.JSON(http.StatusOK, gin.H{
		"data": content,
		"meta": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"pages":     int(math.Ceil(float64(total) / float64(pageSize))),
		},
	})
}

func (h *AtlasHandler) CreateContent(c *gin.Context) {
	var content models.AtlasContent
	if err := c.ShouldBindJSON(&content); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	content.TenantID = 1
	if content.Status == "" {
		content.Status = models.AtlasContentStatusIdea
	}
	if err := h.db.Create(&content).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create content"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": content})
}

func (h *AtlasHandler) UpdateContent(c *gin.Context) {
	id := c.Param("id")
	var content models.AtlasContent
	if err := h.db.First(&content, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Content not found"})
		return
	}
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sanitizeUpdates(input)
	h.db.Model(&content).Updates(input)
	h.db.First(&content, id)
	c.JSON(http.StatusOK, gin.H{"data": content})
}

func (h *AtlasHandler) GetContentCalendar(c *gin.Context) {
	var content []models.AtlasContent
	h.db.Where("publish_date IS NOT NULL").Order("publish_date ASC").Find(&content)
	c.JSON(http.StatusOK, gin.H{"data": content})
}

func (h *AtlasHandler) GetContentStats(c *gin.Context) {
	var totalPieces int64
	var totalViews, totalLikes, totalRevenue float64

	h.db.Model(&models.AtlasContent{}).Count(&totalPieces)
	h.db.Model(&models.AtlasContent{}).Select("COALESCE(SUM(views), 0)").Scan(&totalViews)
	h.db.Model(&models.AtlasContent{}).Select("COALESCE(SUM(likes), 0)").Scan(&totalLikes)
	h.db.Model(&models.AtlasContent{}).Select("COALESCE(SUM(revenue_generated), 0)").Scan(&totalRevenue)

	type PlatformStat struct {
		Platform string  `json:"platform"`
		Count    int64   `json:"count"`
		Views    float64 `json:"views"`
		Revenue  float64 `json:"revenue"`
	}
	var byPlatform []PlatformStat
	h.db.Model(&models.AtlasContent{}).
		Select("platform, COUNT(*) as count, COALESCE(SUM(views), 0) as views, COALESCE(SUM(revenue_generated), 0) as revenue").
		Group("platform").Scan(&byPlatform)

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"total_pieces":  totalPieces,
		"total_views":   totalViews,
		"total_likes":   totalLikes,
		"total_revenue": totalRevenue,
		"by_platform":   byPlatform,
	}})
}

func (h *AtlasHandler) GetContentIdeas(c *gin.Context) {
	var content []models.AtlasContent
	h.db.Where("status = ?", "idea").Order("created_at DESC").Find(&content)
	c.JSON(http.StatusOK, gin.H{"data": content})
}

func (h *AtlasHandler) GetPublishedThisWeek(c *gin.Context) {
	now := time.Now()
	weekStart := now.AddDate(0, 0, -int(now.Weekday()))
	weekStart = time.Date(weekStart.Year(), weekStart.Month(), weekStart.Day(), 0, 0, 0, 0, weekStart.Location())

	var content []models.AtlasContent
	h.db.Where("status = ? AND publish_date >= ?", "published", weekStart).Order("publish_date DESC").Find(&content)
	c.JSON(http.StatusOK, gin.H{"data": content})
}

// ============================================================
// Digital Products
// ============================================================

func (h *AtlasHandler) ListAtlasProducts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	productType := c.Query("type")
	status := c.Query("status")
	category := c.Query("category")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	q := h.db.Model(&models.AtlasProduct{})
	if productType != "" {
		q = q.Where("type = ?", productType)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if category != "" {
		q = q.Where("category = ?", category)
	}

	var total int64
	q.Count(&total)

	var products []models.AtlasProduct
	q.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&products)

	c.JSON(http.StatusOK, gin.H{
		"data": products,
		"meta": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"pages":     int(math.Ceil(float64(total) / float64(pageSize))),
		},
	})
}

func (h *AtlasHandler) CreateAtlasProduct(c *gin.Context) {
	var product models.AtlasProduct
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	product.TenantID = 1
	if product.Status == "" {
		product.Status = models.AtlasProductStatusPlanned
	}
	if err := h.db.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": product})
}

func (h *AtlasHandler) UpdateAtlasProduct(c *gin.Context) {
	id := c.Param("id")
	var product models.AtlasProduct
	if err := h.db.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sanitizeUpdates(input)
	h.db.Model(&product).Updates(input)
	h.db.First(&product, id)
	c.JSON(http.StatusOK, gin.H{"data": product})
}

func (h *AtlasHandler) GetAtlasProductStats(c *gin.Context) {
	var totalProducts int64
	var totalRevenue float64
	var totalSales int64

	h.db.Model(&models.AtlasProduct{}).Count(&totalProducts)
	h.db.Model(&models.AtlasProduct{}).Select("COALESCE(SUM(total_revenue), 0)").Scan(&totalRevenue)
	h.db.Model(&models.AtlasProduct{}).Select("COALESCE(SUM(total_sales), 0)").Scan(&totalSales)

	// Best sellers
	var bestSellers []models.AtlasProduct
	h.db.Where("total_sales > 0").Order("total_sales DESC").Limit(10).Find(&bestSellers)

	type TypeStat struct {
		Type    string  `json:"type"`
		Count   int64   `json:"count"`
		Revenue float64 `json:"revenue"`
	}
	var byType []TypeStat
	h.db.Model(&models.AtlasProduct{}).
		Select("type, COUNT(*) as count, COALESCE(SUM(total_revenue), 0) as revenue").
		Group("type").Scan(&byType)

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"total_products": totalProducts,
		"total_revenue":  totalRevenue,
		"total_sales":    totalSales,
		"best_sellers":   bestSellers,
		"by_type":        byType,
	}})
}

func (h *AtlasHandler) GetAtlasProductCatalog(c *gin.Context) {
	type CategoryGroup struct {
		Category string                `json:"category"`
		Products []models.AtlasProduct `json:"products"`
	}
	var categories []string
	h.db.Model(&models.AtlasProduct{}).Distinct("category").Where("category != ''").Pluck("category", &categories)

	var catalog []CategoryGroup
	for _, cat := range categories {
		var products []models.AtlasProduct
		h.db.Where("category = ?", cat).Order("name ASC").Find(&products)
		catalog = append(catalog, CategoryGroup{Category: cat, Products: products})
	}
	c.JSON(http.StatusOK, gin.H{"data": catalog})
}

func (h *AtlasHandler) GetAtlasProductPipeline(c *gin.Context) {
	var products []models.AtlasProduct
	h.db.Where("status IN (?, ?)", "planned", "building").Order("created_at DESC").Find(&products)
	c.JSON(http.StatusOK, gin.H{"data": products})
}

// ============================================================
// Revenue & Financial Tracking
// ============================================================

func (h *AtlasHandler) ListRevenue(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	stream := c.Query("stream")
	from := c.Query("from")
	to := c.Query("to")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	q := h.db.Model(&models.AtlasRevenueEntry{})
	if stream != "" {
		q = q.Where("stream = ?", stream)
	}
	if from != "" {
		q = q.Where("payment_date >= ?", from)
	}
	if to != "" {
		q = q.Where("payment_date <= ?", to)
	}

	var total int64
	q.Count(&total)

	var entries []models.AtlasRevenueEntry
	q.Preload("Contact").Order("payment_date DESC").Offset(offset).Limit(pageSize).Find(&entries)

	c.JSON(http.StatusOK, gin.H{
		"data": entries,
		"meta": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"pages":     int(math.Ceil(float64(total) / float64(pageSize))),
		},
	})
}

func (h *AtlasHandler) CreateRevenue(c *gin.Context) {
	var entry models.AtlasRevenueEntry
	if err := c.ShouldBindJSON(&entry); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	entry.TenantID = 1
	if err := h.db.Create(&entry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record revenue"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": entry})
}

func (h *AtlasHandler) GetRevenueSummary(c *gin.Context) {
	type MonthlyStream struct {
		Month  string  `json:"month"`
		Stream string  `json:"stream"`
		Count  int64   `json:"count"`
		Total  float64 `json:"total"`
	}
	var summary []MonthlyStream
	h.db.Model(&models.AtlasRevenueEntry{}).
		Select("TO_CHAR(payment_date, 'YYYY-MM') as month, stream, COUNT(*) as count, COALESCE(SUM(amount), 0) as total").
		Where("payment_date IS NOT NULL").
		Group("TO_CHAR(payment_date, 'YYYY-MM'), stream").
		Order("month DESC").Scan(&summary)
	c.JSON(http.StatusOK, gin.H{"data": summary})
}

func (h *AtlasHandler) GetWeeklyRevenue(c *gin.Context) {
	now := time.Now()
	weekStart := now.AddDate(0, 0, -int(now.Weekday()))
	weekStart = time.Date(weekStart.Year(), weekStart.Month(), weekStart.Day(), 0, 0, 0, 0, weekStart.Location())

	var total float64
	var count int64
	h.db.Model(&models.AtlasRevenueEntry{}).Where("payment_date >= ?", weekStart).Count(&count)
	h.db.Model(&models.AtlasRevenueEntry{}).Where("payment_date >= ?", weekStart).Select("COALESCE(SUM(amount), 0)").Scan(&total)

	type StreamTotal struct {
		Stream string  `json:"stream"`
		Total  float64 `json:"total"`
	}
	var byStream []StreamTotal
	h.db.Model(&models.AtlasRevenueEntry{}).
		Select("stream, COALESCE(SUM(amount), 0) as total").
		Where("payment_date >= ?", weekStart).Group("stream").Scan(&byStream)

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"total":     total,
		"count":     count,
		"by_stream": byStream,
	}})
}

func (h *AtlasHandler) GetMonthlyRevenue(c *gin.Context) {
	now := time.Now()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	var total float64
	var count int64
	h.db.Model(&models.AtlasRevenueEntry{}).Where("payment_date >= ?", monthStart).Count(&count)
	h.db.Model(&models.AtlasRevenueEntry{}).Where("payment_date >= ?", monthStart).Select("COALESCE(SUM(amount), 0)").Scan(&total)

	type StreamTotal struct {
		Stream string  `json:"stream"`
		Total  float64 `json:"total"`
	}
	var byStream []StreamTotal
	h.db.Model(&models.AtlasRevenueEntry{}).
		Select("stream, COALESCE(SUM(amount), 0) as total").
		Where("payment_date >= ?", monthStart).Group("stream").Scan(&byStream)

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"total":     total,
		"count":     count,
		"by_stream": byStream,
	}})
}

func (h *AtlasHandler) GetRevenueByStream(c *gin.Context) {
	type StreamSummary struct {
		Stream string  `json:"stream"`
		Count  int64   `json:"count"`
		Total  float64 `json:"total"`
	}
	var streams []StreamSummary
	h.db.Model(&models.AtlasRevenueEntry{}).
		Select("stream, COUNT(*) as count, COALESCE(SUM(amount), 0) as total").
		Group("stream").Order("total DESC").Scan(&streams)
	c.JSON(http.StatusOK, gin.H{"data": streams})
}

func (h *AtlasHandler) GetMRR(c *gin.Context) {
	var agentMRR float64
	var activeAgents int64
	h.db.Model(&models.AtlasAgentClient{}).Where("status = ?", "active").Count(&activeAgents)
	h.db.Model(&models.AtlasAgentClient{}).Where("status = ?", "active").Select("COALESCE(SUM(monthly_fee), 0)").Scan(&agentMRR)

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"agent_mrr":     agentMRR,
		"agent_arr":     agentMRR * 12,
		"active_agents": activeAgents,
	}})
}

// ============================================================
// Daily Operations Log
// ============================================================

func (h *AtlasHandler) ListDailyLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	var total int64
	h.db.Model(&models.AtlasDailyLog{}).Count(&total)

	var logs []models.AtlasDailyLog
	h.db.Order("date DESC").Offset(offset).Limit(pageSize).Find(&logs)

	c.JSON(http.StatusOK, gin.H{
		"data": logs,
		"meta": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"pages":     int(math.Ceil(float64(total) / float64(pageSize))),
		},
	})
}

func (h *AtlasHandler) GetTodayLog(c *gin.Context) {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	var log models.AtlasDailyLog
	if err := h.db.Where("date = ?", today).First(&log).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"data": nil})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": log})
}

func (h *AtlasHandler) CreateOrUpdateLog(c *gin.Context) {
	var input models.AtlasDailyLog
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.TenantID = 1
	if input.Date.IsZero() {
		now := time.Now()
		input.Date = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	}

	var existing models.AtlasDailyLog
	if err := h.db.Where("date = ?", input.Date).First(&existing).Error; err == nil {
		h.db.Model(&existing).Updates(map[string]interface{}{
			"morning_brief":     input.MorningBrief,
			"eod_review":        input.EODReview,
			"emails_sent":       input.EmailsSent,
			"emails_received":   input.EmailsReceived,
			"prospects_found":   input.ProspectsFound,
			"students_enrolled": input.StudentsEnrolled,
			"content_published": input.ContentPublished,
			"courses_created":   input.CoursesCreated,
			"revenue_today":     input.RevenueToday,
			"commands_run":      input.CommandsRun,
			"notes":             input.Notes,
		})
		h.db.First(&existing, existing.ID)
		c.JSON(http.StatusOK, gin.H{"data": existing})
		return
	}

	if err := h.db.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create log"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": input})
}

func (h *AtlasHandler) GetStreak(c *gin.Context) {
	var logs []models.AtlasDailyLog
	h.db.Order("date DESC").Limit(365).Find(&logs)

	streak := 0
	if len(logs) == 0 {
		c.JSON(http.StatusOK, gin.H{"data": gin.H{"streak": 0}})
		return
	}

	today := time.Now()
	today = time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())

	for i, log := range logs {
		expected := today.AddDate(0, 0, -i)
		expected = time.Date(expected.Year(), expected.Month(), expected.Day(), 0, 0, 0, 0, expected.Location())
		logDate := time.Date(log.Date.Year(), log.Date.Month(), log.Date.Day(), 0, 0, 0, 0, log.Date.Location())
		if logDate.Equal(expected) {
			streak++
		} else {
			break
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"streak": streak}})
}

func (h *AtlasHandler) GetWeeklyLogSummary(c *gin.Context) {
	now := time.Now()
	weekStart := now.AddDate(0, 0, -int(now.Weekday()))
	weekStart = time.Date(weekStart.Year(), weekStart.Month(), weekStart.Day(), 0, 0, 0, 0, weekStart.Location())

	var logs []models.AtlasDailyLog
	h.db.Where("date >= ?", weekStart).Order("date ASC").Find(&logs)

	var totalEmails, totalProspects, totalStudents int
	var totalRevenue float64
	for _, log := range logs {
		totalEmails += log.EmailsSent
		totalProspects += log.ProspectsFound
		totalStudents += log.StudentsEnrolled
		totalRevenue += log.RevenueToday
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"days_logged":      len(logs),
		"total_emails":     totalEmails,
		"total_prospects":  totalProspects,
		"total_students":   totalStudents,
		"total_revenue":    totalRevenue,
		"logs":             logs,
	}})
}

// ============================================================
// Website Maintenance
// ============================================================

func (h *AtlasHandler) ListWebsiteTasks(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	site := c.Query("site")
	taskType := c.Query("type")
	status := c.Query("status")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	q := h.db.Model(&models.AtlasWebsiteTask{})
	if site != "" {
		q = q.Where("site = ?", site)
	}
	if taskType != "" {
		q = q.Where("type = ?", taskType)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}

	var total int64
	q.Count(&total)

	var tasks []models.AtlasWebsiteTask
	q.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&tasks)

	c.JSON(http.StatusOK, gin.H{
		"data": tasks,
		"meta": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"pages":     int(math.Ceil(float64(total) / float64(pageSize))),
		},
	})
}

func (h *AtlasHandler) CreateWebsiteTask(c *gin.Context) {
	var task models.AtlasWebsiteTask
	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	task.TenantID = 1
	if task.Status == "" {
		task.Status = models.AtlasWebTaskStatusPlanned
	}
	if err := h.db.Create(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": task})
}

func (h *AtlasHandler) UpdateWebsiteTask(c *gin.Context) {
	id := c.Param("id")
	var task models.AtlasWebsiteTask
	if err := h.db.First(&task, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sanitizeUpdates(input)
	h.db.Model(&task).Updates(input)
	h.db.First(&task, id)
	c.JSON(http.StatusOK, gin.H{"data": task})
}

func (h *AtlasHandler) GetSiteAudit(c *gin.Context) {
	site := c.Param("site")
	var tasks []models.AtlasWebsiteTask
	h.db.Where("site = ? AND type = ?", site, "seo_audit").Order("created_at DESC").Limit(10).Find(&tasks)
	c.JSON(http.StatusOK, gin.H{"data": tasks})
}

func (h *AtlasHandler) GetSiteBlog(c *gin.Context) {
	site := c.Param("site")
	var tasks []models.AtlasWebsiteTask
	h.db.Where("site = ? AND type = ?", site, "blog_post").Order("publish_date DESC").Find(&tasks)
	c.JSON(http.StatusOK, gin.H{"data": tasks})
}

// ============================================================
// Helpers
// ============================================================

func generateAtlasSlug(title string) string {
	slug := strings.ToLower(title)
	slug = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == ' ' || r == '-' {
			return r
		}
		return -1
	}, slug)
	slug = strings.ReplaceAll(slug, " ", "-")
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}
	slug = strings.Trim(slug, "-")
	return slug
}
