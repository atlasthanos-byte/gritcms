# Payments (Stripe-First)

This project now supports a Stripe-first payment flow with:

- Admin-managed payment settings (`Settings -> Payments`)
- Per-page payment processor selection in the page builder
- A builder payment section (`Payment Module`)
- Checkout APIs with processor resolution from page + request + defaults
- ATLAS CRM revenue/contact sync on successful payment fulfillment

## 1) Configure Payments

Open Admin settings and go to `Payments`, then set:

- `default_processor` (currently `stripe`)
- `stripe_publishable_key`
- `stripe_secret_key`
- `stripe_webhook_secret`

These are stored in settings group `payments` and override environment defaults when present.

## 2) Stripe Test Mode

Use Stripe test keys and run webhook forwarding:

```bash
stripe listen --forward-to http://localhost:8080/api/webhooks/stripe
```

Use this test card:

- `4242 4242 4242 4242`
- Any future expiry date
- Any CVC

## 3) Website/Builder Usage

### Product/Course pages

Existing product and course pages create checkout via:

- `POST /api/checkout`
- `POST /api/checkout/:orderId/confirm`

### Builder payment section

In page builder, add `Payment Module` section and set:

- `checkoutType`: `product` or `course`
- `productId` or `courseId`
- optional `priceId`

When rendered publicly, the section triggers checkout and opens Stripe Elements checkout modal.

## 4) Processor Resolution

Checkout processor is resolved in this order:

1. Request payload `processor`
2. Page-level `payment_provider`
3. Payments setting `default_processor`
4. Fallback: `stripe`

If Stripe keys are missing, checkout returns validation error.

## 5) ATLAS Sync Behavior

On successful fulfillment (`confirm` or webhook):

- Order is marked paid and fulfilled
- Revenue entry is created in `atlas_revenue_entries` with:
  - `source_type = "order"`
  - `source_id = order.id`
  - payment method `stripe`
- ATLAS contact is created/linked by email if missing
- A payment interaction note is written in `atlas_interactions`

Sync is idempotent for revenue entries (existing `source_type/source_id` is skipped).

## 6) End-to-End Validation Checklist

- Save keys in `Settings -> Payments`
- Add builder `Payment Module` section to a page
- Publish page and open it on website
- Start checkout and complete with test card
- Confirm:
  - order status becomes `paid`
  - webhook/confirm succeeds
  - ATLAS revenue entry exists for that order
  - ATLAS contact/interaction reflects purchase

