package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/mark3labs/mcp-go/mcp"
	mcpserver "github.com/mark3labs/mcp-go/server"
	"gorm.io/gorm"

	"gritcms/apps/api/internal/models"
)

type mcpContextKey string

const mcpAPIKeyCtx mcpContextKey = "apiKey"

// MountMCP sets up the ATLAS CRM MCP server on the Gin router at /mcp.
func MountMCP(r *gin.Engine, db *gorm.DB, apiKey string) {
	s := mcpserver.NewMCPServer("atlas-crm", "1.0.0",
		mcpserver.WithToolCapabilities(true),
	)

	// Register all tools
	registerMCPTools(s, db)

	// Build HTTP server options
	opts := []mcpserver.StreamableHTTPOption{
		mcpserver.WithEndpointPath("/mcp"),
	}

	if apiKey != "" {
		opts = append(opts, mcpserver.WithHTTPContextFunc(func(ctx context.Context, r *http.Request) context.Context {
			key := r.Header.Get("Authorization")
			if key == "" {
				key = r.Header.Get("X-API-Key")
			}
			if len(key) > 7 && key[:7] == "Bearer " {
				key = key[7:]
			}
			return context.WithValue(ctx, mcpAPIKeyCtx, key)
		}))
	}

	httpServer := mcpserver.NewStreamableHTTPServer(s, opts...)

	// Mount on Gin — handle all methods at /mcp
	r.Any("/mcp", gin.WrapH(httpServer))

	if apiKey != "" {
		log.Println("ATLAS CRM MCP server mounted at /mcp (API key secured)")
	} else {
		log.Println("ATLAS CRM MCP server mounted at /mcp (WARNING: no API key set)")
	}
}

// --- Auth ---

func mcpValidateKey(ctx context.Context, apiKey string) error {
	if apiKey == "" {
		return nil
	}
	key, _ := ctx.Value(mcpAPIKeyCtx).(string)
	if key != apiKey {
		return fmt.Errorf("unauthorized: invalid API key")
	}
	return nil
}

// --- Helpers ---

func mcpJSON(v interface{}) *mcp.CallToolResult {
	b, _ := json.MarshalIndent(v, "", "  ")
	return mcp.NewToolResultText(string(b))
}

func mcpErr(msg string) *mcp.CallToolResult {
	return mcp.NewToolResultError(msg)
}

func mcpStr(args map[string]interface{}, key string) string {
	if v, ok := args[key]; ok {
		return fmt.Sprintf("%v", v)
	}
	return ""
}

func mcpFloat(args map[string]interface{}, key string) float64 {
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

func mcpUint(args map[string]interface{}, key string) uint {
	return uint(mcpFloat(args, key))
}

func mcpArgs(req mcp.CallToolRequest) map[string]interface{} {
	if req.Params.Arguments == nil {
		return map[string]interface{}{}
	}
	if m, ok := req.Params.Arguments.(map[string]interface{}); ok {
		return m
	}
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

// --- Tool Registration ---

func registerMCPTools(s *mcpserver.MCPServer, db *gorm.DB) {
	apiKey := ""
	// Read once at startup — handlers will use the stored value
	if v, ok := db.Get("atlas_api_key"); ok {
		apiKey, _ = v.(string)
	}

	// We'll capture it from env at the call site instead
	// Each handler checks ctx

	// Dashboard
	s.AddTool(mcp.NewTool("getDashboard",
		mcp.WithDescription("Get ATLAS CRM dashboard with aggregated KPIs"),
	), mcpGetDashboard(db, apiKey))

	// Contacts
	s.AddTool(mcp.NewTool("createContact",
		mcp.WithDescription("Create a new contact in ATLAS CRM"),
		mcp.WithString("name", mcp.Required(), mcp.Description("Full name")),
		mcp.WithString("email", mcp.Description("Email")),
		mcp.WithString("type", mcp.Description("prospect, client, student, agent_client, partner")),
		mcp.WithString("source", mcp.Description("youtube, linkedin, tiktok, referral, cold_outreach, website, gumroad")),
		mcp.WithString("icp_profile", mcp.Description("A, B, C, D, E, F")),
		mcp.WithString("company", mcp.Description("Company")),
		mcp.WithString("role", mcp.Description("Role")),
		mcp.WithString("phone", mcp.Description("Phone")),
		mcp.WithString("linkedin_url", mcp.Description("LinkedIn URL")),
		mcp.WithString("notes", mcp.Description("Notes")),
		mcp.WithNumber("deal_value", mcp.Description("Deal value")),
		mcp.WithString("currency", mcp.Description("Currency (default: UGX)")),
	), mcpCreateContact(db, apiKey))

	s.AddTool(mcp.NewTool("updateContactStatus",
		mcp.WithDescription("Update contact status"),
		mcp.WithNumber("id", mcp.Required(), mcp.Description("Contact ID")),
		mcp.WithString("status", mcp.Required(), mcp.Description("new, contacted, replied, call_booked, proposal_sent, won, lost, churned")),
	), mcpUpdateContactStatus(db, apiKey))

	s.AddTool(mcp.NewTool("getContactsPipeline",
		mcp.WithDescription("Get contacts grouped by status"),
	), mcpGetContactsPipeline(db, apiKey))

	s.AddTool(mcp.NewTool("getColdLeads",
		mcp.WithDescription("Get leads not contacted in X days"),
		mcp.WithNumber("days", mcp.Description("Days since last contact (default: 5)")),
	), mcpGetColdLeads(db, apiKey))

	s.AddTool(mcp.NewTool("getFollowupsDueToday",
		mcp.WithDescription("Get contacts with followups due today"),
	), mcpGetFollowupsDueToday(db, apiKey))

	// Interactions
	s.AddTool(mcp.NewTool("logInteraction",
		mcp.WithDescription("Log an interaction with a contact"),
		mcp.WithNumber("contact_id", mcp.Required(), mcp.Description("Contact ID")),
		mcp.WithString("type", mcp.Required(), mcp.Description("email_sent, email_received, call, meeting, linkedin_dm, whatsapp, note")),
		mcp.WithString("channel", mcp.Description("gmail, linkedin, whatsapp, zoom, in_person")),
		mcp.WithString("subject", mcp.Description("Subject")),
		mcp.WithString("body", mcp.Description("Body")),
		mcp.WithString("direction", mcp.Description("inbound, outbound")),
	), mcpLogInteraction(db, apiKey))

	s.AddTool(mcp.NewTool("getTodaysInteractions",
		mcp.WithDescription("Get all interactions logged today"),
	), mcpGetTodaysInteractions(db, apiKey))

	// Projects
	s.AddTool(mcp.NewTool("createProject",
		mcp.WithDescription("Create a new project/deal"),
		mcp.WithString("name", mcp.Required(), mcp.Description("Project name")),
		mcp.WithNumber("contact_id", mcp.Description("Contact ID")),
		mcp.WithNumber("deal_value", mcp.Description("Deal value")),
		mcp.WithString("currency", mcp.Description("Currency (default: UGX)")),
		mcp.WithString("description", mcp.Description("Description")),
	), mcpCreateProject(db, apiKey))

	s.AddTool(mcp.NewTool("updateProjectStage",
		mcp.WithDescription("Update project stage"),
		mcp.WithNumber("id", mcp.Required(), mcp.Description("Project ID")),
		mcp.WithString("stage", mcp.Required(), mcp.Description("lead, qualified, proposal, closing, won, lost")),
	), mcpUpdateProjectStage(db, apiKey))

	s.AddTool(mcp.NewTool("getProjectPipeline",
		mcp.WithDescription("Get projects grouped by stage"),
	), mcpGetProjectPipeline(db, apiKey))

	// Revenue
	s.AddTool(mcp.NewTool("recordRevenue",
		mcp.WithDescription("Record a revenue entry"),
		mcp.WithString("stream", mcp.Required(), mcp.Description("project, dgateway, course, source_code, starter_kit, agent_setup, agent_monthly, training, consulting")),
		mcp.WithNumber("amount", mcp.Required(), mcp.Description("Amount")),
		mcp.WithString("currency", mcp.Description("Currency (default: UGX)")),
		mcp.WithString("description", mcp.Description("Description")),
		mcp.WithString("payment_method", mcp.Description("mobile_money, bank_transfer, stripe, gumroad, cash")),
		mcp.WithNumber("contact_id", mcp.Description("Contact ID")),
	), mcpRecordRevenue(db, apiKey))

	s.AddTool(mcp.NewTool("getWeeklyRevenue",
		mcp.WithDescription("Get revenue for this week"),
	), mcpGetWeeklyRevenue(db, apiKey))

	s.AddTool(mcp.NewTool("getMonthlyRevenue",
		mcp.WithDescription("Get revenue for this month"),
	), mcpGetMonthlyRevenue(db, apiKey))

	s.AddTool(mcp.NewTool("getRevenueByStream",
		mcp.WithDescription("Get revenue breakdown by stream"),
	), mcpGetRevenueByStream(db, apiKey))

	s.AddTool(mcp.NewTool("getMRR",
		mcp.WithDescription("Get monthly recurring revenue from agent clients"),
	), mcpGetMRR(db, apiKey))

	// Agent Clients
	s.AddTool(mcp.NewTool("createAgentClient",
		mcp.WithDescription("Create a new AI agent client"),
		mcp.WithNumber("contact_id", mcp.Description("Contact ID")),
		mcp.WithString("career", mcp.Required(), mcp.Description("Client career")),
		mcp.WithString("tier", mcp.Description("basic, pro, enterprise")),
		mcp.WithNumber("setup_fee", mcp.Description("Setup fee")),
		mcp.WithNumber("monthly_fee", mcp.Description("Monthly fee")),
	), mcpCreateAgentClient(db, apiKey))

	s.AddTool(mcp.NewTool("getAgentMRR",
		mcp.WithDescription("Get agent MRR and active count"),
	), mcpGetAgentMRR(db, apiKey))

	// Content
	s.AddTool(mcp.NewTool("createContent",
		mcp.WithDescription("Create a new content piece"),
		mcp.WithString("title", mcp.Required(), mcp.Description("Title")),
		mcp.WithString("platform", mcp.Required(), mcp.Description("youtube, linkedin, tiktok, blog")),
		mcp.WithString("type", mcp.Description("video, post, carousel, article, reel, short")),
		mcp.WithString("pillar", mcp.Description("Content pillar")),
	), mcpCreateContent(db, apiKey))

	s.AddTool(mcp.NewTool("getContentStats",
		mcp.WithDescription("Get content stats by platform"),
	), mcpGetContentStats(db, apiKey))

	// Daily Logs
	s.AddTool(mcp.NewTool("logDailyActivity",
		mcp.WithDescription("Create or update today's daily log"),
		mcp.WithNumber("emails_sent", mcp.Description("Emails sent")),
		mcp.WithNumber("prospects_found", mcp.Description("Prospects found")),
		mcp.WithNumber("revenue_today", mcp.Description("Revenue today")),
		mcp.WithString("notes", mcp.Description("Notes")),
	), mcpLogDailyActivity(db, apiKey))

	s.AddTool(mcp.NewTool("getTodayLog",
		mcp.WithDescription("Get today's daily log"),
	), mcpGetTodayLog(db, apiKey))

	s.AddTool(mcp.NewTool("getStreak",
		mcp.WithDescription("Get consecutive days with activity"),
	), mcpGetStreak(db, apiKey))
}

// ============================================================
// Tool Handlers
// ============================================================

func mcpGetDashboard(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil {
			return mcpErr(err.Error()), nil
		}
		var contacts, projects, agents int64
		db.Model(&models.AtlasContact{}).Count(&contacts)
		db.Model(&models.AtlasProject{}).Count(&projects)
		db.Model(&models.AtlasAgentClient{}).Count(&agents)

		now := time.Now()
		monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		var monthlyRev, mrr float64
		db.Model(&models.AtlasRevenueEntry{}).Where("payment_date >= ?", monthStart).Select("COALESCE(SUM(amount), 0)").Scan(&monthlyRev)
		db.Model(&models.AtlasAgentClient{}).Where("status = ?", "active").Select("COALESCE(SUM(monthly_fee), 0)").Scan(&mrr)

		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		tomorrow := today.AddDate(0, 0, 1)
		var followups int64
		db.Model(&models.AtlasContact{}).Where("next_followup_at >= ? AND next_followup_at < ?", today, tomorrow).Count(&followups)

		return mcpJSON(map[string]interface{}{
			"contacts": contacts, "projects": projects, "agent_clients": agents,
			"monthly_revenue": monthlyRev, "mrr": mrr, "followups_due": followups,
		}), nil
	}
}

func mcpCreateContact(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil {
			return mcpErr(err.Error()), nil
		}
		args := mcpArgs(req)
		c := models.AtlasContact{
			TenantID: 1, Name: mcpStr(args, "name"), Email: mcpStr(args, "email"),
			Phone: mcpStr(args, "phone"), LinkedinURL: mcpStr(args, "linkedin_url"),
			Company: mcpStr(args, "company"), Role: mcpStr(args, "role"),
			Type: mcpStr(args, "type"), Source: mcpStr(args, "source"),
			ICPProfile: mcpStr(args, "icp_profile"), Notes: mcpStr(args, "notes"),
			DealValue: mcpFloat(args, "deal_value"), Currency: mcpStr(args, "currency"),
			Status: "new",
		}
		if c.Currency == "" { c.Currency = "UGX" }
		if c.Type == "" { c.Type = "prospect" }
		if err := db.Create(&c).Error; err != nil {
			return mcpErr("Failed: " + err.Error()), nil
		}
		return mcpJSON(c), nil
	}
}

func mcpUpdateContactStatus(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		args := mcpArgs(req)
		id := mcpUint(args, "id")
		var c models.AtlasContact
		if err := db.First(&c, id).Error; err != nil { return mcpErr("Not found"), nil }
		db.Model(&c).Update("status", mcpStr(args, "status"))
		db.First(&c, id)
		return mcpJSON(c), nil
	}
}

func mcpGetContactsPipeline(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		type G struct { Status string `json:"status"`; Count int64 `json:"count"` }
		var g []G
		db.Model(&models.AtlasContact{}).Select("status, COUNT(*) as count").Group("status").Order("count DESC").Scan(&g)
		return mcpJSON(g), nil
	}
}

func mcpGetColdLeads(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		args := mcpArgs(req)
		days := int(mcpFloat(args, "days"))
		if days < 1 { days = 5 }
		cutoff := time.Now().AddDate(0, 0, -days)
		var contacts []models.AtlasContact
		db.Where("(last_contacted_at IS NULL OR last_contacted_at < ?) AND status NOT IN (?, ?)", cutoff, "won", "lost").
			Order("last_contacted_at ASC NULLS FIRST").Limit(20).Find(&contacts)
		return mcpJSON(contacts), nil
	}
}

func mcpGetFollowupsDueToday(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		now := time.Now()
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		var contacts []models.AtlasContact
		db.Where("next_followup_at >= ? AND next_followup_at < ?", today, today.AddDate(0, 0, 1)).Find(&contacts)
		return mcpJSON(contacts), nil
	}
}

func mcpLogInteraction(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		args := mcpArgs(req)
		i := models.AtlasInteraction{
			TenantID: 1, ContactID: mcpUint(args, "contact_id"),
			Type: mcpStr(args, "type"), Channel: mcpStr(args, "channel"),
			Subject: mcpStr(args, "subject"), Body: mcpStr(args, "body"),
			Direction: mcpStr(args, "direction"),
		}
		if err := db.Create(&i).Error; err != nil { return mcpErr("Failed: " + err.Error()), nil }
		if i.Direction == "outbound" {
			now := time.Now()
			db.Model(&models.AtlasContact{}).Where("id = ?", i.ContactID).Update("last_contacted_at", now)
		}
		return mcpJSON(i), nil
	}
}

func mcpGetTodaysInteractions(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		now := time.Now()
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		var interactions []models.AtlasInteraction
		db.Preload("Contact").Where("created_at >= ?", today).Order("created_at DESC").Find(&interactions)
		return mcpJSON(interactions), nil
	}
}

func mcpCreateProject(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		args := mcpArgs(req)
		p := models.AtlasProject{
			TenantID: 1, Name: mcpStr(args, "name"), Description: mcpStr(args, "description"),
			DealValue: mcpFloat(args, "deal_value"), Currency: mcpStr(args, "currency"),
			Status: "discovery", Stage: "lead",
		}
		if cid := mcpUint(args, "contact_id"); cid > 0 { p.ContactID = &cid }
		if p.Currency == "" { p.Currency = "UGX" }
		if err := db.Create(&p).Error; err != nil { return mcpErr("Failed: " + err.Error()), nil }
		return mcpJSON(p), nil
	}
}

func mcpUpdateProjectStage(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		args := mcpArgs(req)
		id := mcpUint(args, "id")
		db.Model(&models.AtlasProject{}).Where("id = ?", id).Update("stage", mcpStr(args, "stage"))
		var p models.AtlasProject
		db.Preload("Contact").First(&p, id)
		return mcpJSON(p), nil
	}
}

func mcpGetProjectPipeline(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		type G struct { Stage string `json:"stage"`; Count int64 `json:"count"`; Value float64 `json:"total_value"` }
		var g []G
		db.Model(&models.AtlasProject{}).Select("stage, COUNT(*) as count, COALESCE(SUM(deal_value), 0) as value").Group("stage").Scan(&g)
		return mcpJSON(g), nil
	}
}

func mcpRecordRevenue(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		args := mcpArgs(req)
		now := time.Now()
		e := models.AtlasRevenueEntry{
			TenantID: 1, Stream: mcpStr(args, "stream"), Amount: mcpFloat(args, "amount"),
			Currency: mcpStr(args, "currency"), Description: mcpStr(args, "description"),
			PaymentMethod: mcpStr(args, "payment_method"), PaymentDate: &now,
		}
		if cid := mcpUint(args, "contact_id"); cid > 0 { e.ContactID = &cid }
		if e.Currency == "" { e.Currency = "UGX" }
		if err := db.Create(&e).Error; err != nil { return mcpErr("Failed: " + err.Error()), nil }
		return mcpJSON(e), nil
	}
}

func mcpGetWeeklyRevenue(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		now := time.Now()
		ws := now.AddDate(0, 0, -int(now.Weekday()))
		ws = time.Date(ws.Year(), ws.Month(), ws.Day(), 0, 0, 0, 0, ws.Location())
		var total float64
		db.Model(&models.AtlasRevenueEntry{}).Where("payment_date >= ?", ws).Select("COALESCE(SUM(amount), 0)").Scan(&total)
		return mcpJSON(map[string]interface{}{"weekly_total": total}), nil
	}
}

func mcpGetMonthlyRevenue(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		now := time.Now()
		ms := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		var total float64
		db.Model(&models.AtlasRevenueEntry{}).Where("payment_date >= ?", ms).Select("COALESCE(SUM(amount), 0)").Scan(&total)
		return mcpJSON(map[string]interface{}{"monthly_total": total}), nil
	}
}

func mcpGetRevenueByStream(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		type S struct { Stream string `json:"stream"`; Count int64 `json:"count"`; Total float64 `json:"total"` }
		var s []S
		db.Model(&models.AtlasRevenueEntry{}).Select("stream, COUNT(*) as count, COALESCE(SUM(amount), 0) as total").Group("stream").Order("total DESC").Scan(&s)
		return mcpJSON(s), nil
	}
}

func mcpGetMRR(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		var mrr float64
		var active int64
		db.Model(&models.AtlasAgentClient{}).Where("status = ?", "active").Count(&active)
		db.Model(&models.AtlasAgentClient{}).Where("status = ?", "active").Select("COALESCE(SUM(monthly_fee), 0)").Scan(&mrr)
		return mcpJSON(map[string]interface{}{"mrr": mrr, "arr": mrr * 12, "active_agents": active}), nil
	}
}

func mcpCreateAgentClient(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		args := mcpArgs(req)
		ac := models.AtlasAgentClient{
			TenantID: 1, Career: mcpStr(args, "career"), Tier: mcpStr(args, "tier"),
			SetupFee: mcpFloat(args, "setup_fee"), MonthlyFee: mcpFloat(args, "monthly_fee"),
			Currency: "UGX", Status: "discovery",
		}
		if cid := mcpUint(args, "contact_id"); cid > 0 { ac.ContactID = &cid }
		if ac.Tier == "" { ac.Tier = "basic" }
		if err := db.Create(&ac).Error; err != nil { return mcpErr("Failed: " + err.Error()), nil }
		return mcpJSON(ac), nil
	}
}

func mcpGetAgentMRR(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		var mrr float64
		var active int64
		db.Model(&models.AtlasAgentClient{}).Where("status = ?", "active").Count(&active)
		db.Model(&models.AtlasAgentClient{}).Where("status = ?", "active").Select("COALESCE(SUM(monthly_fee), 0)").Scan(&mrr)
		return mcpJSON(map[string]interface{}{"mrr": mrr, "arr": mrr * 12, "active_clients": active}), nil
	}
}

func mcpCreateContent(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		args := mcpArgs(req)
		ct := models.AtlasContent{
			TenantID: 1, Title: mcpStr(args, "title"), Platform: mcpStr(args, "platform"),
			Type: mcpStr(args, "type"), Pillar: mcpStr(args, "pillar"), Status: "idea",
		}
		if err := db.Create(&ct).Error; err != nil { return mcpErr("Failed: " + err.Error()), nil }
		return mcpJSON(ct), nil
	}
}

func mcpGetContentStats(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		type S struct { Platform string `json:"platform"`; Count int64 `json:"count"`; Views float64 `json:"views"` }
		var s []S
		db.Model(&models.AtlasContent{}).Select("platform, COUNT(*) as count, COALESCE(SUM(views), 0) as views").Group("platform").Scan(&s)
		return mcpJSON(s), nil
	}
}

func mcpLogDailyActivity(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		args := mcpArgs(req)
		now := time.Now()
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

		var existing models.AtlasDailyLog
		if err := db.Where("date = ?", today).First(&existing).Error; err == nil {
			updates := map[string]interface{}{}
			if v := mcpFloat(args, "emails_sent"); v > 0 { updates["emails_sent"] = int(v) }
			if v := mcpFloat(args, "prospects_found"); v > 0 { updates["prospects_found"] = int(v) }
			if v := mcpFloat(args, "revenue_today"); v > 0 { updates["revenue_today"] = v }
			if v := mcpStr(args, "notes"); v != "" { updates["notes"] = v }
			db.Model(&existing).Updates(updates)
			db.First(&existing, existing.ID)
			return mcpJSON(existing), nil
		}

		l := models.AtlasDailyLog{
			TenantID: 1, Date: today,
			EmailsSent: int(mcpFloat(args, "emails_sent")),
			ProspectsFound: int(mcpFloat(args, "prospects_found")),
			RevenueToday: mcpFloat(args, "revenue_today"),
			Notes: mcpStr(args, "notes"),
		}
		if err := db.Create(&l).Error; err != nil { return mcpErr("Failed: " + err.Error()), nil }
		return mcpJSON(l), nil
	}
}

func mcpGetTodayLog(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		now := time.Now()
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		var l models.AtlasDailyLog
		if err := db.Where("date = ?", today).First(&l).Error; err != nil {
			return mcpJSON(map[string]interface{}{"message": "No log for today"}), nil
		}
		return mcpJSON(l), nil
	}
}

func mcpGetStreak(db *gorm.DB, apiKey string) mcpserver.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if err := mcpValidateKey(ctx, apiKey); err != nil { return mcpErr(err.Error()), nil }
		var logs []models.AtlasDailyLog
		db.Order("date DESC").Limit(365).Find(&logs)
		streak := 0
		today := time.Now()
		today = time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())
		for i, log := range logs {
			expected := today.AddDate(0, 0, -i)
			logDate := time.Date(log.Date.Year(), log.Date.Month(), log.Date.Day(), 0, 0, 0, 0, log.Date.Location())
			if logDate.Equal(expected) { streak++ } else { break }
		}
		return mcpJSON(map[string]interface{}{"streak": streak}), nil
	}
}
