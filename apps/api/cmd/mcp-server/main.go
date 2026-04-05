package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
	"gorm.io/gorm"

	"gritcms/apps/api/internal/database"
	"gritcms/apps/api/internal/models"
)

type contextKey string

const ctxKeyAPIKey contextKey = "apiKey"

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	db, err := database.Connect(dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// API key for remote access (set ATLAS_API_KEY env var to secure the server)
	apiKey := os.Getenv("ATLAS_API_KEY")

	s := server.NewMCPServer("atlas-crm", "1.0.0",
		server.WithToolCapabilities(true),
	)

	// --- Dashboard ---
	s.AddTool(mcp.NewTool("getDashboard",
		mcp.WithDescription("Get ATLAS CRM dashboard with aggregated KPIs across all modules"),
	), getDashboard(db))

	// --- Contacts ---
	s.AddTool(mcp.NewTool("createContact",
		mcp.WithDescription("Create a new contact in the ATLAS CRM"),
		mcp.WithString("name", mcp.Required(), mcp.Description("Contact's full name")),
		mcp.WithString("email", mcp.Description("Email address")),
		mcp.WithString("type", mcp.Description("Contact type: prospect, client, student, agent_client, partner")),
		mcp.WithString("source", mcp.Description("Lead source: youtube, linkedin, tiktok, referral, cold_outreach, website, gumroad")),
		mcp.WithString("icp_profile", mcp.Description("ICP profile grade: A, B, C, D, E, F")),
		mcp.WithString("company", mcp.Description("Company name")),
		mcp.WithString("role", mcp.Description("Job title or role")),
		mcp.WithString("phone", mcp.Description("Phone number")),
		mcp.WithString("linkedin_url", mcp.Description("LinkedIn profile URL")),
		mcp.WithString("notes", mcp.Description("Notes about the contact")),
		mcp.WithNumber("deal_value", mcp.Description("Deal value amount")),
		mcp.WithString("currency", mcp.Description("Currency code (default: UGX)")),
	), createContact(db))

	s.AddTool(mcp.NewTool("updateContactStatus",
		mcp.WithDescription("Update the status of an existing contact"),
		mcp.WithNumber("id", mcp.Required(), mcp.Description("Contact ID")),
		mcp.WithString("status", mcp.Required(), mcp.Description("New status: new, contacted, replied, call_booked, proposal_sent, won, lost, churned")),
	), updateContactStatus(db))

	s.AddTool(mcp.NewTool("getContactsPipeline",
		mcp.WithDescription("Get contacts grouped by status (pipeline view)"),
	), getContactsPipeline(db))

	s.AddTool(mcp.NewTool("getColdLeads",
		mcp.WithDescription("Get leads not contacted in X days"),
		mcp.WithNumber("days", mcp.Description("Days since last contact (default: 5)")),
	), getColdLeads(db))

	s.AddTool(mcp.NewTool("getFollowupsDueToday",
		mcp.WithDescription("Get contacts with followups due today"),
	), getFollowupsDueToday(db))

	// --- Interactions ---
	s.AddTool(mcp.NewTool("logInteraction",
		mcp.WithDescription("Log an interaction with a contact"),
		mcp.WithNumber("contact_id", mcp.Required(), mcp.Description("Contact ID")),
		mcp.WithString("type", mcp.Required(), mcp.Description("Type: email_sent, email_received, call, meeting, linkedin_dm, whatsapp, note")),
		mcp.WithString("channel", mcp.Description("Channel: gmail, linkedin, whatsapp, zoom, in_person")),
		mcp.WithString("subject", mcp.Description("Subject or title")),
		mcp.WithString("body", mcp.Description("Body or note content")),
		mcp.WithString("direction", mcp.Description("Direction: inbound, outbound")),
	), logInteraction(db))

	s.AddTool(mcp.NewTool("getTodaysInteractions",
		mcp.WithDescription("Get all interactions logged today"),
	), getTodaysInteractions(db))

	// --- Projects ---
	s.AddTool(mcp.NewTool("createProject",
		mcp.WithDescription("Create a new project/deal"),
		mcp.WithString("name", mcp.Required(), mcp.Description("Project name")),
		mcp.WithNumber("contact_id", mcp.Description("Contact ID to link")),
		mcp.WithNumber("deal_value", mcp.Description("Deal value")),
		mcp.WithString("currency", mcp.Description("Currency (default: UGX)")),
		mcp.WithString("description", mcp.Description("Project description")),
	), createProject(db))

	s.AddTool(mcp.NewTool("updateProjectStage",
		mcp.WithDescription("Update the stage of a project"),
		mcp.WithNumber("id", mcp.Required(), mcp.Description("Project ID")),
		mcp.WithString("stage", mcp.Required(), mcp.Description("New stage: lead, qualified, proposal, closing, won, lost")),
	), updateProjectStage(db))

	s.AddTool(mcp.NewTool("getProjectPipeline",
		mcp.WithDescription("Get projects grouped by stage"),
	), getProjectPipeline(db))

	// --- Courses ---
	s.AddTool(mcp.NewTool("createCourse",
		mcp.WithDescription("Create a new course"),
		mcp.WithString("title", mcp.Required(), mcp.Description("Course title")),
		mcp.WithString("pillar", mcp.Description("Content pillar: go_backend, nextjs, react_native, devops, ai, architecture, career")),
		mcp.WithString("duration", mcp.Description("Duration: 1-day, 3-day, 5-day")),
		mcp.WithNumber("price", mcp.Description("Price")),
		mcp.WithString("currency", mcp.Description("Currency (default: USD)")),
	), createCourse(db))

	s.AddTool(mcp.NewTool("enrollStudent",
		mcp.WithDescription("Enroll a student in a course"),
		mcp.WithNumber("course_id", mcp.Required(), mcp.Description("Course ID")),
		mcp.WithNumber("contact_id", mcp.Required(), mcp.Description("Contact ID")),
		mcp.WithNumber("amount", mcp.Description("Amount paid")),
	), enrollStudent(db))

	s.AddTool(mcp.NewTool("getCourseStats",
		mcp.WithDescription("Get course statistics (revenue, student counts)"),
	), getCourseStats(db))

	// --- Agent Clients ---
	s.AddTool(mcp.NewTool("createAgentClient",
		mcp.WithDescription("Create a new AI agent client"),
		mcp.WithNumber("contact_id", mcp.Description("Contact ID")),
		mcp.WithString("career", mcp.Required(), mcp.Description("Client career: doctor, lawyer, real_estate, accountant, etc.")),
		mcp.WithString("tier", mcp.Description("Tier: basic, pro, enterprise")),
		mcp.WithNumber("setup_fee", mcp.Description("Setup fee")),
		mcp.WithNumber("monthly_fee", mcp.Description("Monthly fee")),
	), createAgentClient(db))

	s.AddTool(mcp.NewTool("updateAgentClientStatus",
		mcp.WithDescription("Update agent client status"),
		mcp.WithNumber("id", mcp.Required(), mcp.Description("Agent client ID")),
		mcp.WithString("status", mcp.Required(), mcp.Description("New status: discovery, proposal, building, delivered, active, churned")),
	), updateAgentClientStatus(db))

	s.AddTool(mcp.NewTool("getActiveAgentClients",
		mcp.WithDescription("Get active agent clients sorted by next maintenance date"),
	), getActiveAgentClients(db))

	s.AddTool(mcp.NewTool("getAgentMRR",
		mcp.WithDescription("Get monthly recurring revenue from agent clients"),
	), getAgentMRR(db))

	// --- Content ---
	s.AddTool(mcp.NewTool("createContent",
		mcp.WithDescription("Create a new content piece"),
		mcp.WithString("title", mcp.Required(), mcp.Description("Content title")),
		mcp.WithString("platform", mcp.Required(), mcp.Description("Platform: youtube, linkedin, tiktok, blog")),
		mcp.WithString("type", mcp.Description("Type: video, post, carousel, article, reel, short")),
		mcp.WithString("pillar", mcp.Description("Content pillar")),
		mcp.WithString("product_tie_in", mcp.Description("Product this promotes")),
	), createContent(db))

	s.AddTool(mcp.NewTool("updateContentStatus",
		mcp.WithDescription("Update content status and optionally add URL"),
		mcp.WithNumber("id", mcp.Required(), mcp.Description("Content ID")),
		mcp.WithString("status", mcp.Required(), mcp.Description("New status: idea, scripted, recording, editing, published, archived")),
		mcp.WithString("url", mcp.Description("Published URL")),
	), updateContentStatus(db))

	s.AddTool(mcp.NewTool("getContentStats",
		mcp.WithDescription("Get content statistics by platform"),
	), getContentStats(db))

	// --- Products ---
	s.AddTool(mcp.NewTool("createProduct",
		mcp.WithDescription("Create a new digital product"),
		mcp.WithString("name", mcp.Required(), mcp.Description("Product name")),
		mcp.WithString("type", mcp.Required(), mcp.Description("Type: source_code, starter_kit, course, template, ebook")),
		mcp.WithNumber("price", mcp.Description("Price")),
		mcp.WithString("gumroad_url", mcp.Description("Gumroad URL")),
		mcp.WithString("category", mcp.Description("Product category")),
	), createProduct(db))

	s.AddTool(mcp.NewTool("updateProductSales",
		mcp.WithDescription("Update product sales count and revenue"),
		mcp.WithNumber("id", mcp.Required(), mcp.Description("Product ID")),
		mcp.WithNumber("sales_count", mcp.Required(), mcp.Description("New total sales count")),
		mcp.WithNumber("revenue", mcp.Required(), mcp.Description("New total revenue")),
	), updateProductSales(db))

	s.AddTool(mcp.NewTool("getProductStats",
		mcp.WithDescription("Get product statistics (revenue, best sellers)"),
	), getProductStats(db))

	// --- Revenue ---
	s.AddTool(mcp.NewTool("recordRevenue",
		mcp.WithDescription("Record a revenue entry"),
		mcp.WithString("stream", mcp.Required(), mcp.Description("Stream: project, dgateway, course, source_code, starter_kit, agent_setup, agent_monthly, training, consulting")),
		mcp.WithNumber("amount", mcp.Required(), mcp.Description("Amount")),
		mcp.WithString("currency", mcp.Description("Currency (default: UGX)")),
		mcp.WithString("description", mcp.Description("Description")),
		mcp.WithString("payment_method", mcp.Description("Payment method: mobile_money, bank_transfer, stripe, gumroad, cash")),
		mcp.WithNumber("contact_id", mcp.Description("Contact ID")),
	), recordRevenue(db))

	s.AddTool(mcp.NewTool("getWeeklyRevenue",
		mcp.WithDescription("Get revenue for this week"),
	), getWeeklyRevenue(db))

	s.AddTool(mcp.NewTool("getMonthlyRevenue",
		mcp.WithDescription("Get revenue for this month"),
	), getMonthlyRevenue(db))

	s.AddTool(mcp.NewTool("getRevenueByStream",
		mcp.WithDescription("Get revenue breakdown by stream"),
	), getRevenueByStream(db))

	s.AddTool(mcp.NewTool("getMRR",
		mcp.WithDescription("Get monthly recurring revenue"),
	), getMRR(db))

	// --- Daily Logs ---
	s.AddTool(mcp.NewTool("logDailyActivity",
		mcp.WithDescription("Create or update today's daily log"),
		mcp.WithNumber("emails_sent", mcp.Description("Emails sent today")),
		mcp.WithNumber("emails_received", mcp.Description("Emails received today")),
		mcp.WithNumber("prospects_found", mcp.Description("Prospects found today")),
		mcp.WithNumber("students_enrolled", mcp.Description("Students enrolled today")),
		mcp.WithNumber("revenue_today", mcp.Description("Revenue earned today")),
		mcp.WithString("notes", mcp.Description("Notes for today")),
	), logDailyActivity(db))

	s.AddTool(mcp.NewTool("getTodayLog",
		mcp.WithDescription("Get today's daily operations log"),
	), getTodayLog(db))

	s.AddTool(mcp.NewTool("getWeeklySummary",
		mcp.WithDescription("Get weekly summary of daily operations"),
	), getWeeklySummary(db))

	s.AddTool(mcp.NewTool("getStreak",
		mcp.WithDescription("Get consecutive days with logged activity"),
	), getStreak(db))

	// Determine transport mode: HTTP (default) or stdio (for local dev)
	mode := os.Getenv("MCP_TRANSPORT")
	if mode == "" {
		mode = "http"
	}

	if mode == "stdio" {
		log.Println("ATLAS CRM MCP server starting in stdio mode...")
		if err := server.ServeStdio(s); err != nil {
			log.Fatalf("MCP server error: %v", err)
		}
		return
	}

	// HTTP mode — remote Streamable HTTP MCP server
	port := os.Getenv("MCP_PORT")
	if port == "" {
		port = "9090"
	}

	// Build server options
	opts := []server.StreamableHTTPOption{
		server.WithEndpointPath("/mcp"),
	}

	// Add API key authentication if configured
	if apiKey != "" {
		opts = append(opts, server.WithHTTPContextFunc(func(ctx context.Context, r *http.Request) context.Context {
			key := r.Header.Get("Authorization")
			if key == "" {
				key = r.Header.Get("X-API-Key")
			}
			// Strip "Bearer " prefix if present
			if len(key) > 7 && key[:7] == "Bearer " {
				key = key[7:]
			}
			return context.WithValue(ctx, ctxKeyAPIKey, key)
		}))
		log.Printf("API key authentication enabled")
	}

	httpServer := server.NewStreamableHTTPServer(s, opts...)

	log.Printf("ATLAS CRM MCP server starting on http://0.0.0.0:%s/mcp", port)
	if apiKey != "" {
		log.Printf("Secured with API key (set Authorization or X-API-Key header)")
	} else {
		log.Printf("WARNING: No ATLAS_API_KEY set — server is unauthenticated!")
	}

	if err := httpServer.Start(":" + port); err != nil {
		log.Fatalf("MCP server error: %v", err)
	}
}

// --- Auth helper ---
func validateAPIKey(ctx context.Context) error {
	expected := os.Getenv("ATLAS_API_KEY")
	if expected == "" {
		return nil // no auth required
	}
	key, _ := ctx.Value(ctxKeyAPIKey).(string)
	if key != expected {
		return fmt.Errorf("unauthorized: invalid API key")
	}
	return nil
}

// --- Helper to convert result to MCP content ---
func jsonResult(v interface{}) *mcp.CallToolResult {
	b, _ := json.MarshalIndent(v, "", "  ")
	return mcp.NewToolResultText(string(b))
}

func errResult(msg string) *mcp.CallToolResult {
	return mcp.NewToolResultError(msg)
}

func extractArgs(req mcp.CallToolRequest) map[string]interface{} {
	if req.Params.Arguments == nil {
		return map[string]interface{}{}
	}
	if m, ok := req.Params.Arguments.(map[string]interface{}); ok {
		return m
	}
	// Try JSON round-trip
	b, err := json.Marshal(req.Params.Arguments)
	if err != nil {
		return map[string]interface{}{}
	}
	var m map[string]interface{}
	if err := json.Unmarshal(b, &m); err != nil {
		return map[string]interface{}{}
	}
	return m
}

func getStr(args map[string]interface{}, key string) string {
	if v, ok := args[key]; ok {
		return fmt.Sprintf("%v", v)
	}
	return ""
}

func getFloat(args map[string]interface{}, key string) float64 {
	if v, ok := args[key]; ok {
		switch n := v.(type) {
		case float64:
			return n
		case string:
			f, _ := strconv.ParseFloat(n, 64)
			return f
		}
	}
	return 0
}

func getUint(args map[string]interface{}, key string) uint {
	return uint(getFloat(args, key))
}

// ============================================================
// Tool Handlers
// ============================================================

func getDashboard(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		var contactCount, projectCount, agentCount int64
		db.Model(&models.AtlasContact{}).Count(&contactCount)
		db.Model(&models.AtlasProject{}).Count(&projectCount)
		db.Model(&models.AtlasAgentClient{}).Count(&agentCount)

		now := time.Now()
		monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		var monthlyRevenue, mrr float64
		db.Model(&models.AtlasRevenueEntry{}).Where("payment_date >= ?", monthStart).Select("COALESCE(SUM(amount), 0)").Scan(&monthlyRevenue)
		db.Model(&models.AtlasAgentClient{}).Where("status = ?", "active").Select("COALESCE(SUM(monthly_fee), 0)").Scan(&mrr)

		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		tomorrow := today.AddDate(0, 0, 1)
		var followupsDue int64
		db.Model(&models.AtlasContact{}).Where("next_followup_at >= ? AND next_followup_at < ?", today, tomorrow).Count(&followupsDue)

		return jsonResult(map[string]interface{}{
			"contacts":        contactCount,
			"projects":        projectCount,
			"agent_clients":   agentCount,
			"monthly_revenue": monthlyRevenue,
			"mrr":             mrr,
			"followups_due":   followupsDue,
		}), nil
	}
}

func createContact(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		args := extractArgs(req)
		contact := models.AtlasContact{
			TenantID:    1,
			Name:        getStr(args, "name"),
			Email:       getStr(args, "email"),
			Phone:       getStr(args, "phone"),
			LinkedinURL: getStr(args, "linkedin_url"),
			Company:     getStr(args, "company"),
			Role:        getStr(args, "role"),
			Type:        getStr(args, "type"),
			Source:      getStr(args, "source"),
			ICPProfile:  getStr(args, "icp_profile"),
			Notes:       getStr(args, "notes"),
			DealValue:   getFloat(args, "deal_value"),
			Currency:    getStr(args, "currency"),
			Status:      "new",
		}
		if contact.Currency == "" {
			contact.Currency = "UGX"
		}
		if contact.Type == "" {
			contact.Type = "prospect"
		}
		if err := db.Create(&contact).Error; err != nil {
			return errResult("Failed to create contact: " + err.Error()), nil
		}
		return jsonResult(contact), nil
	}
}

func updateContactStatus(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		args := extractArgs(req)
		id := getUint(args, "id")
		status := getStr(args, "status")
		var contact models.AtlasContact
		if err := db.First(&contact, id).Error; err != nil {
			return errResult("Contact not found"), nil
		}
		db.Model(&contact).Update("status", status)
		db.First(&contact, id)
		return jsonResult(contact), nil
	}
}

func getContactsPipeline(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		type Group struct {
			Status string `json:"status"`
			Count  int64  `json:"count"`
		}
		var groups []Group
		db.Model(&models.AtlasContact{}).Select("status, COUNT(*) as count").Group("status").Order("count DESC").Scan(&groups)
		return jsonResult(groups), nil
	}
}

func getColdLeads(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		args := extractArgs(req)
		days := int(getFloat(args, "days"))
		if days < 1 {
			days = 5
		}
		cutoff := time.Now().AddDate(0, 0, -days)
		var contacts []models.AtlasContact
		db.Where("(last_contacted_at IS NULL OR last_contacted_at < ?) AND status NOT IN (?, ?)", cutoff, "won", "lost").
			Order("last_contacted_at ASC NULLS FIRST").Limit(20).Find(&contacts)
		return jsonResult(contacts), nil
	}
}

func getFollowupsDueToday(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		now := time.Now()
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		tomorrow := today.AddDate(0, 0, 1)
		var contacts []models.AtlasContact
		db.Where("next_followup_at >= ? AND next_followup_at < ?", today, tomorrow).Find(&contacts)
		return jsonResult(contacts), nil
	}
}

func logInteraction(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		args := extractArgs(req)
		interaction := models.AtlasInteraction{
			TenantID:  1,
			ContactID: getUint(args, "contact_id"),
			Type:      getStr(args, "type"),
			Channel:   getStr(args, "channel"),
			Subject:   getStr(args, "subject"),
			Body:      getStr(args, "body"),
			Direction: getStr(args, "direction"),
		}
		if err := db.Create(&interaction).Error; err != nil {
			return errResult("Failed to log interaction: " + err.Error()), nil
		}
		if interaction.Direction == "outbound" {
			now := time.Now()
			db.Model(&models.AtlasContact{}).Where("id = ?", interaction.ContactID).Update("last_contacted_at", now)
		}
		return jsonResult(interaction), nil
	}
}

func getTodaysInteractions(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		now := time.Now()
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		var interactions []models.AtlasInteraction
		db.Preload("Contact").Where("created_at >= ?", today).Order("created_at DESC").Find(&interactions)
		return jsonResult(interactions), nil
	}
}

func createProject(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		args := extractArgs(req)
		project := models.AtlasProject{
			TenantID:    1,
			Name:        getStr(args, "name"),
			Description: getStr(args, "description"),
			DealValue:   getFloat(args, "deal_value"),
			Currency:    getStr(args, "currency"),
			Status:      "discovery",
			Stage:       "lead",
		}
		if cid := getUint(args, "contact_id"); cid > 0 {
			project.ContactID = &cid
		}
		if project.Currency == "" {
			project.Currency = "UGX"
		}
		if err := db.Create(&project).Error; err != nil {
			return errResult("Failed to create project: " + err.Error()), nil
		}
		return jsonResult(project), nil
	}
}

func updateProjectStage(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		args := extractArgs(req)
		id := getUint(args, "id")
		stage := getStr(args, "stage")
		var project models.AtlasProject
		if err := db.First(&project, id).Error; err != nil {
			return errResult("Project not found"), nil
		}
		db.Model(&project).Update("stage", stage)
		db.Preload("Contact").First(&project, id)
		return jsonResult(project), nil
	}
}

func getProjectPipeline(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		type Group struct {
			Stage      string  `json:"stage"`
			Count      int64   `json:"count"`
			TotalValue float64 `json:"total_value"`
		}
		var groups []Group
		db.Model(&models.AtlasProject{}).
			Select("stage, COUNT(*) as count, COALESCE(SUM(deal_value), 0) as total_value").
			Group("stage").Scan(&groups)
		return jsonResult(groups), nil
	}
}

func createCourse(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		args := extractArgs(req)
		course := models.AtlasCourse{
			TenantID: 1,
			Title:    getStr(args, "title"),
			Pillar:   getStr(args, "pillar"),
			Duration: getStr(args, "duration"),
			Price:    getFloat(args, "price"),
			Currency: getStr(args, "currency"),
			Status:   "planned",
		}
		if course.Currency == "" {
			course.Currency = "USD"
		}
		if err := db.Create(&course).Error; err != nil {
			return errResult("Failed to create course: " + err.Error()), nil
		}
		return jsonResult(course), nil
	}
}

func enrollStudent(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		args := extractArgs(req)
		enrollment := models.AtlasEnrollment{
			TenantID:      1,
			CourseID:      getUint(args, "course_id"),
			ContactID:     getUint(args, "contact_id"),
			AmountPaid:    getFloat(args, "amount"),
			Status:        "enrolled",
			PaymentStatus: "pending",
			EnrolledAt:    time.Now(),
		}
		if enrollment.AmountPaid > 0 {
			enrollment.PaymentStatus = "paid"
		}
		if err := db.Create(&enrollment).Error; err != nil {
			return errResult("Failed to enroll student: " + err.Error()), nil
		}
		return jsonResult(enrollment), nil
	}
}

func getCourseStats(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		var totalCourses, publishedCourses, totalStudents int64
		var totalRevenue float64
		db.Model(&models.AtlasCourse{}).Count(&totalCourses)
		db.Model(&models.AtlasCourse{}).Where("status = ?", "published").Count(&publishedCourses)
		db.Model(&models.AtlasEnrollment{}).Count(&totalStudents)
		db.Model(&models.AtlasEnrollment{}).Where("payment_status = ?", "paid").Select("COALESCE(SUM(amount_paid), 0)").Scan(&totalRevenue)
		return jsonResult(map[string]interface{}{
			"total_courses": totalCourses, "published": publishedCourses,
			"students": totalStudents, "revenue": totalRevenue,
		}), nil
	}
}

func createAgentClient(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		args := extractArgs(req)
		client := models.AtlasAgentClient{
			TenantID:   1,
			Career:     getStr(args, "career"),
			Tier:       getStr(args, "tier"),
			SetupFee:   getFloat(args, "setup_fee"),
			MonthlyFee: getFloat(args, "monthly_fee"),
			Currency:   "UGX",
			Status:     "discovery",
		}
		if cid := getUint(args, "contact_id"); cid > 0 {
			client.ContactID = &cid
		}
		if client.Tier == "" {
			client.Tier = "basic"
		}
		if err := db.Create(&client).Error; err != nil {
			return errResult("Failed to create agent client: " + err.Error()), nil
		}
		return jsonResult(client), nil
	}
}

func updateAgentClientStatus(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		args := extractArgs(req)
		id := getUint(args, "id")
		status := getStr(args, "status")
		db.Model(&models.AtlasAgentClient{}).Where("id = ?", id).Update("status", status)
		var client models.AtlasAgentClient
		db.Preload("Contact").First(&client, id)
		return jsonResult(client), nil
	}
}

func getActiveAgentClients(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		var clients []models.AtlasAgentClient
		db.Preload("Contact").Where("status = ?", "active").Order("next_maintenance ASC").Find(&clients)
		return jsonResult(clients), nil
	}
}

func getAgentMRR(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		var mrr float64
		var activeCount int64
		db.Model(&models.AtlasAgentClient{}).Where("status = ?", "active").Count(&activeCount)
		db.Model(&models.AtlasAgentClient{}).Where("status = ?", "active").Select("COALESCE(SUM(monthly_fee), 0)").Scan(&mrr)
		return jsonResult(map[string]interface{}{"mrr": mrr, "arr": mrr * 12, "active_clients": activeCount}), nil
	}
}

func createContent(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		args := extractArgs(req)
		content := models.AtlasContent{
			TenantID:     1,
			Title:        getStr(args, "title"),
			Platform:     getStr(args, "platform"),
			Type:         getStr(args, "type"),
			Pillar:       getStr(args, "pillar"),
			ProductTieIn: getStr(args, "product_tie_in"),
			Status:       "idea",
		}
		if err := db.Create(&content).Error; err != nil {
			return errResult("Failed to create content: " + err.Error()), nil
		}
		return jsonResult(content), nil
	}
}

func updateContentStatus(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		args := extractArgs(req)
		id := getUint(args, "id")
		status := getStr(args, "status")
		url := getStr(args, "url")
		updates := map[string]interface{}{"status": status}
		if url != "" {
			updates["url"] = url
		}
		if status == "published" {
			now := time.Now()
			updates["publish_date"] = now
		}
		db.Model(&models.AtlasContent{}).Where("id = ?", id).Updates(updates)
		var content models.AtlasContent
		db.First(&content, id)
		return jsonResult(content), nil
	}
}

func getContentStats(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		type PlatformStat struct {
			Platform string  `json:"platform"`
			Count    int64   `json:"count"`
			Views    float64 `json:"views"`
		}
		var stats []PlatformStat
		db.Model(&models.AtlasContent{}).
			Select("platform, COUNT(*) as count, COALESCE(SUM(views), 0) as views").
			Group("platform").Scan(&stats)
		return jsonResult(stats), nil
	}
}

func createProduct(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		args := extractArgs(req)
		product := models.AtlasProduct{
			TenantID:   1,
			Name:       getStr(args, "name"),
			Type:       getStr(args, "type"),
			Price:      getFloat(args, "price"),
			GumroadURL: getStr(args, "gumroad_url"),
			Category:   getStr(args, "category"),
			Currency:   "USD",
			Status:     "planned",
		}
		if err := db.Create(&product).Error; err != nil {
			return errResult("Failed to create product: " + err.Error()), nil
		}
		return jsonResult(product), nil
	}
}

func updateProductSales(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		args := extractArgs(req)
		id := getUint(args, "id")
		sales := int(getFloat(args, "sales_count"))
		revenue := getFloat(args, "revenue")
		db.Model(&models.AtlasProduct{}).Where("id = ?", id).Updates(map[string]interface{}{
			"total_sales": sales, "total_revenue": revenue,
		})
		var product models.AtlasProduct
		db.First(&product, id)
		return jsonResult(product), nil
	}
}

func getProductStats(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		var totalProducts int64
		var totalRevenue float64
		db.Model(&models.AtlasProduct{}).Count(&totalProducts)
		db.Model(&models.AtlasProduct{}).Select("COALESCE(SUM(total_revenue), 0)").Scan(&totalRevenue)
		var bestSellers []models.AtlasProduct
		db.Where("total_sales > 0").Order("total_sales DESC").Limit(5).Find(&bestSellers)
		return jsonResult(map[string]interface{}{
			"total_products": totalProducts, "total_revenue": totalRevenue, "best_sellers": bestSellers,
		}), nil
	}
}

func recordRevenue(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		args := extractArgs(req)
		now := time.Now()
		entry := models.AtlasRevenueEntry{
			TenantID:      1,
			Stream:        getStr(args, "stream"),
			Amount:        getFloat(args, "amount"),
			Currency:      getStr(args, "currency"),
			Description:   getStr(args, "description"),
			PaymentMethod: getStr(args, "payment_method"),
			PaymentDate:   &now,
		}
		if cid := getUint(args, "contact_id"); cid > 0 {
			entry.ContactID = &cid
		}
		if entry.Currency == "" {
			entry.Currency = "UGX"
		}
		if err := db.Create(&entry).Error; err != nil {
			return errResult("Failed to record revenue: " + err.Error()), nil
		}
		return jsonResult(entry), nil
	}
}

func getWeeklyRevenue(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		now := time.Now()
		weekStart := now.AddDate(0, 0, -int(now.Weekday()))
		weekStart = time.Date(weekStart.Year(), weekStart.Month(), weekStart.Day(), 0, 0, 0, 0, weekStart.Location())
		var total float64
		db.Model(&models.AtlasRevenueEntry{}).Where("payment_date >= ?", weekStart).Select("COALESCE(SUM(amount), 0)").Scan(&total)
		return jsonResult(map[string]interface{}{"weekly_total": total}), nil
	}
}

func getMonthlyRevenue(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		now := time.Now()
		monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		var total float64
		db.Model(&models.AtlasRevenueEntry{}).Where("payment_date >= ?", monthStart).Select("COALESCE(SUM(amount), 0)").Scan(&total)
		return jsonResult(map[string]interface{}{"monthly_total": total}), nil
	}
}

func getRevenueByStream(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		type StreamSummary struct {
			Stream string  `json:"stream"`
			Count  int64   `json:"count"`
			Total  float64 `json:"total"`
		}
		var streams []StreamSummary
		db.Model(&models.AtlasRevenueEntry{}).
			Select("stream, COUNT(*) as count, COALESCE(SUM(amount), 0) as total").
			Group("stream").Order("total DESC").Scan(&streams)
		return jsonResult(streams), nil
	}
}

func getMRR(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		var mrr float64
		var activeCount int64
		db.Model(&models.AtlasAgentClient{}).Where("status = ?", "active").Count(&activeCount)
		db.Model(&models.AtlasAgentClient{}).Where("status = ?", "active").Select("COALESCE(SUM(monthly_fee), 0)").Scan(&mrr)
		return jsonResult(map[string]interface{}{"mrr": mrr, "arr": mrr * 12, "active_agents": activeCount}), nil
	}
}

func logDailyActivity(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		args := extractArgs(req)
		now := time.Now()
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

		var existing models.AtlasDailyLog
		if err := db.Where("date = ?", today).First(&existing).Error; err == nil {
			updates := map[string]interface{}{}
			if v := getFloat(args, "emails_sent"); v > 0 {
				updates["emails_sent"] = int(v)
			}
			if v := getFloat(args, "emails_received"); v > 0 {
				updates["emails_received"] = int(v)
			}
			if v := getFloat(args, "prospects_found"); v > 0 {
				updates["prospects_found"] = int(v)
			}
			if v := getFloat(args, "students_enrolled"); v > 0 {
				updates["students_enrolled"] = int(v)
			}
			if v := getFloat(args, "revenue_today"); v > 0 {
				updates["revenue_today"] = v
			}
			if v := getStr(args, "notes"); v != "" {
				updates["notes"] = v
			}
			db.Model(&existing).Updates(updates)
			db.First(&existing, existing.ID)
			return jsonResult(existing), nil
		}

		logEntry := models.AtlasDailyLog{
			TenantID:         1,
			Date:             today,
			EmailsSent:       int(getFloat(args, "emails_sent")),
			EmailsReceived:   int(getFloat(args, "emails_received")),
			ProspectsFound:   int(getFloat(args, "prospects_found")),
			StudentsEnrolled: int(getFloat(args, "students_enrolled")),
			RevenueToday:     getFloat(args, "revenue_today"),
			Notes:            getStr(args, "notes"),
		}
		if err := db.Create(&logEntry).Error; err != nil {
			return errResult("Failed to create log: " + err.Error()), nil
		}
		return jsonResult(logEntry), nil
	}
}

func getTodayLog(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		now := time.Now()
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		var logEntry models.AtlasDailyLog
		if err := db.Where("date = ?", today).First(&logEntry).Error; err != nil {
			return jsonResult(map[string]interface{}{"message": "No log for today yet"}), nil
		}
		return jsonResult(logEntry), nil
	}
}

func getWeeklySummary(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		now := time.Now()
		weekStart := now.AddDate(0, 0, -int(now.Weekday()))
		weekStart = time.Date(weekStart.Year(), weekStart.Month(), weekStart.Day(), 0, 0, 0, 0, weekStart.Location())
		var logs []models.AtlasDailyLog
		db.Where("date >= ?", weekStart).Order("date ASC").Find(&logs)
		var totalEmails, totalProspects int
		var totalRevenue float64
		for _, l := range logs {
			totalEmails += l.EmailsSent
			totalProspects += l.ProspectsFound
			totalRevenue += l.RevenueToday
		}
		return jsonResult(map[string]interface{}{
			"days_logged": len(logs), "total_emails": totalEmails,
			"total_prospects": totalProspects, "total_revenue": totalRevenue,
		}), nil
	}
}

func getStreak(db *gorm.DB) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := validateAPIKey(ctx); err != nil {
			return errResult(err.Error()), nil
		}
		var logs []models.AtlasDailyLog
		db.Order("date DESC").Limit(365).Find(&logs)
		streak := 0
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
		return jsonResult(map[string]interface{}{"streak": streak}), nil
	}
}
