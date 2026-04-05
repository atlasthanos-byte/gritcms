package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// ============================================================
// ATLAS CRM — Contacts & Leads
// ============================================================

const (
	AtlasContactTypeProspect    = "prospect"
	AtlasContactTypeClient      = "client"
	AtlasContactTypeStudent     = "student"
	AtlasContactTypeAgentClient = "agent_client"
	AtlasContactTypePartner     = "partner"

	AtlasContactStatusNew          = "new"
	AtlasContactStatusContacted    = "contacted"
	AtlasContactStatusReplied      = "replied"
	AtlasContactStatusCallBooked   = "call_booked"
	AtlasContactStatusProposalSent = "proposal_sent"
	AtlasContactStatusWon          = "won"
	AtlasContactStatusLost         = "lost"
	AtlasContactStatusChurned      = "churned"

	AtlasSourceYoutube       = "youtube"
	AtlasSourceLinkedin      = "linkedin"
	AtlasSourceTiktok        = "tiktok"
	AtlasSourceReferral      = "referral"
	AtlasSourceColdOutreach  = "cold_outreach"
	AtlasSourceWebsite       = "website"
	AtlasSourceGumroad       = "gumroad"
)

type AtlasContact struct {
	ID              uint           `gorm:"primarykey" json:"id"`
	TenantID        uint           `gorm:"index;not null;default:1" json:"tenant_id"`
	Name            string         `gorm:"size:255;not null" json:"name"`
	Email           string         `gorm:"size:255;index" json:"email"`
	Phone           string         `gorm:"size:50" json:"phone"`
	LinkedinURL     string         `gorm:"size:500" json:"linkedin_url"`
	Company         string         `gorm:"size:255" json:"company"`
	Role            string         `gorm:"size:255" json:"role"`
	Location        string         `gorm:"size:255" json:"location"`
	Source          string         `gorm:"size:100;index" json:"source"`
	Type            string         `gorm:"size:50;index" json:"type"`
	Status          string         `gorm:"size:50;index;default:'new'" json:"status"`
	ICPProfile      string         `gorm:"size:10" json:"icp_profile"`
	AntiICPFlags    datatypes.JSON `gorm:"type:jsonb" json:"anti_icp_flags"`
	Notes           string         `gorm:"type:text" json:"notes"`
	Tags            datatypes.JSON `gorm:"type:jsonb" json:"tags"`
	LastContactedAt *time.Time     `json:"last_contacted_at"`
	NextFollowupAt  *time.Time     `gorm:"index" json:"next_followup_at"`
	DealValue       float64        `gorm:"type:decimal(12,2);default:0" json:"deal_value"`
	Currency        string         `gorm:"size:3;default:'UGX'" json:"currency"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`

	Interactions    []AtlasInteraction `gorm:"foreignKey:ContactID" json:"interactions,omitempty"`
	Projects        []AtlasProject     `gorm:"foreignKey:ContactID" json:"projects,omitempty"`
	InteractionCount int64             `gorm:"-" json:"interaction_count,omitempty"`
	ProjectCount     int64             `gorm:"-" json:"project_count,omitempty"`
}

func (AtlasContact) TableName() string { return "atlas_contacts" }

// ============================================================
// ATLAS CRM — Interactions Log
// ============================================================

const (
	AtlasInteractionEmailSent     = "email_sent"
	AtlasInteractionEmailReceived = "email_received"
	AtlasInteractionCall          = "call"
	AtlasInteractionMeeting       = "meeting"
	AtlasInteractionLinkedinDM    = "linkedin_dm"
	AtlasInteractionWhatsapp      = "whatsapp"
	AtlasInteractionNote          = "note"

	AtlasChannelGmail    = "gmail"
	AtlasChannelLinkedin = "linkedin"
	AtlasChannelWhatsapp = "whatsapp"
	AtlasChannelZoom     = "zoom"
	AtlasChannelInPerson = "in_person"

	AtlasDirectionInbound  = "inbound"
	AtlasDirectionOutbound = "outbound"
)

type AtlasInteraction struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	TenantID  uint           `gorm:"index;not null;default:1" json:"tenant_id"`
	ContactID uint           `gorm:"index;not null" json:"contact_id"`
	Type      string         `gorm:"size:50;index" json:"type"`
	Channel   string         `gorm:"size:50" json:"channel"`
	Subject   string         `gorm:"size:500" json:"subject"`
	Body      string         `gorm:"type:text" json:"body"`
	Direction string         `gorm:"size:10" json:"direction"`
	Status    string         `gorm:"size:50" json:"status"`
	Metadata  datatypes.JSON `gorm:"type:jsonb" json:"metadata"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Contact *AtlasContact `gorm:"foreignKey:ContactID" json:"contact,omitempty"`
}

func (AtlasInteraction) TableName() string { return "atlas_interactions" }

// ============================================================
// ATLAS CRM — Projects & Deals
// ============================================================

const (
	AtlasProjectStatusDiscovery    = "discovery"
	AtlasProjectStatusProposalSent = "proposal_sent"
	AtlasProjectStatusNegotiation  = "negotiation"
	AtlasProjectStatusWon          = "won"
	AtlasProjectStatusInProgress   = "in_progress"
	AtlasProjectStatusDelivered    = "delivered"
	AtlasProjectStatusInvoiced     = "invoiced"
	AtlasProjectStatusPaid         = "paid"
	AtlasProjectStatusLost         = "lost"

	AtlasProjectStageLead      = "lead"
	AtlasProjectStageQualified = "qualified"
	AtlasProjectStageProposal  = "proposal"
	AtlasProjectStageClosing   = "closing"
	AtlasProjectStageWon       = "won"
	AtlasProjectStageLost      = "lost"
)

type AtlasProject struct {
	ID                uint           `gorm:"primarykey" json:"id"`
	TenantID          uint           `gorm:"index;not null;default:1" json:"tenant_id"`
	ContactID         *uint          `gorm:"index" json:"contact_id"`
	Name              string         `gorm:"size:255;not null" json:"name"`
	Description       string         `gorm:"type:text" json:"description"`
	Status            string         `gorm:"size:50;index;default:'discovery'" json:"status"`
	Stage             string         `gorm:"size:50;index;default:'lead'" json:"stage"`
	DealValue         float64        `gorm:"type:decimal(12,2);default:0" json:"deal_value"`
	Currency          string         `gorm:"size:3;default:'UGX'" json:"currency"`
	UpfrontPercentage int            `gorm:"default:40" json:"upfront_percentage"`
	UpfrontPaid       bool           `gorm:"default:false" json:"upfront_paid"`
	FinalPaid         bool           `gorm:"default:false" json:"final_paid"`
	TechStack         datatypes.JSON `gorm:"type:jsonb" json:"tech_stack"`
	StartDate         *time.Time     `json:"start_date"`
	Deadline          *time.Time     `json:"deadline"`
	DeliveredDate     *time.Time     `json:"delivered_date"`
	ContractSigned    bool           `gorm:"default:false" json:"contract_signed"`
	ContractURL       string         `gorm:"size:500" json:"contract_url"`
	ProposalURL       string         `gorm:"size:500" json:"proposal_url"`
	RepoURL           string         `gorm:"size:500" json:"repo_url"`
	Notes             string         `gorm:"type:text" json:"notes"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`

	Contact *AtlasContact `gorm:"foreignKey:ContactID" json:"contact,omitempty"`
}

func (AtlasProject) TableName() string { return "atlas_projects" }

// ============================================================
// ATLAS CRM — Courses & Students
// ============================================================

const (
	AtlasCourseStatusPlanned   = "planned"
	AtlasCourseStatusBuilding  = "building"
	AtlasCourseStatusPublished = "published"
	AtlasCourseStatusArchived  = "archived"

	AtlasEnrollmentStatusEnrolled   = "enrolled"
	AtlasEnrollmentStatusInProgress = "in_progress"
	AtlasEnrollmentStatusCompleted  = "completed"
	AtlasEnrollmentStatusRefunded   = "refunded"

	AtlasPaymentStatusPending  = "pending"
	AtlasPaymentStatusPaid     = "paid"
	AtlasPaymentStatusRefunded = "refunded"
)

type AtlasCourse struct {
	ID            uint           `gorm:"primarykey" json:"id"`
	TenantID      uint           `gorm:"index;not null;default:1" json:"tenant_id"`
	Title         string         `gorm:"size:255;not null" json:"title"`
	Slug          string         `gorm:"size:255;uniqueIndex" json:"slug"`
	Description   string         `gorm:"type:text" json:"description"`
	Pillar        string         `gorm:"size:100" json:"pillar"`
	Duration      string         `gorm:"size:20" json:"duration"`
	Price         float64        `gorm:"type:decimal(8,2);default:0" json:"price"`
	Currency      string         `gorm:"size:3;default:'USD'" json:"currency"`
	GumroadURL    string         `gorm:"size:500" json:"gumroad_url"`
	YoutubeURL    string         `gorm:"size:500" json:"youtube_url"`
	Status        string         `gorm:"size:50;index;default:'planned'" json:"status"`
	Modules       datatypes.JSON `gorm:"type:jsonb" json:"modules"`
	TotalStudents int            `gorm:"default:0" json:"total_students"`
	TotalRevenue  float64        `gorm:"type:decimal(12,2);default:0" json:"total_revenue"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
	PublishedAt   *time.Time     `json:"published_at"`

	Enrollments []AtlasEnrollment `gorm:"foreignKey:CourseID" json:"enrollments,omitempty"`
}

func (AtlasCourse) TableName() string { return "atlas_courses" }

type AtlasEnrollment struct {
	ID            uint           `gorm:"primarykey" json:"id"`
	TenantID      uint           `gorm:"index;not null;default:1" json:"tenant_id"`
	CourseID      uint           `gorm:"index;not null" json:"course_id"`
	ContactID     uint           `gorm:"index;not null" json:"contact_id"`
	Status        string         `gorm:"size:50;default:'enrolled'" json:"status"`
	PaymentStatus string         `gorm:"size:50;default:'pending'" json:"payment_status"`
	AmountPaid    float64        `gorm:"type:decimal(8,2);default:0" json:"amount_paid"`
	EnrolledAt    time.Time      `json:"enrolled_at"`
	CompletedAt   *time.Time     `json:"completed_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	Course  *AtlasCourse  `gorm:"foreignKey:CourseID" json:"course,omitempty"`
	Contact *AtlasContact `gorm:"foreignKey:ContactID" json:"contact,omitempty"`
}

func (AtlasEnrollment) TableName() string { return "atlas_enrollments" }

// ============================================================
// ATLAS CRM — AI Agent Clients
// ============================================================

const (
	AtlasAgentTierBasic      = "basic"
	AtlasAgentTierPro        = "pro"
	AtlasAgentTierEnterprise = "enterprise"

	AtlasAgentStatusDiscovery = "discovery"
	AtlasAgentStatusProposal  = "proposal"
	AtlasAgentStatusBuilding  = "building"
	AtlasAgentStatusDelivered = "delivered"
	AtlasAgentStatusActive    = "active"
	AtlasAgentStatusChurned   = "churned"
)

type AtlasAgentClient struct {
	ID              uint           `gorm:"primarykey" json:"id"`
	TenantID        uint           `gorm:"index;not null;default:1" json:"tenant_id"`
	ContactID       *uint          `gorm:"index" json:"contact_id"`
	Career          string         `gorm:"size:100;index" json:"career"`
	Tier            string         `gorm:"size:20;default:'basic'" json:"tier"`
	SetupFee        float64        `gorm:"type:decimal(12,2);default:0" json:"setup_fee"`
	MonthlyFee      float64        `gorm:"type:decimal(12,2);default:0" json:"monthly_fee"`
	Currency        string         `gorm:"size:3;default:'UGX'" json:"currency"`
	Status          string         `gorm:"size:50;index;default:'discovery'" json:"status"`
	RepoURL         string         `gorm:"size:500" json:"repo_url"`
	SkillsCount     int            `gorm:"default:0" json:"skills_count"`
	ToolsConnected  datatypes.JSON `gorm:"type:jsonb" json:"tools_connected"`
	DeliveryDate    *time.Time     `json:"delivery_date"`
	LastMaintenance *time.Time     `json:"last_maintenance"`
	NextMaintenance *time.Time     `json:"next_maintenance"`
	Notes           string         `gorm:"type:text" json:"notes"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`

	Contact *AtlasContact `gorm:"foreignKey:ContactID" json:"contact,omitempty"`
}

func (AtlasAgentClient) TableName() string { return "atlas_agent_clients" }

// ============================================================
// ATLAS CRM — Content Tracker
// ============================================================

const (
	AtlasPlatformYoutube  = "youtube"
	AtlasPlatformLinkedin = "linkedin"
	AtlasPlatformTiktok   = "tiktok"
	AtlasPlatformBlog     = "blog"

	AtlasContentTypeVideo    = "video"
	AtlasContentTypePost     = "post"
	AtlasContentTypeCarousel = "carousel"
	AtlasContentTypeArticle  = "article"
	AtlasContentTypeReel     = "reel"
	AtlasContentTypeShort    = "short"

	AtlasContentStatusIdea      = "idea"
	AtlasContentStatusScripted  = "scripted"
	AtlasContentStatusRecording = "recording"
	AtlasContentStatusEditing   = "editing"
	AtlasContentStatusPublished = "published"
	AtlasContentStatusArchived  = "archived"
)

type AtlasContent struct {
	ID               uint           `gorm:"primarykey" json:"id"`
	TenantID         uint           `gorm:"index;not null;default:1" json:"tenant_id"`
	Platform         string         `gorm:"size:50;index" json:"platform"`
	Type             string         `gorm:"size:50" json:"type"`
	Title            string         `gorm:"size:500;not null" json:"title"`
	URL              string         `gorm:"size:500" json:"url"`
	Status           string         `gorm:"size:50;index;default:'idea'" json:"status"`
	Pillar           string         `gorm:"size:100" json:"pillar"`
	PublishDate      *time.Time     `gorm:"index" json:"publish_date"`
	ThumbnailPath    string         `gorm:"size:500" json:"thumbnail_path"`
	Views            int            `gorm:"default:0" json:"views"`
	Likes            int            `gorm:"default:0" json:"likes"`
	Comments         int            `gorm:"default:0" json:"comments"`
	EngagementRatio  float64        `gorm:"type:decimal(5,2);default:0" json:"engagement_ratio"`
	ProductTieIn     string         `gorm:"size:255" json:"product_tie_in"`
	CourseTieIn      *uint          `json:"course_tie_in"`
	SourceCodeURL    string         `gorm:"size:500" json:"source_code_url"`
	RevenueGenerated float64        `gorm:"type:decimal(12,2);default:0" json:"revenue_generated"`
	Notes            string         `gorm:"type:text" json:"notes"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

func (AtlasContent) TableName() string { return "atlas_content" }

// ============================================================
// ATLAS CRM — Digital Products
// ============================================================

const (
	AtlasProductTypeSourceCode  = "source_code"
	AtlasProductTypeStarterKit  = "starter_kit"
	AtlasProductTypeCourse      = "course"
	AtlasProductTypeTemplate    = "template"
	AtlasProductTypeEbook       = "ebook"

	AtlasProductStatusPlanned   = "planned"
	AtlasProductStatusBuilding  = "building"
	AtlasProductStatusPublished = "published"
	AtlasProductStatusArchived  = "archived"
)

type AtlasProduct struct {
	ID             uint           `gorm:"primarykey" json:"id"`
	TenantID       uint           `gorm:"index;not null;default:1" json:"tenant_id"`
	Name           string         `gorm:"size:255;not null" json:"name"`
	Type           string         `gorm:"size:50;index" json:"type"`
	Category       string         `gorm:"size:100" json:"category"`
	Price          float64        `gorm:"type:decimal(8,2);default:0" json:"price"`
	Currency       string         `gorm:"size:3;default:'USD'" json:"currency"`
	GumroadURL     string         `gorm:"size:500" json:"gumroad_url"`
	GithubURL      string         `gorm:"size:500" json:"github_url"`
	Status         string         `gorm:"size:50;index;default:'planned'" json:"status"`
	TotalSales     int            `gorm:"default:0" json:"total_sales"`
	TotalRevenue   float64        `gorm:"type:decimal(12,2);default:0" json:"total_revenue"`
	Rating         float64        `gorm:"type:decimal(3,1);default:0" json:"rating"`
	Description    string         `gorm:"type:text" json:"description"`
	TechStack      datatypes.JSON `gorm:"type:jsonb" json:"tech_stack"`
	YoutubeVideoID *uint          `json:"youtube_video_id"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

func (AtlasProduct) TableName() string { return "atlas_products" }

// ============================================================
// ATLAS CRM — Revenue & Financial Tracking
// ============================================================

const (
	AtlasStreamProject      = "project"
	AtlasStreamDGateway     = "dgateway"
	AtlasStreamCourse       = "course"
	AtlasStreamSourceCode   = "source_code"
	AtlasStreamStarterKit   = "starter_kit"
	AtlasStreamAgentSetup   = "agent_setup"
	AtlasStreamAgentMonthly = "agent_monthly"
	AtlasStreamTraining     = "training"
	AtlasStreamConsulting   = "consulting"

	AtlasPaymentMobileMoney   = "mobile_money"
	AtlasPaymentBankTransfer  = "bank_transfer"
	AtlasPaymentStripe        = "stripe"
	AtlasPaymentGumroad       = "gumroad"
	AtlasPaymentCash          = "cash"
)

type AtlasRevenueEntry struct {
	ID            uint           `gorm:"primarykey" json:"id"`
	TenantID      uint           `gorm:"index;not null;default:1" json:"tenant_id"`
	Stream        string         `gorm:"size:50;index" json:"stream"`
	SourceID      *uint          `json:"source_id"`
	SourceType    string         `gorm:"size:50" json:"source_type"`
	Amount        float64        `gorm:"type:decimal(12,2);not null" json:"amount"`
	Currency      string         `gorm:"size:3;default:'UGX'" json:"currency"`
	Description   string         `gorm:"size:500" json:"description"`
	PaymentMethod string         `gorm:"size:50" json:"payment_method"`
	PaymentDate   *time.Time     `gorm:"index" json:"payment_date"`
	InvoiceNumber string         `gorm:"size:50" json:"invoice_number"`
	ContactID     *uint          `gorm:"index" json:"contact_id"`
	CreatedAt     time.Time      `json:"created_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	Contact *AtlasContact `gorm:"foreignKey:ContactID" json:"contact,omitempty"`
}

func (AtlasRevenueEntry) TableName() string { return "atlas_revenue_entries" }

// ============================================================
// ATLAS CRM — Daily Operations Log
// ============================================================

type AtlasDailyLog struct {
	ID               uint           `gorm:"primarykey" json:"id"`
	TenantID         uint           `gorm:"index;not null;default:1" json:"tenant_id"`
	Date             time.Time      `gorm:"uniqueIndex;not null" json:"date"`
	MorningBrief     datatypes.JSON `gorm:"type:jsonb" json:"morning_brief"`
	EODReview        datatypes.JSON `gorm:"type:jsonb" json:"eod_review"`
	EmailsSent       int            `gorm:"default:0" json:"emails_sent"`
	EmailsReceived   int            `gorm:"default:0" json:"emails_received"`
	ProspectsFound   int            `gorm:"default:0" json:"prospects_found"`
	StudentsEnrolled int            `gorm:"default:0" json:"students_enrolled"`
	ContentPublished datatypes.JSON `gorm:"type:jsonb" json:"content_published"`
	CoursesCreated   int            `gorm:"default:0" json:"courses_created"`
	RevenueToday     float64        `gorm:"type:decimal(12,2);default:0" json:"revenue_today"`
	CommandsRun      datatypes.JSON `gorm:"type:jsonb" json:"commands_run"`
	Notes            string         `gorm:"type:text" json:"notes"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
}

func (AtlasDailyLog) TableName() string { return "atlas_daily_logs" }

// ============================================================
// ATLAS CRM — Website Maintenance
// ============================================================

const (
	AtlasWebsiteDesishub  = "desishub"
	AtlasWebsitePortfolio = "portfolio"

	AtlasWebTaskTypeBlogPost      = "blog_post"
	AtlasWebTaskTypeSEOAudit      = "seo_audit"
	AtlasWebTaskTypeContentUpdate = "content_update"
	AtlasWebTaskTypeBugFix        = "bug_fix"
	AtlasWebTaskTypeFeature       = "feature"

	AtlasWebTaskStatusPlanned    = "planned"
	AtlasWebTaskStatusInProgress = "in_progress"
	AtlasWebTaskStatusCompleted  = "completed"
	AtlasWebTaskStatusPushed     = "pushed"
)

type AtlasWebsiteTask struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	TenantID    uint           `gorm:"index;not null;default:1" json:"tenant_id"`
	Site        string         `gorm:"size:50;index" json:"site"`
	Type        string         `gorm:"size:50" json:"type"`
	Title       string         `gorm:"size:255;not null" json:"title"`
	Description string         `gorm:"type:text" json:"description"`
	Status      string         `gorm:"size:50;index;default:'planned'" json:"status"`
	FilePath    string         `gorm:"size:500" json:"file_path"`
	CommitHash  string         `gorm:"size:40" json:"commit_hash"`
	SEOScore    float64        `gorm:"type:decimal(5,2);default:0" json:"seo_score"`
	PublishDate *time.Time     `json:"publish_date"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (AtlasWebsiteTask) TableName() string { return "atlas_website_tasks" }
