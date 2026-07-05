# Shuleyetu Deployment Guide

**✅ Production URL**: <https://shuleyetu-web.vercel.app>

**Status**: Live and Production Ready on Vercel (Free Tier)

---

## Production Deployment Status

- **Platform**: Vercel
- **URL**: <https://shuleyetu-web.vercel.app>
- **Status**: ✅ Live
- **Build**: ✅ Passing
- **Database**: Supabase (PostgreSQL)
- **CI/CD**: GitHub Actions
- **Deployment**: Automatic on push to main branch

---

## Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account
- Sentry account (for error tracking)
- ClickPesa API credentials
- Africa's Talking API credentials
- GitHub account with repository access

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/kadioko/Shuleyetu.git
cd Shuleyetu/shuleyetu-web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create `.env.local` file with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Sentry
SENTRY_DSN=https://your-key@sentry.io/your-project
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-token

# ClickPesa
CLICKPESA_BASE_URL=https://api.clickpesa.com
CLICKPESA_CLIENT_ID=your-client-id
CLICKPESA_API_KEY=your-api-key
CLICKPESA_WEBHOOK_SECRET=your-webhook-secret

# Africa's Talking
AFRICAS_TALKING_API_KEY=your-api-key
AFRICAS_TALKING_USERNAME=your-username

# CSRF
CSRF_SECRET=your-csrf-secret-key

# App
APP_VERSION=1.0.0
NODE_ENV=production
```

## Local Development

### Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# E2E tests in debug mode
npm run test:e2e:debug
```

### Linting

```bash
npm run lint
```

## Production Build

### Build Application

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

## Deployment to Vercel

### 1. Connect Repository

```bash
vercel link
```

### 2. Configure Environment Variables

Add all `.env.local` variables to Vercel project settings.

### 3. Deploy

```bash
vercel --prod
```

Or push to main branch for automatic deployment.

## Deployment to Other Platforms

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=.next
```

### Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY .next ./.next
COPY public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t shuleyetu .
docker run -p 3000:3000 -e NODE_ENV=production shuleyetu
```

## Database Migrations

The project uses Supabase SQL migrations in `supabase/migrations/`.

### Prerequisites

- Install the Supabase CLI: `npm install -g supabase@latest`
- Set your Supabase access token (PAT):
  ```powershell
  $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
  ```

### Link and Apply Migrations

```bash
# Link the project once
supabase link --project-ref rqlolaoqstvnffkaqmpt

# Check migration status
supabase migration list

# Apply pending migrations
supabase db push

# Apply a single SQL file manually
supabase db query -f supabase/migrations/<filename>.sql --linked
```

### Important Notes

- Migration files must be named `YYYYMMDD_name.sql`. Files without a timestamp (e.g. `add_indexes.sql`) are ignored by the CLI until renamed.
- Do not use duplicate timestamps for different migration files. Each timestamp must be unique in `supabase_migrations.schema_migrations`.
- The `seed_demo_data.sql` migration is **not applied to production** because the live database already contains real vendor, inventory, and order data.
- A reconciliation migration (`20260706_reconcile_remote.sql`) was applied to align the production schema with the full codebase (missing `order_items`, `user_roles`, `vendor_users`, `order_messages`, `vendor_reviews`, `contact_messages`, storage buckets, `public_access_token`, `image_url`, and school portal tables).

### Rollback Migrations

```bash
supabase migration down
```

## Health Checks

### Verify Deployment

```bash
curl https://shuleyetu-web.vercel.app/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-21T12:00:00Z",
  "uptime": 3600,
  "responseTime": "45ms",
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": "ok",
    "api": "ok"
  }
}
```

### Check Status Page

Visit `https://shuleyetu-web.vercel.app/status` for real-time service status.

## Monitoring

### Sentry

- Monitor errors at <https://sentry.io>
- Set up alerts for critical errors
- Configure Slack integration for notifications

### Application Logs

```bash
# View logs in production
vercel logs --prod

# Or with Netlify
netlify logs:functions
```

## Troubleshooting

### Build Fails

1. Check Node version: `node --version` (should be 18+)
2. Clear cache: `rm -rf .next node_modules && npm install`
3. Check environment variables are set correctly
4. Review build logs for specific errors

### Database Connection Issues

1. Verify Supabase credentials
2. Check network connectivity
3. Ensure RLS policies are configured
4. Test connection: `npm run test`

### Performance Issues

1. Check database query performance
2. Review Sentry for errors
3. Monitor API response times
4. Check rate limiting status

### Rate Limiting Errors

If getting 429 errors:

1. Check rate limit configuration in `src/middleware/rateLimit.ts`
2. Verify IP forwarding headers are correct
3. Adjust limits based on traffic patterns

## Rollback Procedure

### Rollback to Previous Version

```bash
# Using Vercel
vercel rollback

# Using Git
git revert <commit-hash>
git push origin main
```

### Rollback Database

```bash
supabase migration down
```

## Post-Deployment Checklist

- [ ] Health check endpoint responds correctly
- [ ] Status page displays accurate information
- [ ] Sentry is capturing errors
- [ ] Rate limiting is working
- [ ] CSRF protection is enabled
- [ ] Database indexes are created
- [ ] Environment variables are set
- [ ] SSL certificate is valid
- [ ] Monitoring alerts are configured
- [ ] Backup strategy is in place

## Support

For deployment issues:

- Check logs: `vercel logs --prod`
- Review Sentry dashboard
- Check status page: `/status`
- Contact: `devops@shuleyetu.com`
