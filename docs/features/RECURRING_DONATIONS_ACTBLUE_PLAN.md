# Implementation Plan: Recurring Donations & ActBlue Integration

## Overview
This document outlines the comprehensive plan to add recurring donations/subscriptions with ActBlue integration to the Civics Lab CRM platform.

## Current System Analysis

### Existing Donations Schema
- Basic one-time donation tracking
- Fields: id, amount, contactId, businessId, status, paymentType, notes, createdAt, updatedAt
- Status enum: 'promise', 'donated', 'processing', 'cleared'
- No recurring payment support
- No external payment processor integration

---

## Phase 1: Database Schema Extensions

### New Tables to Create

#### 1. `products` table
Track donation products/tiers that contacts can subscribe to.

```typescript
{
  id: uuid (primary key),
  workspaceId: uuid (references workspaces),
  name: text,
  description: text,
  amount: integer,
  billingPeriod: product_billing_period_enum ('one_time', 'weekly', 'monthly', 'yearly'),
  isActive: boolean (default: true),
  metadata: jsonb,
  createdAt: timestamp,
  updatedAt: timestamp,
  createdById: uuid (references users)
}
```

#### 2. `subscriptions` table
Track recurring subscriptions for contacts.

```typescript
{
  id: uuid (primary key),
  workspaceId: uuid (references workspaces),
  contactId: uuid (references contacts),
  productId: uuid (references products),
  status: subscription_status_enum ('active', 'canceled', 'paused', 'failed', 'pending'),
  startDate: timestamp,
  nextBillingDate: timestamp,
  endDate: timestamp,
  canceledAt: timestamp,
  billingPeriod: product_billing_period_enum,
  amount: integer,
  actblueOrderNumber: text,
  recurringDuration: integer (nullable - null means infinite),
  recurringCompleted: integer (default: 0),
  weeklyRecurringSunset: date (nullable),
  metadata: jsonb,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### 3. `actblue_config` table
Store ActBlue API credentials and webhook settings per workspace.

```typescript
{
  id: uuid (primary key),
  workspaceId: uuid (references workspaces, unique),
  clientUuid: text,
  clientSecretEncrypted: text,
  webhookUrl: text,
  webhookUsername: text,
  webhookPasswordHash: text,
  isActive: boolean (default: false),
  lastSyncAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
  createdById: uuid (references users)
}
```

#### 4. `actblue_webhook_logs` table
Log all incoming webhooks for debugging/audit.

```typescript
{
  id: uuid (primary key),
  workspaceId: uuid (references workspaces),
  eventType: actblue_event_type_enum ('donation', 'refund', 'cancellation'),
  actblueOrderNumber: text,
  payload: jsonb,
  processedAt: timestamp,
  status: text ('success', 'failed', 'pending'),
  errorMessage: text,
  createdAt: timestamp
}
```

#### 5. `actblue_imports` table
Track CSV import sessions from ActBlue.

```typescript
{
  id: uuid (primary key),
  workspaceId: uuid (references workspaces),
  importType: text ('webhook', 'csv'),
  filename: text,
  csvType: text ('paid_contributions', 'refunded_contributions', 'cancelled_recurring_contributions', 'managed_form_contributions'),
  dateRangeStart: date,
  dateRangeEnd: date,
  totalRecords: integer,
  processedRecords: integer (default: 0),
  successfulRecords: integer (default: 0),
  failedRecords: integer (default: 0),
  status: import_status_enum ('pending', 'processing', 'completed', 'failed'),
  errorLog: jsonb,
  createdAt: timestamp,
  completedAt: timestamp,
  createdById: uuid (references users)
}
```

### Modified Tables

#### `donations` table - Add fields:
```typescript
// New fields to add:
{
  productId: uuid (references products, nullable),
  subscriptionId: uuid (references subscriptions, nullable),
  isRecurring: boolean (default: false),
  recurringPeriod: text ('once', 'weekly', 'monthly'),
  recurrenceNumber: integer (nullable - which payment in sequence),
  actblueOrderNumber: text (nullable),
  actblueLineitemId: text (nullable, unique),
  actbluePaymentId: text (nullable),
  actblueDonorId: text (nullable),
  actblueData: jsonb (nullable - full ActBlue payload),
  externalSource: text (nullable - 'actblue', 'manual', etc.),
  refundedAt: timestamp (nullable),
  disbursedAt: timestamp (nullable),
  recoveredAt: timestamp (nullable)
}
```

### New Enums
```sql
CREATE TYPE product_billing_period AS ENUM ('one_time', 'weekly', 'monthly', 'yearly');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'paused', 'failed', 'pending');
CREATE TYPE actblue_event_type AS ENUM ('donation', 'refund', 'cancellation');
```

---

## Phase 2: ActBlue Webhook Integration

### Webhook Endpoint Architecture

#### 1. Create `/api/actblue/webhook` endpoint
- Accept POST requests with Basic Auth
- Validate webhook signature/credentials
- Parse donation, refund, and cancellation events
- Process asynchronously to return 200 quickly (within 2 seconds)
- Rate limiting and error handling

#### 2. Webhook Processing Logic

**For Donations:**
1. Parse donor info (name, email, address, phone, employer)
2. Match or create contact using fuzzy matching:
   - Primary: email match
   - Secondary: name + address match
   - Create new contact if no match
3. Extract line items (handles split donations)
4. Create/update donation records
5. Handle recurring donations:
   - Create subscription record if `recurringPeriod !== 'once'`
   - Link subsequent donations to subscription via `actblueOrderNumber`
   - Track recurrence number (`sequence` field)
6. Create/update product if needed
7. Log webhook to `actblue_webhook_logs`

**For Cancellations:**
1. Find subscription by `actblueOrderNumber`
2. Update subscription status to 'canceled'
3. Set `endDate` and `canceledAt` to cancellation timestamp
4. Extract cancellation metadata (reason, type, recurCompleted, recurPledged)
5. Log cancellation event

**For Refunds:**
1. Find donation by `actblueLineitemId`
2. Update donation status to 'refunded'
3. Set `refundedAt`, `disbursedAt`, `recoveredAt` timestamps
4. Create interaction stream entry for refund
5. If recurring, evaluate if subscription should be canceled

### Webhook Security
- Basic Authentication validation
- IP whitelist (ActBlue IPs only)
- Request signature validation
- Rate limiting (handle thousands per minute at peak)
- Idempotency (prevent duplicate processing)

---

## Phase 3: ActBlue CSV Import

### CSV API Integration

#### 1. Create `/api/actblue/csv/request` endpoint
- Accept date range parameters
- Validate ActBlue credentials
- Request CSV generation from ActBlue CSV API
- Return CSV request ID for polling

#### 2. Create `/api/actblue/csv/[id]/status` endpoint
- Poll CSV generation status
- Return download URL when ready

#### 3. Create `/api/actblue/csv/[id]/import` endpoint
- Download CSV from ActBlue
- Parse and validate CSV data
- Process in background job
- Track import session in `actblue_imports` table

### CSV Processing Service

**Supported CSV Types:**
- `paid_contributions` - paid, non-refunded contributions
- `refunded_contributions` - refunded contributions in date range
- `cancelled_recurring_contributions` - canceled recurring in date range
- `managed_form_contributions` - contributions through managed forms

**Processing Logic:**
1. Parse CSV fields and map to internal schema
2. Deduplicate against existing donations (by `actblueLineitemId`)
3. Handle contact matching (same logic as webhooks)
4. Batch insert donations for performance (chunks of 100)
5. Generate import report with success/failure counts
6. Flag mismatches for manual review

### Import Reconciliation
- Compare webhook vs CSV data
- Show differences and conflicts
- Allow manual resolution
- Support bulk updates from CSV

---

## Phase 4: Contact Matching Algorithm

### Matching Strategy

**Priority Levels:**
1. **Exact email match** → 95% confidence
   - Search by email in `contact_emails` table
   - Case-insensitive comparison

2. **Name + exact address match** → 85% confidence
   - firstName + lastName + streetAddress + zip

3. **Name + zip code match** → 70% confidence
   - firstName + lastName + zip code
   - Fuzzy name matching (Levenshtein distance < 3)

4. **Name + phone match** → 80% confidence
   - firstName + lastName + phone number

5. **No match** → Create new contact
   - Tag with "ActBlue Import"
   - Flag for manual review if multiple potential matches

### Duplicate Prevention
- Store `actblueDonorId` for linking
- Use `actblueOrderNumber` to group recurring donations
- Flag potential duplicates for review (confidence < 70%)
- Allow manual contact merging with merge history

### Data Enrichment
- Create contact if doesn't exist
- Add email, phone, address from ActBlue data
- Store employer information
- Add "ActBlue Donor" tag automatically

---

## Phase 5: Product/Subscription Management

### UI Components

#### 1. Products Management Page (`/[workspace]/products`)
- List all donation products/tiers
- Create/edit/archive products
- Set default amounts and billing periods
- Track active subscriptions per product
- Show total recurring revenue per product

#### 2. Subscriptions Dashboard (`/[workspace]/subscriptions`)
- List all active/canceled subscriptions
- Filter by status, product, contact
- Show upcoming billing dates
- Allow manual cancellation/pause
- Display subscription history
- Show failed payment alerts
- Export subscription data

#### 3. Contact Profile Enhancements
- Add "Subscriptions" section
- Show active subscriptions with status badges
- Display recurring donation history
- Link to manage subscription
- Show total lifetime value
- ActBlue order number for reference

#### 4. ActBlue Settings Page (`/[workspace]/settings/actblue`)
- Configure ActBlue API credentials
- Set up webhook endpoint URL
- Display webhook URL and credentials for ActBlue setup
- Test webhook connection
- Configure automatic import schedules
- View webhook logs (last 100)
- View import history
- Download import reports
- Manage contact matching rules

---

## Phase 6: Security & Validation

### Security Measures

#### 1. Webhook Authentication
- Validate Basic Auth credentials against stored hash
- Rate limiting (max 1000 requests/minute per workspace)
- Request signature validation (HMAC)
- Reject malformed payloads

#### 2. API Key Encryption
- Encrypt ActBlue client secret in database using AES-256
- Use environment variable for encryption key
- Never expose secrets in logs or responses

#### 3. Input Validation
- Validate all webhook payloads with Zod schemas
- Sanitize contact data (prevent XSS)
- Prevent SQL injection (use parameterized queries)
- Validate amounts (must be positive integers)
- Validate dates (must be valid ISO 8601)

#### 4. Audit Trail
- Log all ActBlue webhook events
- Track subscription state changes
- Record who made manual changes
- Store full webhook payload for debugging
- Retention: 90 days for webhook logs

---

## Phase 7: Business Logic Services

### New Services to Create

#### 1. `src/lib/services/productService.ts`
- `createProduct(workspaceId, data)` - Create new product
- `updateProduct(productId, data)` - Update product
- `archiveProduct(productId)` - Soft delete
- `getProducts(workspaceId)` - List all products
- `getActiveProducts(workspaceId)` - List active only
- `getProductStats(productId)` - Subscription counts, revenue

#### 2. `src/lib/services/subscriptionService.ts`
- `createSubscription(data)` - Create new subscription
- `updateSubscription(id, data)` - Update subscription
- `cancelSubscription(id, reason)` - Cancel subscription
- `pauseSubscription(id)` - Pause subscription
- `resumeSubscription(id)` - Resume paused subscription
- `processRecurringPayment(subscriptionId)` - Process payment
- `handleFailedPayment(subscriptionId)` - Handle failures
- `getContactSubscriptions(contactId)` - Get by contact
- `getUpcomingBilling(workspaceId)` - Upcoming payments

#### 3. `src/lib/services/actblue/webhookService.ts`
- `validateWebhook(request)` - Validate auth and payload
- `parseWebhookPayload(body)` - Parse JSON payload
- `routeEvent(eventType, payload)` - Route to handlers
- `processDonation(payload)` - Handle donation event
- `processRefund(payload)` - Handle refund event
- `processCancellation(payload)` - Handle cancellation

#### 4. `src/lib/services/actblue/csvService.ts`
- `requestCsv(workspaceId, params)` - Request CSV from ActBlue
- `pollCsvStatus(csvId)` - Check CSV generation status
- `downloadCsv(downloadUrl)` - Download generated CSV
- `parseCsv(csvData, csvType)` - Parse CSV rows
- `importCsvData(importSessionId, data)` - Import to DB

#### 5. `src/lib/services/contactMatchingService.ts`
- `findContactByEmail(email, workspaceId)` - Email match
- `findContactByNameAddress(data, workspaceId)` - Name+address
- `findContactByNameZip(data, workspaceId)` - Name+zip
- `calculateMatchConfidence(contact, actblueData)` - Score
- `createContactFromActBlue(data, workspaceId)` - Create new
- `findPotentialDuplicates(contactId)` - Find duplicates

---

## Phase 8: Testing Strategy

### Test Coverage

#### 1. Unit Tests
- Contact matching logic (various scenarios)
- Webhook payload parsing (all event types)
- CSV import processing (valid and invalid data)
- Subscription state transitions (lifecycle)
- Amount calculations and formatting

#### 2. Integration Tests
- Webhook endpoint handling (auth, validation, processing)
- ActBlue API integration (CSV request, poll, download)
- Database operations (CRUD for all new tables)
- Contact matching with real-world data

#### 3. End-to-End Tests
- Complete donation flow (webhook → contact → donation → subscription)
- CSV import workflow (request → download → import)
- Subscription lifecycle (create → recurring → cancel)
- Refund handling (webhook → update donation → create interaction)

#### 4. Mock Data
- Use ActBlue test payload examples
- Create fixture contacts with various match scenarios
- Simulate recurring donations over time
- Test edge cases (missing fields, invalid data)

### Test Files Structure
```
tests/
├── unit/
│   ├── services/
│   │   ├── contactMatching.test.ts
│   │   ├── subscriptionService.test.ts
│   │   └── productService.test.ts
│   └── lib/
│       └── actblue/
│           ├── webhookParser.test.ts
│           └── csvParser.test.ts
├── integration/
│   ├── api/
│   │   ├── actblueWebhook.test.ts
│   │   └── actblueCsv.test.ts
│   └── services/
│       └── donationProcessing.test.ts
└── fixtures/
    ├── actblueWebhookPayloads.json
    ├── actblueCsvData.csv
    └── testContacts.json
```

---

## Phase 9: Implementation Sequence

### Sprint 1: Foundation (Weeks 1-2)
**Database & Types**
- [ ] Create database migration with all new tables and enums
- [ ] Update schema.ts with new table definitions
- [ ] Add relations for new tables
- [ ] Create TypeScript types for products, subscriptions, ActBlue
- [ ] Run migration and verify schema

**Product Management**
- [ ] Create productService.ts
- [ ] Build product API endpoints (CRUD)
- [ ] Create product management UI components
- [ ] Test product creation and management

### Sprint 2: ActBlue Webhooks (Weeks 3-4)
**Webhook Infrastructure**
- [ ] Create webhook endpoint `/api/actblue/webhook`
- [ ] Implement Basic Auth validation
- [ ] Create webhook logging system
- [ ] Build webhook payload parser with Zod validation

**Contact Matching**
- [ ] Build contactMatchingService.ts
- [ ] Implement fuzzy matching algorithms
- [ ] Add confidence scoring system
- [ ] Test with various contact scenarios

**Donation Processing**
- [ ] Create donation webhook handler
- [ ] Implement subscription creation logic
- [ ] Handle recurring payment tracking
- [ ] Add refund webhook handler
- [ ] Add cancellation webhook handler
- [ ] Test with ActBlue test payloads

### Sprint 3: CSV Import (Weeks 5-6)
**CSV API Integration**
- [ ] Integrate ActBlue CSV API (request, poll, download)
- [ ] Create CSV import endpoints
- [ ] Build CSV parser for all supported types
- [ ] Implement batch processing for performance

**Import Management**
- [ ] Create import session tracking
- [ ] Build import UI with progress indicators
- [ ] Add reconciliation tools for mismatches
- [ ] Create import reports and error handling

### Sprint 4: Subscription Management (Weeks 7-8)
**Subscription Features**
- [ ] Create subscriptionService.ts
- [ ] Build subscription API endpoints
- [ ] Implement subscription lifecycle management
- [ ] Add recurring payment processing

**UI Components**
- [ ] Build subscriptions dashboard
- [ ] Add subscription status tracking
- [ ] Create contact profile subscription section
- [ ] Build ActBlue settings page
- [ ] Add webhook log viewer

### Sprint 5: Polish & Testing (Week 9)
**Testing & Quality**
- [ ] Write comprehensive unit tests
- [ ] Create integration tests
- [ ] Build end-to-end test scenarios
- [ ] Performance testing (webhook volume, CSV imports)

**Documentation & Deployment**
- [ ] User documentation for ActBlue setup
- [ ] Admin guide for subscription management
- [ ] API documentation for webhooks
- [ ] Deploy to staging environment
- [ ] User acceptance testing
- [ ] Production deployment

---

## Key Features Summary

✅ **Products/Subscription Tiers** - Define recurring donation products
✅ **Recurring Donation Tracking** - Monitor all subscription-based donations
✅ **Active/Inactive Status** - Track subscription lifecycle states
✅ **ActBlue Webhook Integration** - Real-time donation processing
✅ **ActBlue CSV Import** - Bulk historical data import
✅ **Contact Auto-Matching** - Intelligent donor identification
✅ **Subscription Management UI** - Admin tools for managing subscriptions
✅ **Payment History** - Complete donation timeline per contact
✅ **Refund & Cancellation Handling** - Process ActBlue events
✅ **Audit Logs** - Track all ActBlue interactions

---

## Critical Considerations

### 1. ActBlue Rate Limits
- CSV API: 10 successful requests/minute
- Implement request queuing system
- Use exponential backoff for retries
- Cache CSV downloads for 2 hours

### 2. Webhook Volume
- Peak times: thousands of requests per minute
- Use background job queue (BullMQ or similar)
- Return 200 status within 2 seconds
- Process asynchronously
- Implement circuit breaker pattern

### 3. Data Consistency
- Webhooks may arrive out of order
- Use idempotency keys (actblueLineitemId)
- Handle duplicate webhook deliveries
- Implement retry logic with exponential backoff
- Store raw webhook payload for reprocessing

### 4. Contact Privacy
- Respect donor email opt-out preferences
- Handle "email withheld" scenario
- Store ActBlue donor consent flags
- Comply with GDPR/privacy regulations

### 5. Multi-Workspace Isolation
- Ensure proper workspace isolation for ActBlue configs
- Validate workspace access in all endpoints
- Separate webhook URLs per workspace
- Isolate contact matching to workspace only

### 6. Error Handling
- Graceful degradation (webhook failure shouldn't break system)
- Retry failed webhooks automatically
- Alert on repeated failures
- Provide manual retry UI for failed imports

### 7. Performance Optimization
- Index actblueLineitemId, actblueOrderNumber for fast lookups
- Batch insert donations (100 at a time)
- Use database connection pooling
- Implement caching for frequently accessed data
- Consider read replicas for reporting

---

## Database Indexes to Create

```sql
-- For fast ActBlue lookups
CREATE INDEX idx_donations_actblue_lineitem ON donations(actblue_lineitem_id);
CREATE INDEX idx_donations_actblue_order ON donations(actblue_order_number);
CREATE INDEX idx_subscriptions_actblue_order ON subscriptions(actblue_order_number);

-- For contact matching
CREATE INDEX idx_contact_emails_email ON contact_emails(email);
CREATE INDEX idx_contacts_workspace ON contacts(workspace_id);

-- For webhook logs
CREATE INDEX idx_webhook_logs_workspace ON actblue_webhook_logs(workspace_id);
CREATE INDEX idx_webhook_logs_created ON actblue_webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_order ON actblue_webhook_logs(actblue_order_number);

-- For subscription queries
CREATE INDEX idx_subscriptions_contact ON subscriptions(contact_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);
```

---

## Environment Variables Required

```env
# ActBlue Encryption
ACTBLUE_ENCRYPTION_KEY=<secure-random-key>

# Webhook Settings
ACTBLUE_WEBHOOK_BASE_URL=https://yourdomain.com/api/actblue/webhook

# Rate Limiting
ACTBLUE_WEBHOOK_RATE_LIMIT=1000  # per minute
ACTBLUE_CSV_RATE_LIMIT=10        # per minute

# Background Jobs
REDIS_URL=redis://localhost:6379  # for job queue
```

---

## API Endpoints Summary

### Products
- `GET /api/products?workspace_id=<id>` - List products
- `POST /api/products` - Create product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Archive product

### Subscriptions
- `GET /api/subscriptions?workspace_id=<id>` - List subscriptions
- `GET /api/subscriptions/[id]` - Get subscription details
- `POST /api/subscriptions` - Create subscription
- `PUT /api/subscriptions/[id]` - Update subscription
- `POST /api/subscriptions/[id]/cancel` - Cancel subscription
- `POST /api/subscriptions/[id]/pause` - Pause subscription
- `POST /api/subscriptions/[id]/resume` - Resume subscription

### ActBlue Webhooks
- `POST /api/actblue/webhook` - Webhook receiver (Basic Auth)
- `GET /api/actblue/webhook-logs?workspace_id=<id>` - View logs

### ActBlue CSV
- `POST /api/actblue/csv/request` - Request CSV generation
- `GET /api/actblue/csv/[id]/status` - Check CSV status
- `POST /api/actblue/csv/[id]/import` - Import CSV data
- `GET /api/actblue/imports?workspace_id=<id>` - List imports

### ActBlue Config
- `GET /api/actblue/config?workspace_id=<id>` - Get config
- `POST /api/actblue/config` - Create/update config
- `POST /api/actblue/config/test` - Test connection

---

## Success Metrics

### Technical Metrics
- Webhook processing time < 2 seconds
- Contact match accuracy > 90%
- Zero duplicate donations created
- CSV import success rate > 95%
- System uptime 99.9%

### Business Metrics
- Number of recurring donors tracked
- Total recurring revenue monitored
- Donation processing accuracy
- Time saved on manual data entry
- Donor engagement insights

---

## Next Steps

1. **Review and Approve Plan** - Stakeholder sign-off
2. **Set Up Development Environment** - Configure ActBlue test account
3. **Begin Sprint 1** - Database schema and products
4. **Weekly Progress Reviews** - Track against timeline
5. **User Testing** - Beta test with small dataset
6. **Production Launch** - Phased rollout with monitoring

---

**Document Version:** 1.0
**Created:** 2025-10-13
**Last Updated:** 2025-10-13
**Status:** Ready for Implementation
