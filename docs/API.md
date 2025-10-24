# GreenScape Lux API Documentation

## Authentication

All API endpoints require authentication via Supabase JWT tokens.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Edge Functions

### 1. Create Payment Intent
**Endpoint:** `/functions/v1/create-payment-intent`
**Method:** POST

Creates a Stripe payment intent for job payments.

**Request:**
```json
{
  "amount": 15000,
  "currency": "usd",
  "jobId": "uuid",
  "customerId": "uuid"
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### 2. Auto Job Assignment
**Endpoint:** `/functions/v1/auto-job-assignment`
**Method:** POST

Automatically assigns jobs to available landscapers.

**Request:**
```json
{
  "jobId": "uuid",
  "preferences": {
    "maxDistance": 50,
    "minRating": 4.0
  }
}
```

**Response:**
```json
{
  "assigned": true,
  "landscaperId": "uuid",
  "score": 85.5
}
```

### 3. Marketing Automation
**Endpoint:** `/functions/v1/marketing-automation`
**Method:** POST

Triggers automated marketing campaigns.

**Request:**
```json
{
  "type": "welcome_series",
  "userId": "uuid",
  "userType": "customer"
}
```

**Response:**
```json
{
  "campaignId": "uuid",
  "status": "scheduled",
  "nextAction": "2024-01-15T10:00:00Z"
}
```

### 4. Submit Contact Form
**Endpoint:** `/functions/v1/submit-contact-form`
**Method:** POST

Handles contact form submissions.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "Interested in landscaping services"
}
```

**Response:**
```json
{
  "success": true,
  "contactId": "uuid"
}
```

## Database Tables

### Jobs
- `id`: UUID (Primary Key)
- `title`: Text
- `description`: Text
- `status`: Enum (pending, assigned, in_progress, completed, cancelled)
- `customer_id`: UUID (Foreign Key)
- `landscaper_id`: UUID (Foreign Key, nullable)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Payments
- `id`: UUID (Primary Key)
- `job_id`: UUID (Foreign Key)
- `amount`: Decimal
- `status`: Enum (pending, completed, failed, refunded)
- `stripe_payment_intent_id`: Text
- `created_at`: Timestamp

### Reviews
- `id`: UUID (Primary Key)
- `job_id`: UUID (Foreign Key)
- `customer_id`: UUID (Foreign Key)
- `landscaper_id`: UUID (Foreign Key)
- `rating`: Integer (1-5)
- `comment`: Text
- `created_at`: Timestamp

## Error Codes

- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server error

## Rate Limits

- Authentication endpoints: 5 requests per minute
- Payment endpoints: 10 requests per minute
- General endpoints: 100 requests per minute