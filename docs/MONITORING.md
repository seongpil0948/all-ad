# Monitoring and Logging Guide

## Overview

This project uses OpenTelemetry (OTEL) for comprehensive monitoring and custom logging implementation to replace console.log with structured, traceable logs.

## Setup

### 1. Install Dependencies

```bash
npm install @vercel/otel @opentelemetry/sdk-logs @opentelemetry/api-logs @opentelemetry/instrumentation @opentelemetry/api @opentelemetry/exporter-trace-otlp-http @opentelemetry/sdk-trace-node @opentelemetry/resources @opentelemetry/semantic-conventions
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```bash
# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTEL_API_KEY=your_api_key
NEXT_OTEL_VERBOSE=1

# Logging
LOG_LEVEL=debug
```

### 3. Instrumentation

The project automatically initializes OpenTelemetry through `instrumentation.ts` in the root directory.

## Usage

### Basic Logging

Replace `console.log` with our structured logger:

```typescript
import log from '@/utils/logger'

// Instead of console.log
log.info('User logged in', { userId: '123', email: 'user@example.com' })

// Different log levels
log.trace('Detailed trace information')
log.debug('Debug information')
log.info('General information')
log.warn('Warning message')
log.error('Error occurred', new Error('Something went wrong'))
```

### Span-based Logging

For operations you want to trace:

```typescript
import log from '@/utils/logger'

// Automatically creates a span and logs start/end
const result = await log.span('database-query', async () => {
  return await db.query('SELECT * FROM users')
}, {
  module: 'UserService',
  operation: 'fetchUsers'
})
```

### HTTP Request Logging

```typescript
import log from '@/utils/logger'

// Log HTTP requests
log.http('GET', '/api/users', 200, 145, {
  userAgent: request.headers.get('user-agent'),
  ip: request.ip
})
```

### Database Query Logging

```typescript
import log from '@/utils/logger'

// Log database operations
log.db('SELECT', 'users', 125, {
  query: 'SELECT * FROM users WHERE active = true',
  rowCount: 42
})
```

### Performance Logging

```typescript
import log from '@/utils/logger'

// Log performance metrics
const startTime = Date.now()
// ... operation ...
const duration = Date.now() - startTime
log.perf('image-processing', duration)
```

## Log Context

Always include relevant context in your logs:

```typescript
log.info('Order processed', {
  orderId: '12345',
  userId: 'user-123',
  amount: 99.99,
  items: 3,
  paymentMethod: 'credit_card'
})
```

## Viewing Logs

### Development

In development mode, logs are output to the console with formatted timestamps and color coding.

### Production

In production:
- On Vercel: Logs are automatically captured and viewable in the Vercel dashboard
- Self-hosted: Configure `OTEL_EXPORTER_OTLP_ENDPOINT` to send traces to your collector

## OpenTelemetry Collectors

### Using Jaeger (Local Development)

1. Run Jaeger using Docker:

```bash
docker run -d --name jaeger \
  -e COLLECTOR_OTLP_ENABLED=true \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest
```

2. View traces at http://localhost:16686

### Using Other Collectors

Configure the `OTEL_EXPORTER_OTLP_ENDPOINT` to point to your collector:

- **Datadog**: `https://trace.agent.datadoghq.com/v0.4/traces`
- **New Relic**: `https://otlp.nr-data.net:4318/v1/traces`
- **Honeycomb**: `https://api.honeycomb.io/v1/traces`

## Best Practices

1. **Always include context**: Add relevant metadata to help with debugging
2. **Use appropriate log levels**: Don't use `error` for warnings
3. **Avoid logging sensitive data**: Never log passwords, API keys, or PII
4. **Use spans for async operations**: Wrap async operations in spans for better tracing
5. **Keep messages concise**: Use context object for details

## Integration with Ad Platforms

The logging system is integrated with the hexagonal architecture:

```typescript
// In adapters
log.info('Fetching campaigns from Google Ads', {
  module: 'GoogleAdsAdapter',
  customerId: this.customerId,
  accountId
})

// In services
log.span('AdService.fetchAllCampaigns', async () => {
  // Service logic with automatic tracing
})
```

## Troubleshooting

### Logs not appearing

1. Check `NODE_ENV` - some log levels are filtered in production
2. Verify `OTEL_EXPORTER_OTLP_ENDPOINT` is correct
3. Check `NEXT_OTEL_VERBOSE=1` for detailed OTEL logs

### Performance issues

1. Adjust batch processor settings in `trace-logs-exporter.ts`
2. Reduce log verbosity in production
3. Use sampling for high-traffic endpoints

### Missing traces

1. Ensure `instrumentation.ts` is in the root directory
2. Check that all async operations properly await
3. Verify span names don't contain sensitive data
