# API Documentation

Complete API reference for Shuleyetu backend services.

---

## Base URLs

- **Development**: `http://localhost:3000/api`
- **Production**: `https://shuleyetu-web.vercel.app/api`

---

## Authentication

### Bearer Token

Admin endpoints require JWT bearer token authentication.

```bash
Authorization: Bearer <jwt_token>
```

### Public Access Token

Order tracking endpoints use UUID-based public access tokens.

```
GET /orders/track?orderId=<id>&token=<token>
```

---

## Admin Endpoints

### Check Admin Status

Verify if current user is an admin.

```
GET /api/admin/check
Authorization: Bearer <token>
```

**Response**
```json
{
  "isAdmin": true,
  "userId": "user-id",
  "email": "admin@example.com"
}
```

---

### Vendor Management

#### List All Vendors

```
GET /api/admin/vendors
Authorization: Bearer <token>
```

**Response**
```json
{
  "vendors": [
    {
      "id": "vendor-id",
      "name": "Vendor Name",
      "description": "Description",
      "region": "Dar es Salaam",
      "district": "Ilala",
      "ward": "Kariakoo"
    }
  ]
}
```

---

### Vendor User Management

#### Link User to Vendor

Link a user to a vendor, granting them access to that vendor's dashboard.

```
POST /api/admin/link-vendor-user
Authorization: Bearer <token>
Content-Type: application/json

{
  "userEmail": "vendor@example.com",
  "vendorId": "vendor-id"
}
```

**Response**
```json
{
  "success": true,
  "message": "User linked to vendor",
  "vendorUserId": "link-id"
}
```

**Errors**
- `400`: Invalid email or vendor ID
- `404`: User or vendor not found
- `409`: User already linked to vendor

---

#### Unlink User from Vendor

Remove a user's access to a vendor's dashboard.

```
POST /api/admin/unlink-vendor-user
Authorization: Bearer <token>
Content-Type: application/json

{
  "userEmail": "vendor@example.com",
  "vendorId": "vendor-id"
}
```

**Response**
```json
{
  "success": true,
  "message": "User unlinked from vendor"
}
```

---

#### Get Vendor Users

List all users linked to a vendor.

```
GET /api/admin/vendor-users?vendorId=<vendor-id>
Authorization: Bearer <token>
```

**Response**
```json
{
  "vendorUsers": [
    {
      "userId": "user-id",
      "vendorId": "vendor-id",
      "userEmail": "vendor@example.com",
      "linkedAt": "2024-01-12T10:30:00Z"
    }
  ]
}
```

---

### Admin Management

#### Grant Admin Role

Give a user admin privileges.

```
POST /api/admin/grant-admin
Authorization: Bearer <token>
Content-Type: application/json

{
  "userEmail": "newadmin@example.com"
}
```

**Response**
```json
{
  "success": true,
  "message": "Admin role granted",
  "userId": "user-id"
}
```

**Errors**
- `400`: Invalid email
- `404`: User not found
- `409`: User already has admin role

---

#### Revoke Admin Role

Remove admin privileges from a user.

```
POST /api/admin/revoke-admin
Authorization: Bearer <token>
Content-Type: application/json

{
  "userEmail": "admin@example.com"
}
```

**Response**
```json
{
  "success": true,
  "message": "Admin role revoked"
}
```

---

#### List All Admins

Get all users with admin role.

```
GET /api/admin/admins
Authorization: Bearer <token>
```

**Response**
```json
{
  "admins": [
    {
      "userId": "user-id",
      "email": "admin@example.com",
      "grantedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## Payment Endpoints

### Initiate Payment

Start a ClickPesa USSD payment.

```
POST /api/clickpesa/pay
Content-Type: application/json

{
  "orderId": "order-id",
  "publicAccessToken": "token",
  "phoneNumber": "255712345678"
}
```

**Response**
```json
{
  "success": true,
  "message": "Payment initiated",
  "transactionId": "txn-id",
  "ussdCode": "*123*1*1#"
}
```

**Errors**
- `400`: Invalid order or phone number
- `401`: Invalid access token
- `404`: Order not found
- `500`: ClickPesa API error

---

### Check Payment Status

Get current payment status for an order.

```
GET /api/clickpesa/status?orderId=<order-id>&token=<token>
```

**Response**
```json
{
  "orderId": "order-id",
  "paymentStatus": "paid",
  "amount": 50000,
  "transactionId": "txn-id",
  "timestamp": "2024-01-12T10:30:00Z"
}
```

---

### Payment Webhook

ClickPesa sends payment updates to this endpoint.

```
POST /api/clickpesa/webhook
Content-Type: application/json
X-Clickpesa-Signature: <hmac-signature>

{
  "orderId": "order-id",
  "status": "success",
  "amount": 50000,
  "transactionId": "txn-id",
  "timestamp": "2024-01-12T10:30:00Z"
}
```

**Signature Verification**

The webhook includes an HMAC SHA256 signature in the `X-Clickpesa-Signature` header. Verify it using:

```
signature = HMAC-SHA256(payload, CLICKPESA_API_KEY)
```

---

## Public Order Endpoints

### Get Public Orders

Retrieve orders using public access token (no authentication required).

```
GET /api/orders/public?orderId=<order-id>&token=<token>
```

**Response**
```json
{
  "order": {
    "id": "order-id",
    "vendorId": "vendor-id",
    "vendorName": "Vendor Name",
    "customerName": "Customer Name",
    "customerPhone": "0712345678",
    "studentName": "Student Name",
    "schoolName": "School Name",
    "totalAmountTzs": 50000,
    "status": "completed",
    "paymentStatus": "paid",
    "createdAt": "2024-01-12T10:30:00Z",
    "items": [
      {
        "id": "item-id",
        "name": "Mathematics Textbook",
        "category": "textbook",
        "quantity": 1,
        "unitPriceTzs": 25000,
        "totalPriceTzs": 25000
      }
    ]
  }
}
```

**Errors**
- `400`: Invalid order ID or token
- `404`: Order not found
- `401`: Invalid access token

---

## Database Queries

### Get Vendors with Inventory Count

```sql
SELECT 
  v.id,
  v.name,
  v.description,
  v.region,
  COUNT(i.id) as inventory_count
FROM vendors v
LEFT JOIN inventory i ON v.id = i.vendor_id
GROUP BY v.id
ORDER BY v.created_at DESC;
```

---

### Get Order Summary

```sql
SELECT 
  o.id,
  o.customer_name,
  o.total_amount_tzs,
  o.status,
  o.payment_status,
  COUNT(oi.id) as item_count,
  v.name as vendor_name
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN vendors v ON o.vendor_id = v.id
GROUP BY o.id, v.id
ORDER BY o.created_at DESC;
```

---

### Get Vendor Sales Summary

```sql
SELECT 
  v.id,
  v.name,
  COUNT(DISTINCT o.id) as total_orders,
  SUM(o.total_amount_tzs) as total_sales,
  COUNT(CASE WHEN o.payment_status = 'paid' THEN 1 END) as paid_orders
FROM vendors v
LEFT JOIN orders o ON v.id = o.vendor_id
GROUP BY v.id
ORDER BY total_sales DESC;
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### Common Error Codes

- `INVALID_REQUEST`: Malformed request
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `VALIDATION_ERROR`: Invalid input data
- `INTERNAL_ERROR`: Server error

---

## Rate Limiting

API endpoints are rate limited to prevent abuse.

**Limits**
- Public endpoints: 100 requests per minute per IP
- Authenticated endpoints: 1000 requests per minute per user
- Payment endpoints: 10 requests per minute per order

**Headers**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## Pagination

List endpoints support pagination.

**Query Parameters**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `offset`: Skip N items (alternative to page)

**Response**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## Filtering

List endpoints support filtering.

**Query Parameters**
- `search`: Search by name or description
- `status`: Filter by status
- `category`: Filter by category
- `region`: Filter by region
- `fromDate`: Filter by start date (ISO 8601)
- `toDate`: Filter by end date (ISO 8601)

**Example**
```
GET /api/orders?status=completed&fromDate=2024-01-01&toDate=2024-01-31
```

---

## Sorting

List endpoints support sorting.

**Query Parameters**
- `sortBy`: Field to sort by
- `sortOrder`: `asc` or `desc` (default: `desc`)

**Example**
```
GET /api/orders?sortBy=createdAt&sortOrder=desc
```

---

## Webhooks

### Webhook Events

- `order.created`: New order created
- `order.updated`: Order status changed
- `payment.received`: Payment received
- `payment.failed`: Payment failed
- `inventory.updated`: Inventory changed

### Webhook Retry

Failed webhook deliveries are retried with exponential backoff:
- 1st retry: 5 minutes
- 2nd retry: 30 minutes
- 3rd retry: 2 hours
- 4th retry: 24 hours

### Webhook Signature

All webhooks include an HMAC SHA256 signature:

```
X-Webhook-Signature: sha256=<signature>
```

Verify using:
```
signature = HMAC-SHA256(body, webhook_secret)
```

---

## Versioning

API version is specified in the URL path.

```
GET /api/v1/orders
GET /api/v2/orders
```

Current version: **v1**

---

## CORS

Cross-Origin Resource Sharing is enabled for:
- `http://localhost:3000`
- `https://shuleyetu-web.vercel.app`
- `https://*.shuleyetu.com`

---

## Security Headers

All API responses include security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

---

## API Clients

### JavaScript/TypeScript

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Fetch orders
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('vendor_id', vendorId);
```

### cURL

```bash
curl -X GET 'https://shuleyetu-web.vercel.app/api/admin/vendors' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json'
```

### Python

```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://shuleyetu-web.vercel.app/api/admin/vendors',
    headers=headers
)
```

---

## Changelog

### v1.0.0 (2024-01-12)

**Initial Release**
- Admin management endpoints
- Vendor user management
- Payment integration
- Public order access
- Webhook support

---

## Analytics Endpoints

### Generate Sales Report

```
POST /api/analytics/sales
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "vendorId": "vendor-id"
}
```

**Response**
```json
{
  "period": { "start": "2024-01-01", "end": "2024-01-31" },
  "sales": {
    "totalSales": 500000,
    "averageOrderValue": 50000,
    "totalOrders": 10,
    "topProducts": [...],
    "topCategories": [...],
    "salesTrend": [...]
  },
  "inventory": {...},
  "customers": {...},
  "summary": {...}
}
```

### Export Analytics Report

```
GET /api/analytics/export?format=csv&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

**Response**: CSV or JSON file download

---

## Forecasting Endpoints

### Generate Inventory Forecast

```
POST /api/forecasting/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "vendorId": "vendor-id",
  "leadTimeDays": 7,
  "safetyStock": 10
}
```

**Response**
```json
{
  "generatedAt": "2024-01-21T12:00:00Z",
  "forecastPeriod": { "start": "2024-01-21", "end": "2024-02-20" },
  "items": [
    {
      "itemId": "item-1",
      "itemName": "Mathematics Textbook",
      "currentStock": 20,
      "averageDailySales": 2.5,
      "forecastedDemand": 75,
      "recommendedReorderPoint": 25,
      "recommendedOrderQuantity": 90,
      "daysUntilStockout": 8,
      "confidence": 0.85,
      "trend": "stable"
    }
  ],
  "summary": {
    "itemsAtRisk": 2,
    "totalRecommendedOrders": 500,
    "estimatedCost": 12500000
  }
}
```

### Get Urgent Reorders

```
GET /api/forecasting/urgent-reorders?vendorId=vendor-id&leadTimeDays=7
Authorization: Bearer <token>
```

**Response**: Array of items that need immediate reordering

### Get Overstocked Items

```
GET /api/forecasting/overstocked?vendorId=vendor-id
Authorization: Bearer <token>
```

**Response**: Array of overstocked items

---

## Notification Endpoints

### Send SMS Notification

```
POST /api/notifications/sms
Authorization: Bearer <token>
Content-Type: application/json

{
  "phoneNumber": "255712345678",
  "message": "Your order has been confirmed"
}
```

**Response**
```json
{
  "success": true,
  "messageId": "msg-123456",
  "status": "sent"
}
```

### Send WhatsApp Notification

```
POST /api/notifications/whatsapp
Authorization: Bearer <token>
Content-Type: application/json

{
  "phoneNumber": "255712345678",
  "message": "Your order has been confirmed"
}
```

**Response**
```json
{
  "success": true,
  "messageId": "msg-123456",
  "status": "sent"
}
```

### Get Notification Logs

```
GET /api/notifications/logs?limit=100&offset=0
Authorization: Bearer <token>
```

**Response**
```json
{
  "logs": [
    {
      "id": "log-1",
      "eventType": "order_created",
      "resourceId": "order-123",
      "status": "success",
      "createdAt": "2024-01-21T12:00:00Z"
    }
  ],
  "pagination": { "total": 1000, "limit": 100, "offset": 0 }
}
```

### Get Notification Statistics

```
GET /api/notifications/stats?days=7
Authorization: Bearer <token>
```

**Response**
```json
{
  "period": "7 days",
  "total": 500,
  "successful": 485,
  "failed": 15,
  "successRate": 97
}
```

---

## Error Tracking Endpoints

### Report Error

```
POST /api/errors/report
Content-Type: application/json

{
  "message": "Error message",
  "stack": "Stack trace",
  "context": {
    "userId": "user-id",
    "page": "/dashboard",
    "timestamp": "2024-01-21T12:00:00Z"
  }
}
```

**Response**
```json
{
  "success": true,
  "errorId": "err-123456"
}
```

### Get Error Statistics

```
GET /api/errors/stats?days=7
Authorization: Bearer <token>
```

**Response**
```json
{
  "period": "7 days",
  "totalErrors": 45,
  "uniqueErrors": 12,
  "topErrors": [
    {
      "message": "Network timeout",
      "count": 15,
      "lastOccurred": "2024-01-21T12:00:00Z"
    }
  ]
}
```

---

## Webhook Events

### Order Created

```json
{
  "event": "order.created",
  "data": {
    "orderId": "order-123",
    "customerId": "customer-456",
    "amount": 50000,
    "timestamp": "2024-01-21T12:00:00Z"
  }
}
```

### Order Status Updated

```json
{
  "event": "order.status_updated",
  "data": {
    "orderId": "order-123",
    "oldStatus": "pending",
    "newStatus": "processing",
    "timestamp": "2024-01-21T12:00:00Z"
  }
}
```

### Payment Received

```json
{
  "event": "payment.received",
  "data": {
    "orderId": "order-123",
    "amount": 50000,
    "method": "m-pesa",
    "timestamp": "2024-01-21T12:00:00Z"
  }
}
```

### Low Stock Alert

```json
{
  "event": "inventory.low_stock",
  "data": {
    "itemId": "item-123",
    "itemName": "Mathematics Textbook",
    "currentStock": 5,
    "threshold": 10,
    "timestamp": "2024-01-21T12:00:00Z"
  }
}
```

---

## Support

For API support, contact:
- Email: `api-support@shuleyetu.com`
- Issues: `https://github.com/kadioko/Shuleyetu/issues`
- Documentation: `https://docs.shuleyetu.com`

---

## Terms of Service

By using the Shuleyetu API, you agree to:
- Not abuse rate limits
- Not scrape data
- Maintain API key security
- Report security issues responsibly
- Follow local laws and regulations
