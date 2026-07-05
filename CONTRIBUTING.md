# Contributing to Shuleyetu

Thank you for your interest in contributing to Shuleyetu! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites
- **Node.js 18+** (LTS recommended)
- **Git**
- **A Supabase account** (for database)
- **ClickPesa sandbox account** (optional, for payment testing)

### Clone and Install

```bash
git clone https://github.com/kadioko/Shuleyetu.git
cd Shuleyetu/shuleyetu-web
npm install
```

### Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your credentials in `.env.local`:
   ```bash
   # Supabase (required)
   NEXT_PUBLIC_SUPABASE_URL="https://<your-project-ref>.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-public-key>"
   SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
   
   # ClickPesa (optional for payment testing)
   CLICKPESA_CLIENT_ID="<your-client-id>"
   CLICKPESA_API_KEY="<your-api-key>"
   CLICKPESA_ENV="sandbox"
   CLICKPESA_BASE_URL="https://api.clickpesa.com"
   CLICKPESA_WEBHOOK_SECRET="<your-webhook-secret>"
   ```

3. **Never commit `.env.local`** - it's already in `.gitignore`

### Database Setup

Use the Supabase CLI to link the project and apply migrations:

```bash
# Install/update the Supabase CLI
npm install -g supabase@latest

# Set the access token (PAT) and link the project
$env:SUPABASE_ACCESS_TOKEN = "sbp_..."
supabase link --project-ref rqlolaoqstvnffkaqmpt

# Apply pending migrations
supabase db push

# Or check status
supabase migration list
```

Key migrations in order:

1. `20251204_init_shuleyetu_marketplace.sql` - Core schema (vendors,
   inventory, orders, order_items)
2. `20251205_auth_rls_open_ordering.sql` - Auth tables, vendor_users, and
   RLS policies
3. `20251221_add_rls_policies.sql` - Admin RLS policies and user_roles
   table
4. `20251230_add_orders_public_access_token.sql` - Public order tracking
   token + helper RPCs
5. `20260111_create_storage_buckets.sql` - Storage buckets and policies
6. `20260616_add_inventory_image_url.sql` - Inventory image_url +
   order_messages + indexes + vendor_reviews
7. `20260618_contact_messages.sql` - Contact form submissions
8. `20260705_school_portal.sql` - School management schema
9. `20260706_reconcile_remote.sql` - Reconciles production schema with the
   codebase
10. `20260707_add_indexes.sql` - Additional performance indexes

**Note:** `seed_demo_data.sql` is not applied to production because the live
   database contains real data.

**To verify key objects were applied:**
```sql
-- Check for public_access_token column
SELECT column_name FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'public_access_token';

-- Check for RPC functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_user_id_by_email', 'get_user_emails_by_ids', 'is_school_user'
);

-- Check for school tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'school_%';
```

## Development Workflow

### Run the dev server
```bash
cd shuleyetu-web
npm run dev
```
Then open <http://localhost:3000>.

### Run tests
```bash
npm run test          # Run all tests (Vitest)
```

To run tests in watch mode, use `npx vitest` directly.

### Lint your code
```bash
npm run lint
```

### Build for production
```bash
npm run build
```

### Type checking
```bash
npx tsc --noEmit
```

## Project Structure

```
shuleyetu-web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/              # Admin panel
│   │   ├── api/                # API routes
│   │   │   ├── admin/          # Admin APIs (role-protected)
│   │   │   ├── clickpesa/      # Payment integration
│   │   │   ├── orders/         # Public order APIs
│   │   │   └── schools/        # School management APIs
│   │   ├── auth/               # Authentication pages
│   │   ├── dashboard/          # Vendor dashboard
│   │   ├── orders/             # Order pages (track, pay, etc.)
│   │   ├── schools/            # School portal
│   │   └── vendors/            # Vendor browsing
│   ├── components/             # Reusable React components
│   └── lib/                    # Shared utilities
│       ├── adminAuth.ts        # Admin authorization helpers
│       ├── apiUtils.ts         # API response utilities
│       ├── httpAuth.ts         # HTTP auth helpers
│       ├── logger.ts           # Structured logging
│       ├── orderTracking.ts    # Order tracking utilities
│       ├── publicOrderValidation.ts  # Order validation
│       ├── schoolAuth.ts       # School authorization helpers
│       ├── schoolPortal.ts     # School portal API client
│       ├── supabaseClient.ts   # Browser Supabase client
│       └── supabaseServer.ts   # Server Supabase client
├── supabase/migrations/        # Database migrations
└── tests/                      # Test files (*.test.ts)
```

## Code Style

### TypeScript
- Use explicit types, avoid `any`
- Prefer interfaces for object shapes
- Use type guards for runtime validation

### React
- Use functional components with hooks
- Keep components focused and small
- Extract reusable logic into custom hooks

### Styling
- Use Tailwind CSS utility classes
- Follow the existing dark theme color scheme
- Use semantic HTML elements

### API Routes
- Use shared utilities from `src/lib/apiUtils.ts` (`jsonOk`, `jsonError`, `readJsonBody`)
- Add structured logging with `src/lib/logger.ts`
- Validate inputs thoroughly
- Return consistent error responses

### Testing
- Write unit tests for business logic in `src/lib/`
- Test edge cases and error handling
- Use descriptive test names
- Keep tests focused and isolated

## Commit Guidelines

- Use clear, descriptive commit messages
- Start with a verb in present tense (e.g., "Add", "Fix", "Update")
- Reference issue numbers when applicable
- Keep commits focused on a single change

**Examples:**
```
Add public order tracking page
Fix webhook signature verification
Update admin panel with vendor user management
```

## Pull Request Process

1. **Fork** the repository
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the code style guidelines
4. **Run tests and linting**:
   ```bash
   npm run test
   npm run lint
   npm run build
   ```
5. **Commit your changes** with clear messages
6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request** with:
   - Clear description of changes
   - Screenshots (if UI changes)
   - Test results
   - Any breaking changes noted

## Security

### Critical Rules
- **Never commit secrets** (API keys, tokens, passwords)
- **Always use environment variables** for sensitive config
- **Report security vulnerabilities privately** to maintainers
- **Rotate keys immediately** if accidentally committed

### Security Checklist
- [ ] No hardcoded credentials in code
- [ ] `.env.local` is gitignored
- [ ] API routes validate inputs
- [ ] Admin routes check authorization
- [ ] School routes check `school_users` membership
- [ ] Public endpoints use token-based access
- [ ] Webhook signatures are verified

## Testing Guidelines

### What to Test
- Business logic in `src/lib/`
- Input validation functions
- Utility functions with edge cases
- API response formatting

### What Not to Test
- Third-party libraries
- Next.js framework code
- Supabase client methods

### Writing Tests
```typescript
import { describe, it, expect } from 'vitest';

describe('myFunction', () => {
  it('should handle valid input', () => {
    const result = myFunction('valid');
    expect(result).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe(null);
    expect(myFunction(null)).toBe(null);
  });
});
```

## Getting Help

- **Issues**: Open a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check the main README.md for project overview

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
