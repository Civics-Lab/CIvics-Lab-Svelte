# Migration Testing Guide

## Overview

This guide outlines comprehensive testing procedures for the SvelteKit to Hono API migration. It ensures that all migrated endpoints maintain functionality, performance, and compatibility with existing frontend applications.

## Testing Phases

### Phase 1: Pre-Migration Baseline Testing
Document current behavior before migration to establish baseline metrics.

### Phase 2: Post-Migration Validation Testing  
Verify migrated endpoints match baseline behavior exactly.

### Phase 3: Integration Testing
Ensure frontend applications work seamlessly with migrated APIs.

### Phase 4: Performance & Load Testing
Validate performance improvements and system stability.

## Testing Categories

## 1. Functional Testing

### 1.1 CRUD Operations Testing

#### Workspace API Testing
```bash
# Test workspace creation
curl -X POST http://localhost:5173/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "Test Workspace"}'

# Expected Response: 201 Created
# Expected Body: {"workspace": {"id": "uuid", "name": "Test Workspace", ...}}

# Test workspace listing
curl -X GET http://localhost:5173/api/workspaces \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected Response: 200 OK
# Expected Body: {"workspaces": [...], "isGlobalSuperAdmin": false}

# Test workspace retrieval
curl -X GET http://localhost:5173/api/workspaces/WORKSPACE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected Response: 200 OK
# Expected Body: {"workspace": {...}}

# Test workspace update
curl -X PUT http://localhost:5173/api/workspaces/WORKSPACE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "Updated Workspace Name"}'

# Expected Response: 200 OK
# Expected Body: {"workspace": {"name": "Updated Workspace Name", ...}}

# Test workspace deletion
curl -X DELETE http://localhost:5173/api/workspaces/WORKSPACE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected Response: 200 OK
# Expected Body: {"success": true}
```

#### Contact API Testing
```bash
# Test contact creation
curl -X POST http://localhost:5173/api/contacts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "workspaceId": "WORKSPACE_ID"
  }'

# Test contact listing with search
curl -X GET "http://localhost:5173/api/contacts?workspace_id=WORKSPACE_ID&search=John" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test paginated contacts
curl -X GET "http://localhost:5173/api/contacts/paginated?workspace_id=WORKSPACE_ID&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test contact update
curl -X PUT http://localhost:5173/api/contacts/CONTACT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "firstName": "Jane",
    "workspaceId": "WORKSPACE_ID"
  }'

# Test contact deletion
curl -X DELETE http://localhost:5173/api/contacts/CONTACT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"workspaceId": "WORKSPACE_ID"}'
```

#### Business API Testing
```bash
# Test business creation
curl -X POST http://localhost:5173/api/businesses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "businessName": "Test Company",
    "workspaceId": "WORKSPACE_ID"
  }'

# Test business listing with search
curl -X GET "http://localhost:5173/api/businesses?workspace_id=WORKSPACE_ID&search=Test" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test paginated businesses
curl -X GET "http://localhost:5173/api/businesses/paginated?workspace_id=WORKSPACE_ID&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 1.2 Authentication & Authorization Testing

#### JWT Token Validation
```bash
# Test without token (should fail)
curl -X GET http://localhost:5173/api/workspaces

# Expected Response: 401 Unauthorized
# Expected Body: {"message": "Authentication required"}

# Test with invalid token (should fail)
curl -X GET http://localhost:5173/api/workspaces \
  -H "Authorization: Bearer invalid_token"

# Expected Response: 401 Unauthorized

# Test with expired token (should fail)
curl -X GET http://localhost:5173/api/workspaces \
  -H "Authorization: Bearer EXPIRED_TOKEN"

# Expected Response: 401 Unauthorized
```

#### Workspace Access Control
```bash
# Test accessing workspace user doesn't belong to (should fail)
curl -X GET http://localhost:5173/api/contacts?workspace_id=UNAUTHORIZED_WORKSPACE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected Response: 403 Forbidden
# Expected Body: {"message": "You do not have permission to access this workspace"}
```

### 1.3 Input Validation Testing

#### Required Field Validation
```bash
# Test missing required fields
curl -X POST http://localhost:5173/api/contacts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{}'

# Expected Response: 400 Bad Request
# Expected Body: Validation error details

# Test invalid UUID format
curl -X GET "http://localhost:5173/api/contacts?workspace_id=invalid-uuid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected Response: 400 Bad Request
```

#### Data Type Validation
```bash
# Test invalid data types
curl -X POST http://localhost:5173/api/contacts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "firstName": 123,
    "lastName": null,
    "workspaceId": "WORKSPACE_ID"
  }'

# Expected Response: 400 Bad Request
```

### 1.4 Search and Pagination Testing

#### Search Functionality
```bash
# Test search with results
curl -X GET "http://localhost:5173/api/contacts?workspace_id=WORKSPACE_ID&search=John" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test search with no results
curl -X GET "http://localhost:5173/api/contacts?workspace_id=WORKSPACE_ID&search=NonexistentName" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test empty search (should return all)
curl -X GET "http://localhost:5173/api/contacts?workspace_id=WORKSPACE_ID&search=" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Pagination Testing
```bash
# Test first page
curl -X GET "http://localhost:5173/api/contacts/paginated?workspace_id=WORKSPACE_ID&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected Response: Should include pagination metadata
# Expected Body: {
#   "contacts": [...],
#   "pagination": {
#     "page": 1,
#     "limit": 5,
#     "total": X,
#     "totalPages": Y,
#     "hasNext": true/false,
#     "hasPrev": false
#   }
# }

# Test invalid pagination parameters
curl -X GET "http://localhost:5173/api/contacts/paginated?workspace_id=WORKSPACE_ID&page=0&limit=-1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 2. Integration Testing

### 2.1 Frontend Compatibility Testing

#### Existing API Calls
Verify that existing frontend code works without modification:

```javascript
// Test existing fetch calls still work
const response = await fetch('/api/workspaces', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Workspaces:', data.workspaces);

// Verify response structure matches expectations
expect(data).toHaveProperty('workspaces');
expect(data).toHaveProperty('isGlobalSuperAdmin');
```

#### Form Submissions
Test that existing forms submit correctly:

```javascript
// Test contact creation form
const contactData = {
  firstName: 'Test',
  lastName: 'User',
  workspaceId: currentWorkspace.id
};

const response = await fetch('/api/contacts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(contactData)
});

expect(response.status).toBe(201);
const result = await response.json();
expect(result).toHaveProperty('contact');
```

### 2.2 Database Integration Testing

#### Transaction Testing
```sql
-- Verify workspace isolation
SELECT COUNT(*) FROM contacts WHERE workspace_id = 'workspace1';
SELECT COUNT(*) FROM contacts WHERE workspace_id = 'workspace2';
-- Counts should be independent

-- Test cascading deletes
-- Create test data, delete parent, verify children are cleaned up
```

#### Data Consistency Testing
```javascript
// Test that related data is properly handled
// 1. Create a contact with emails, phones, addresses
// 2. Update the contact
// 3. Verify related data is preserved
// 4. Delete the contact
// 5. Verify related data is cleaned up
```

## 3. Performance Testing

### 3.1 Response Time Testing

#### Baseline Measurement
```bash
# Measure response times for each endpoint
for endpoint in workspaces contacts businesses; do
  echo "Testing $endpoint..."
  curl -w "@curl-format.txt" -o /dev/null -s \
    -H "Authorization: Bearer $TOKEN" \
    "http://localhost:5173/api/$endpoint?workspace_id=$WORKSPACE_ID"
done

# curl-format.txt content:
#      time_namelookup:  %{time_namelookup}\n
#         time_connect:  %{time_connect}\n
#      time_appconnect:  %{time_appconnect}\n
#     time_pretransfer:  %{time_pretransfer}\n
#        time_redirect:  %{time_redirect}\n
#   time_starttransfer:  %{time_starttransfer}\n
#                      ----------\n
#           time_total:  %{time_total}\n
```

#### Load Testing with Artillery
```yaml
# artillery-test.yml
config:
  target: 'http://localhost:5173'
  phases:
    - duration: 60
      arrivalRate: 10
  variables:
    token: 'YOUR_JWT_TOKEN'
    workspaceId: 'YOUR_WORKSPACE_ID'

scenarios:
  - name: "API Load Test"
    weight: 100
    requests:
      - get:
          url: "/api/workspaces"
          headers:
            Authorization: "Bearer {{ token }}"
      - get:
          url: "/api/contacts?workspace_id={{ workspaceId }}"
          headers:
            Authorization: "Bearer {{ token }}"
      - get:
          url: "/api/businesses?workspace_id={{ workspaceId }}"
          headers:
            Authorization: "Bearer {{ token }}"
```

Run with: `artillery run artillery-test.yml`

### 3.2 Concurrency Testing

#### Parallel Request Testing
```bash
#!/bin/bash
# Test concurrent requests to same endpoint

for i in {1..10}; do
  curl -X GET "http://localhost:5173/api/contacts?workspace_id=$WORKSPACE_ID" \
    -H "Authorization: Bearer $TOKEN" &
done

wait
echo "All requests completed"
```

#### Database Connection Pool Testing
Monitor database connections during high load:

```sql
-- PostgreSQL
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Monitor for connection leaks
SELECT pid, usename, application_name, client_addr, state, query_start
FROM pg_stat_activity 
WHERE state != 'idle';
```

## 4. Error Handling Testing

### 4.1 HTTP Status Code Testing

#### Expected Error Responses
```bash
# Test 404 errors
curl -X GET http://localhost:5173/api/contacts/nonexistent-id?workspace_id=WORKSPACE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Expected: 404 Not Found

# Test 403 errors (workspace access)
curl -X GET http://localhost:5173/api/contacts?workspace_id=UNAUTHORIZED_WORKSPACE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Expected: 403 Forbidden

# Test 400 errors (validation)
curl -X POST http://localhost:5173/api/contacts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"invalidField": "value"}'
# Expected: 400 Bad Request

# Test 500 errors (simulate database error)
# This would require temporarily breaking database connection
```

### 4.2 Error Message Consistency

Verify error response format:
```json
{
  "message": "Descriptive error message",
  "error": "Error type",
  "details": {} // Optional additional details
}
```

## 5. Security Testing

### 5.1 Authentication Bypass Testing
```bash
# Attempt to bypass JWT middleware
curl -X GET http://localhost:5173/api/contacts?workspace_id=WORKSPACE_ID

# Test malformed JWT tokens
curl -X GET http://localhost:5173/api/contacts?workspace_id=WORKSPACE_ID \
  -H "Authorization: Bearer malformed.jwt.token"

# Test SQL injection in search parameters
curl -X GET "http://localhost:5173/api/contacts?workspace_id=WORKSPACE_ID&search='; DROP TABLE contacts; --" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5.2 Authorization Testing
```bash
# Test accessing resources from different workspaces
# User in workspace A trying to access workspace B data
curl -X GET http://localhost:5173/api/contacts?workspace_id=WORKSPACE_B_ID \
  -H "Authorization: Bearer WORKSPACE_A_USER_TOKEN"
# Expected: 403 Forbidden
```

## 6. Testing Automation

### 6.1 Jest Test Suite

```javascript
// tests/api/workspaces.test.js
describe('Workspaces API', () => {
  let authToken;
  let testWorkspaceId;

  beforeAll(async () => {
    // Setup: Get auth token
    authToken = await getTestAuthToken();
  });

  afterAll(async () => {
    // Cleanup: Remove test data
    if (testWorkspaceId) {
      await deleteTestWorkspace(testWorkspaceId);
    }
  });

  describe('GET /api/workspaces', () => {
    test('should return user workspaces', async () => {
      const response = await request(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('workspaces');
      expect(response.body).toHaveProperty('isGlobalSuperAdmin');
      expect(Array.isArray(response.body.workspaces)).toBe(true);
    });

    test('should require authentication', async () => {
      await request(app)
        .get('/api/workspaces')
        .expect(401);
    });
  });

  describe('POST /api/workspaces', () => {
    test('should create new workspace', async () => {
      const workspaceData = { name: 'Test Workspace' };
      
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workspaceData)
        .expect(201);

      expect(response.body).toHaveProperty('workspace');
      expect(response.body.workspace.name).toBe('Test Workspace');
      
      testWorkspaceId = response.body.workspace.id;
    });

    test('should validate required fields', async () => {
      await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });
});
```

### 6.2 Continuous Integration Testing

```yaml
# .github/workflows/api-tests.yml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run database migrations
      run: npm run db:migrate
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        
    - name: Run API tests
      run: npm run test:api
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        JWT_SECRET: test_secret
        
    - name: Run integration tests
      run: npm run test:integration
      
    - name: Run performance tests
      run: npm run test:performance
```

## 7. Monitoring and Alerting

### 7.1 Production Monitoring

```javascript
// Add monitoring to Hono app
app.use('*', async (c, next) => {
  const start = Date.now();
  
  await next();
  
  const duration = Date.now() - start;
  const method = c.req.method;
  const path = c.req.path;
  const status = c.res.status;
  
  console.log(`${method} ${path} ${status} ${duration}ms`);
  
  // Send to monitoring service
  if (duration > 1000) {
    console.warn(`Slow request: ${method} ${path} took ${duration}ms`);
  }
});
```

### 7.2 Error Rate Monitoring

```javascript
// Track error rates
let errorCount = 0;
let requestCount = 0;

app.onError((err, c) => {
  errorCount++;
  console.error('API Error:', err);
  
  // Alert if error rate > 5%
  if (requestCount > 100 && (errorCount / requestCount) > 0.05) {
    console.error('HIGH ERROR RATE DETECTED');
    // Send alert to monitoring service
  }
  
  return c.json({ error: 'Internal Server Error' }, 500);
});
```

## 8. Testing Checklist

### Pre-Migration Baseline
- [ ] Document all existing endpoint response times
- [ ] Record all endpoint response formats
- [ ] Test all authentication flows
- [ ] Verify all CRUD operations work
- [ ] Test search and pagination functionality
- [ ] Document any existing bugs or limitations

### Post-Migration Validation
- [ ] All endpoints return correct HTTP status codes
- [ ] Response times are equal or better than baseline
- [ ] Response formats exactly match baseline
- [ ] Authentication flows work identically
- [ ] All CRUD operations function correctly
- [ ] Search and pagination work as expected
- [ ] Error handling matches baseline behavior

### Frontend Integration
- [ ] All existing frontend code works without changes
- [ ] Forms submit successfully
- [ ] Data displays correctly in UI components
- [ ] Error handling in frontend still works
- [ ] User workflows complete successfully

### Performance Validation
- [ ] Response times under normal load
- [ ] Response times under high load
- [ ] Memory usage is stable
- [ ] Database connection pool is healthy
- [ ] No memory leaks detected

### Security Validation
- [ ] Authentication cannot be bypassed
- [ ] Authorization rules are enforced
- [ ] Input validation prevents injection attacks
- [ ] Sensitive data is not exposed in errors
- [ ] CORS policies are correctly applied

This comprehensive testing guide ensures that the migration maintains all existing functionality while improving performance and maintainability.