package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/paymentintent"
	"github.com/stripe/stripe-go/v82/webhook"
	"gorm.io/gorm"

	"gritcms/apps/api/internal/config"
	"gritcms/apps/api/internal/events"
	"gritcms/apps/api/internal/models"
)

// PaymentHandler handles Stripe checkout and webhook endpoints.
type PaymentHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

type paymentSettings struct {
	DefaultProcessor    string
	StripeSecretKey     string
	StripePublishable   string
	StripeWebhookSecret string
}

type paymentProcessor interface {
	CreateIntent(amountInCents int64, currency string, description string, email string, metadata map[string]string) (paymentIntentResult, error)
	GetIntent(intentID string) (string, error)
}

type paymentIntentResult struct {
	ID           string
	ClientSecret string
}

type stripeProcessor struct{}

func (p *stripeProcessor) CreateIntent(amountInCents int64, currency string, description string, email string, metadata map[string]string) (paymentIntentResult, error) {
	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(amountInCents),
		Currency: stripe.String(strings.ToLower(currency)),
		AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
			Enabled: stripe.Bool(true),
		},
		Description:  stripe.String(description),
		ReceiptEmail: stripe.String(email),
		Metadata:     metadata,
	}
	pi, err := paymentintent.New(params)
	if err != nil {
		return paymentIntentResult{}, err
	}
	return paymentIntentResult{ID: pi.ID, ClientSecret: pi.ClientSecret}, nil
}

func (p *stripeProcessor) GetIntent(intentID string) (string, error) {
	pi, err := paymentintent.Get(intentID, nil)
	if err != nil {
		return "", err
	}
	return string(pi.Status), nil
}

// NewPaymentHandler creates a new PaymentHandler.
func NewPaymentHandler(db *gorm.DB, cfg *config.Config) *PaymentHandler {
	// Set Stripe secret key globally
	if cfg.StripeSecretKey != "" {
		stripe.Key = cfg.StripeSecretKey
	}
	return &PaymentHandler{db: db, cfg: cfg}
}

func (h *PaymentHandler) resolveSettings() paymentSettings {
	result := paymentSettings{
		DefaultProcessor:    "stripe",
		StripeSecretKey:     h.cfg.StripeSecretKey,
		StripePublishable:   h.cfg.StripePublishableKey,
		StripeWebhookSecret: h.cfg.StripeWebhookSecret,
	}

	var settings []models.Setting
	if err := h.db.Where("\"group\" = ?", "payments").Find(&settings).Error; err != nil {
		return result
	}
	for _, s := range settings {
		switch s.Key {
		case "default_processor":
			if s.Value != "" {
				result.DefaultProcessor = strings.ToLower(s.Value)
			}
		case "stripe_secret_key":
			if s.Value != "" {
				result.StripeSecretKey = s.Value
			}
		case "stripe_publishable_key":
			if s.Value != "" {
				result.StripePublishable = s.Value
			}
		case "stripe_webhook_secret":
			if s.Value != "" {
				result.StripeWebhookSecret = s.Value
			}
		}
	}
	return result
}

func (h *PaymentHandler) resolveProcessor(requested string, pageProcessor string) (string, paymentSettings, error) {
	settings := h.resolveSettings()
	processor := strings.ToLower(strings.TrimSpace(requested))
	if processor == "" {
		processor = strings.ToLower(strings.TrimSpace(pageProcessor))
	}
	if processor == "" {
		processor = settings.DefaultProcessor
	}
	if processor == "" {
		processor = "stripe"
	}
	if processor != "stripe" {
		return "", settings, fmt.Errorf("unsupported payment processor: %s", processor)
	}
	if settings.StripeSecretKey == "" || settings.StripePublishable == "" {
		return "", settings, fmt.Errorf("stripe is not configured")
	}
	stripe.Key = settings.StripeSecretKey
	return processor, settings, nil
}

// Checkout creates a pending order and a Stripe PaymentIntent, returning
// the client_secret for the frontend to complete payment via Stripe Elements.
func (h *PaymentHandler) Checkout(c *gin.Context) {
	var input struct {
		Type       string `json:"type" binding:"required"` // "product" or "course"
		ProductID  *uint  `json:"product_id"`
		CourseID   *uint  `json:"course_id"`
		PriceID    uint   `json:"price_id"`
		CouponCode string `json:"coupon_code"`
		Processor  string `json:"processor"`
		PageSlug   string `json:"page_slug"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Resolve authenticated user → contact
	user, _ := c.Get("user")
	u := user.(models.User)

	var contact models.Contact
	if err := h.db.Where("email = ? AND tenant_id = ?", u.Email, 1).First(&contact).Error; err != nil {
		contact = models.Contact{
			TenantID:  1,
			Email:     u.Email,
			FirstName: u.FirstName,
			LastName:  u.LastName,
			Source:    "organic",
			UserID:    &u.ID,
		}
		h.db.Create(&contact)
	} else if contact.UserID == nil {
		contact.UserID = &u.ID
		h.db.Save(&contact)
	}

	// Resolve product/course and build order item
	var subtotal float64
	var currency string
	var itemName string
	var pageProcessor string
	var orderItem models.OrderItem

	switch input.Type {
	case "course":
		if input.CourseID == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "course_id is required"})
			return
		}
		var course models.Course
		if err := h.db.First(&course, *input.CourseID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
			return
		}
		if course.Status != models.CourseStatusPublished {
			c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
			return
		}
		if course.AccessType != models.CourseAccessPaid {
			c.JSON(http.StatusBadRequest, gin.H{"error": "This course is free — no payment needed"})
			return
		}
		subtotal = course.Price
		currency = course.Currency
		itemName = course.Title
		orderItem = models.OrderItem{
			TenantID:  1,
			CourseID:  &course.ID,
			Quantity:  1,
			UnitPrice: course.Price,
			Total:     course.Price,
		}

	case "product":
		if input.ProductID == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "product_id is required"})
			return
		}
		var product models.Product
		if err := h.db.First(&product, *input.ProductID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		if product.Status != "active" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Product is not available"})
			return
		}

		// Load price — auto-resolve default price if not specified
		var price models.Price
		if input.PriceID > 0 {
			if err := h.db.First(&price, input.PriceID).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Price not found"})
				return
			}
			if price.ProductID != product.ID {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Price does not belong to this product"})
				return
			}
		} else {
			if err := h.db.Where("product_id = ? AND type = ?", product.ID, models.PriceTypeOneTime).
				Order("sort_order ASC").First(&price).Error; err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "No price found for this product"})
				return
			}
		}
		subtotal = price.Amount
		currency = price.Currency
		itemName = product.Name
		orderItem = models.OrderItem{
			TenantID:  1,
			ProductID: &product.ID,
			PriceID:   &price.ID,
			Quantity:  1,
			UnitPrice: price.Amount,
			Total:     price.Amount,
		}

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "type must be 'product' or 'course'"})
		return
	}

	if input.PageSlug != "" {
		var page models.Page
		if err := h.db.Where("slug = ?", input.PageSlug).First(&page).Error; err == nil {
			pageProcessor = page.PaymentProvider
		}
	}

	processor, settings, err := h.resolveProcessor(input.Processor, pageProcessor)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if currency == "" {
		currency = "USD"
	}

	// Apply coupon discount
	var discountAmount float64
	var couponID *uint

	if input.CouponCode != "" {
		var coupon models.Coupon
		if err := h.db.Where("code = ? AND status = 'active'", strings.ToUpper(input.CouponCode)).First(&coupon).Error; err == nil {
			if coupon.MaxUses == 0 || coupon.UsedCount < coupon.MaxUses {
				now := time.Now()
				validTime := true
				if coupon.ValidFrom != nil && now.Before(*coupon.ValidFrom) {
					validTime = false
				}
				if coupon.ValidUntil != nil && now.After(*coupon.ValidUntil) {
					validTime = false
				}
				if validTime && subtotal >= coupon.MinOrderAmount {
					if coupon.Type == models.CouponTypePercentage {
						discountAmount = subtotal * (coupon.Amount / 100)
					} else {
						discountAmount = coupon.Amount
					}
					if discountAmount > subtotal {
						discountAmount = subtotal
					}
					couponID = &coupon.ID
				}
			}
		}
	}

	totalAmount := subtotal - discountAmount
	if totalAmount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Total amount must be greater than zero"})
		return
	}

	amountInCents := int64(math.Round(totalAmount))

	// Create pending order
	order := models.Order{
		TenantID:        1,
		ContactID:       contact.ID,
		OrderNumber:     generateOrderNumber(),
		Status:          models.OrderStatusPending,
		Subtotal:        subtotal,
		DiscountAmount:  discountAmount,
		TaxAmount:       0,
		Total:           totalAmount,
		Currency:        currency,
		PaymentProvider: processor,
		CouponID:        couponID,
		Items:           []models.OrderItem{orderItem},
	}

	if err := h.db.Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	// Increment coupon usage
	if couponID != nil {
		h.db.Model(&models.Coupon{}).Where("id = ?", *couponID).UpdateColumn("used_count", gorm.Expr("used_count + 1"))
	}

	var proc paymentProcessor = &stripeProcessor{}
	pi, err := proc.CreateIntent(amountInCents, currency, itemName, u.Email, map[string]string{
		"order_id":   fmt.Sprintf("%d", order.ID),
		"contact_id": fmt.Sprintf("%d", contact.ID),
		"type":       input.Type,
		"processor":  processor,
	})
	if err != nil {
		log.Printf("[payment] Stripe PaymentIntent creation failed: %v", err)
		// Clean up the order
		h.db.Delete(&order)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize payment"})
		return
	}

	// Store PaymentIntent ID on order
	order.PaymentID = pi.ID
	h.db.Model(&order).Update("payment_id", pi.ID)

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"client_secret":   pi.ClientSecret,
		"order_id":        order.ID,
		"order_number":    order.OrderNumber,
		"amount":          amountInCents,
		"currency":        currency,
		"processor":       processor,
		"publishable_key": settings.StripePublishable,
	}})
}

// CheckoutStatus returns the current status of an order for the authenticated user.
func (h *PaymentHandler) CheckoutStatus(c *gin.Context) {
	orderID := c.Param("orderId")
	user, _ := c.Get("user")
	u := user.(models.User)

	var contact models.Contact
	if err := h.db.Where("email = ? AND tenant_id = ?", u.Email, 1).First(&contact).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contact not found"})
		return
	}

	var order models.Order
	if err := h.db.Where("id = ? AND contact_id = ?", orderID, contact.ID).
		Preload("Items.Product").
		First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	response := gin.H{
		"order_id":     order.ID,
		"order_number": order.OrderNumber,
		"status":       order.Status,
		"total":        order.Total,
	}
	if order.Status == models.OrderStatusPaid {
		response["items"] = order.Items
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}

// ConfirmCheckout is called by the frontend after stripe.confirmPayment succeeds.
// It verifies the PaymentIntent via Stripe API and immediately fulfills the order,
// so the user doesn't have to wait for the webhook.
func (h *PaymentHandler) ConfirmCheckout(c *gin.Context) {
	orderID := c.Param("orderId")
	user, _ := c.Get("user")
	u := user.(models.User)

	var contact models.Contact
	if err := h.db.Where("email = ? AND tenant_id = ?", u.Email, 1).First(&contact).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contact not found"})
		return
	}

	var order models.Order
	if err := h.db.Where("id = ? AND contact_id = ?", orderID, contact.ID).Preload("Items").First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// Idempotency: already paid
	if order.Status == models.OrderStatusPaid {
		c.JSON(http.StatusOK, gin.H{"data": gin.H{"status": "paid"}})
		return
	}

	// Verify PaymentIntent status via Stripe
	if order.PaymentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No payment associated with this order"})
		return
	}

	_, settings, err := h.resolveProcessor(order.PaymentProvider, "")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	stripe.Key = settings.StripeSecretKey
	var proc paymentProcessor = &stripeProcessor{}
	status, err := proc.GetIntent(order.PaymentID)
	if err != nil {
		log.Printf("[confirm] Failed to retrieve PI %s: %v", order.PaymentID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify payment"})
		return
	}

	if status != string(stripe.PaymentIntentStatusSucceeded) {
		c.JSON(http.StatusOK, gin.H{"data": gin.H{"status": status}})
		return
	}

	// Mark as paid and fulfill
	now := time.Now()
	order.Status = models.OrderStatusPaid
	order.PaidAt = &now
	h.db.Save(&order)

	fulfillOrder(h.db, &order)

	log.Printf("[confirm] Order %d confirmed and fulfilled (PI: %s)", order.ID, order.PaymentID)
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"status": "paid"}})
}

// StripeConfig returns the publishable key for the frontend.
func (h *PaymentHandler) StripeConfig(c *gin.Context) {
	settings := h.resolveSettings()
	if settings.StripePublishable == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Payments not configured"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"publishable_key":   settings.StripePublishable,
		"default_processor": settings.DefaultProcessor,
	}})
}

// StripeWebhook handles incoming Stripe webhook events.
func (h *PaymentHandler) StripeWebhook(c *gin.Context) {
	payload, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read body"})
		return
	}

	sig := c.GetHeader("Stripe-Signature")
	settings := h.resolveSettings()
	if settings.StripeSecretKey != "" {
		stripe.Key = settings.StripeSecretKey
	}
	event, err := webhook.ConstructEvent(payload, sig, settings.StripeWebhookSecret)
	if err != nil {
		log.Printf("[webhook] Signature verification failed: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid signature"})
		return
	}

	switch event.Type {
	case "payment_intent.succeeded":
		h.handlePaymentSucceeded(event)
	case "payment_intent.payment_failed":
		h.handlePaymentFailed(event)
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}

func (h *PaymentHandler) handlePaymentSucceeded(event stripe.Event) {
	pi, ok := event.Data.Object["id"].(string)
	if !ok {
		log.Println("[webhook] Missing payment_intent ID")
		return
	}

	var order models.Order
	if err := h.db.Where("payment_id = ?", pi).Preload("Items").First(&order).Error; err != nil {
		log.Printf("[webhook] Order not found for PI %s: %v", pi, err)
		return
	}

	// Idempotency: skip if already paid
	if order.Status == models.OrderStatusPaid {
		log.Printf("[webhook] Order %d already paid, skipping", order.ID)
		return
	}

	// Mark as paid
	now := time.Now()
	order.Status = models.OrderStatusPaid
	order.PaidAt = &now
	h.db.Save(&order)

	// Fulfill order (auto-enroll in courses, etc.)
	// Import the fulfillment service
	fulfillOrder(h.db, &order)

	log.Printf("[webhook] Order %d marked as paid (PI: %s)", order.ID, pi)
}

func (h *PaymentHandler) handlePaymentFailed(event stripe.Event) {
	pi, ok := event.Data.Object["id"].(string)
	if !ok {
		return
	}

	var order models.Order
	if err := h.db.Where("payment_id = ?", pi).First(&order).Error; err != nil {
		return
	}

	if order.Status != models.OrderStatusPending {
		return
	}

	order.Status = models.OrderStatusFailed
	h.db.Save(&order)
	log.Printf("[webhook] Order %d payment failed (PI: %s)", order.ID, pi)
}

// fulfillOrder handles post-payment fulfillment: auto-enrolls in courses, etc.
func fulfillOrder(db *gorm.DB, order *models.Order) {
	for _, item := range order.Items {
		// Direct course purchase — enroll via CourseID
		if item.CourseID != nil {
			enrollment := models.CourseEnrollment{
				TenantID:  1,
				ContactID: order.ContactID,
				CourseID:  *item.CourseID,
				Status:    "active",
				Source:    "purchase",
			}
			db.FirstOrCreate(&enrollment, models.CourseEnrollment{
				ContactID: order.ContactID,
				CourseID:  *item.CourseID,
			})
			continue
		}
		// Product purchase — check if product type is "course" (legacy/manual linkage)
		if item.ProductID != nil {
			var product models.Product
			if err := db.First(&product, *item.ProductID).Error; err != nil {
				continue
			}
			if product.Type == models.ProductTypeCourse {
				var courses []models.Course
				db.Where("product_id = ?", product.ID).Find(&courses)
				for _, course := range courses {
					enrollment := models.CourseEnrollment{
						TenantID:  1,
						ContactID: order.ContactID,
						CourseID:  course.ID,
						Status:    "active",
						Source:    "purchase",
					}
					db.FirstOrCreate(&enrollment, models.CourseEnrollment{
						ContactID: order.ContactID,
						CourseID:  course.ID,
					})
				}
			}
		}
	}

	events.Emit(events.PurchaseCompleted, map[string]interface{}{
		"order_id":   order.ID,
		"contact_id": order.ContactID,
		"total":      order.Total,
	})
	syncOrderToAtlas(db, order)
}

func syncOrderToAtlas(db *gorm.DB, order *models.Order) {
	var existing models.AtlasRevenueEntry
	if err := db.Where("source_type = ? AND source_id = ?", "order", order.ID).First(&existing).Error; err == nil {
		return
	}

	var contact models.Contact
	if err := db.First(&contact, order.ContactID).Error; err != nil {
		return
	}

	var atlasContact models.AtlasContact
	if err := db.Where("email = ? AND tenant_id = ?", contact.Email, 1).First(&atlasContact).Error; err != nil {
		name := strings.TrimSpace(contact.FirstName + " " + contact.LastName)
		if name == "" {
			name = contact.Email
		}
		atlasContact = models.AtlasContact{
			TenantID:  1,
			Name:      name,
			Email:     contact.Email,
			Phone:     contact.Phone,
			Source:    models.AtlasSourceWebsite,
			Type:      models.AtlasContactTypeClient,
			Status:    models.AtlasContactStatusWon,
			Currency:  strings.ToUpper(order.Currency),
			DealValue: order.Total,
		}
		if err := db.Create(&atlasContact).Error; err != nil {
			return
		}
	}

	stream := models.AtlasStreamDGateway
	description := "Order purchase"
	for _, item := range order.Items {
		if item.CourseID != nil {
			stream = models.AtlasStreamCourse
			description = "Course purchase"
			break
		}
	}

	sourceID := order.ID
	entry := models.AtlasRevenueEntry{
		TenantID:      1,
		Stream:        stream,
		SourceID:      &sourceID,
		SourceType:    "order",
		Amount:        order.Total,
		Currency:      strings.ToUpper(order.Currency),
		Description:   fmt.Sprintf("%s %s", description, order.OrderNumber),
		PaymentMethod: models.AtlasPaymentStripe,
		PaymentDate:   order.PaidAt,
		InvoiceNumber: order.OrderNumber,
		ContactID:     &atlasContact.ID,
	}
	if err := db.Create(&entry).Error; err != nil {
		return
	}

	metadata, _ := json.Marshal(map[string]interface{}{
		"order_id":     order.ID,
		"order_number": order.OrderNumber,
		"payment_id":   order.PaymentID,
	})
	interaction := models.AtlasInteraction{
		TenantID:  1,
		ContactID: atlasContact.ID,
		Type:      models.AtlasInteractionNote,
		Channel:   models.AtlasChannelInPerson,
		Subject:   "Payment completed",
		Body:      fmt.Sprintf("Customer completed payment for order %s (%s %.2f).", order.OrderNumber, strings.ToUpper(order.Currency), order.Total),
		Direction: models.AtlasDirectionInbound,
		Status:    "completed",
		Metadata:  metadata,
	}
	_ = db.Create(&interaction).Error
}
