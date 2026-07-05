# Shuleyetu Test Accounts & Credentials

## Production URL
```
https://shuleyetu-web.vercel.app
```

---

## Test Accounts

### Customer Test Account
**Email**: `customer@test.com`
**Password**: TestPassword123!
**Role**: Customer/Parent
**Use Case**: Browse vendors, create orders, track orders

### Vendor Test Account
**Email**: `vendor@test.com`
**Password**: TestPassword123!
**Role**: Vendor
**Use Case**: Manage inventory, view orders, track sales

### Admin Test Account
**Email**: `admin@test.com`
**Password**: TestPassword123!
**Role**: Administrator
**Use Case**: Manage vendors, view analytics, system administration

### School Admin Test Account
**Email**: `admin@test.com` (or any authenticated account)
**Password**: TestPassword123!
**Role**: School Administrator (after creating a school)
**Use Case**: Create a school and manage classes, students, staff, attendance, fees, and announcements

---

## Test Data

### Sample Vendors
1. **Dar es Salaam Books**
   - Location: Dar es Salaam, Tanzania
   - Products: Textbooks, Stationery
   - Contact: `vendor1@test.com`

2. **Arusha School Supplies**
   - Location: Arusha, Tanzania
   - Products: Uniforms, Textbooks, Stationery
   - Contact: `vendor2@test.com`

3. **Mbeya Educational Center**
   - Location: Mbeya, Tanzania
   - Products: Stationery, Uniforms
   - Contact: `vendor3@test.com`

### Sample Products
- Textbooks (various subjects)
- School uniforms (different sizes)
- Stationery (pens, notebooks, rulers)
- School bags

---

## Testing Scenarios

### Scenario 1: Customer Journey
1. Sign in with customer account
2. Browse vendors
3. View vendor details and products
4. Create an order
5. Complete payment with test ClickPesa credentials
6. Track order status

### Scenario 2: Vendor Management
1. Sign in with vendor account
2. View dashboard
3. Add new products to inventory
4. View recent orders
5. Update order status
6. Check sales analytics

### Scenario 3: Admin Functions
1. Sign in with admin account
2. View all vendors
3. Manage vendor accounts
4. View system analytics
5. Check error tracking (Sentry)

### Scenario 4: School Portal Setup & Management
1. Sign in with an authenticated account (e.g., `admin@test.com`)
2. Visit `/schools/portal`
3. Create a school using the setup form (name, address, region, district, contact info)
4. Verify the dashboard loads with school stats
5. Add a class (`Classes` tab)
6. Add a student and assign to a class (`Students` tab)
7. Add a staff member (`Staff` tab)
8. Mark attendance for a class/date (`Attendance` tab)
9. Create a fee invoice (`Fees` tab)
10. Publish an announcement (`Announcements` tab)

---

## Payment Testing

### ClickPesa Test Credentials
- **Environment**: Sandbox (for testing)
- **Test Card**: Use any test card number
- **Amount**: Any amount for testing
- **Status**: Payments will be simulated

### Test Payment Numbers
- **Success**: 0712345678
- **Failure**: 0787654321
- **Pending**: 0799999999

---

## Language Testing

### Language Switching
- Click the language toggle button (🇹🇿 SW / 🇬🇧 EN) in the header
- **English (EN)**: Full English interface
- **Swahili (SW)**: Full Swahili interface
- Language preference is saved in browser localStorage

### Supported Languages
- English (en)
- Swahili (sw)

---

## Feature Testing Checklist

### Authentication
- [ ] Sign up as new customer
- [ ] Sign up as new vendor
- [ ] Sign in with existing account
- [ ] Password reset functionality
- [ ] Session management

### Vendor Features
- [ ] Browse vendor list
- [ ] View vendor details
- [ ] Search vendors by location
- [ ] Filter vendors by category
- [ ] View vendor products

### Order Management
- [ ] Create new order
- [ ] Add items to order
- [ ] View order summary
- [ ] Proceed to payment
- [ ] Track order status
- [ ] View order history

### Inventory Management (Vendor)
- [ ] Add new product
- [ ] Edit product details
- [ ] Update stock quantity
- [ ] Delete product
- [ ] View inventory list

### Dashboard
- [ ] View sales metrics
- [ ] Check pending orders
- [ ] View completed orders
- [ ] Track revenue
- [ ] View customer feedback

### School Portal
- [ ] Create a school on first visit
- [ ] View school dashboard stats
- [ ] Add and list classes
- [ ] Add and list students
- [ ] Add and list staff
- [ ] Mark attendance by class/date
- [ ] Create and view fees
- [ ] Publish and view announcements

### Payment
- [ ] Initiate payment
- [ ] Complete payment flow
- [ ] Verify payment status
- [ ] Handle payment errors
- [ ] Receive payment confirmation

### Notifications
- [ ] Order confirmation SMS
- [ ] Payment status update
- [ ] Order status change
- [ ] Low stock alert
- [ ] New order notification

### UI/UX
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark mode toggle
- [ ] Language switching
- [ ] Loading states
- [ ] Error messages
- [ ] Success messages

---

## API Testing

### Health Check
```bash
curl https://shuleyetu-web.vercel.app/api/health
```

### Status Page
```
https://shuleyetu-web.vercel.app/status
```

### Rate Limiting Test
```bash
# Should return 429 after exceeding rate limit
for i in {1..100}; do
  curl https://shuleyetu-web.vercel.app/api/health
done
```

---

## Browser DevTools Testing

### Console
- Check for any JavaScript errors
- Verify API responses
- Monitor network requests

### Network Tab
- Monitor API calls
- Check response times
- Verify HTTPS/TLS

### Application Tab
- Check localStorage for language preference
- Verify session storage
- Check cookies

### Performance Tab
- Monitor page load time
- Check Core Web Vitals
- Identify bottlenecks

---

## Mobile Testing

### iOS
- Test on iPhone (Safari)
- Check responsive design
- Test touch interactions
- Verify payment flow

### Android
- Test on Android (Chrome)
- Check responsive design
- Test touch interactions
- Verify payment flow

---

## Error Scenarios

### Network Errors
- Disconnect internet and test error handling
- Verify error messages are user-friendly
- Check error logging in Sentry

### Payment Errors
- Use test failure number for payment errors
- Verify error message display
- Check retry functionality

### Validation Errors
- Submit empty forms
- Enter invalid data
- Verify validation messages

### Server Errors
- Check 500 error handling
- Verify error page display
- Check error logging

---

## Performance Testing

### Page Load Time
- Home page: < 2s
- Vendors list: < 3s
- Vendor details: < 2s
- Dashboard: < 3s

### API Response Time
- Health check: < 50ms
- Vendor list: < 200ms
- Order creation: < 300ms
- Payment: < 500ms

### Bundle Size
- Main bundle: < 100KB
- CSS: < 50KB
- JavaScript: < 150KB

---

## Monitoring & Analytics

### Sentry Error Tracking
- Monitor error rates
- Check error frequency
- Review error details
- Set up alerts

### Uptime Monitoring
- Check service availability
- Monitor response times
- Verify SLA compliance

### Analytics
- Track user behavior
- Monitor conversion rates
- Check feature usage

---

## Support & Troubleshooting

### Common Issues

**Language not changing:**
- Clear browser cache
- Check localStorage in DevTools
- Verify LanguageProvider is wrapping app
- Check console for errors

**Payment not working:**
- Verify ClickPesa credentials
- Check test environment setting
- Verify payment endpoint is accessible
- Check error logs in Sentry

**Orders not appearing:**
- Verify Supabase connection
- Check database permissions
- Verify order creation endpoint
- Check error logs

**Authentication issues:**
- Clear cookies and localStorage
- Verify Supabase auth configuration
- Check session management
- Review auth logs

---

## Feedback & Bug Reporting

### Report Issues
- Email: `support@shuleyetu.com`
- GitHub Issues: <https://github.com/kadioko/Shuleyetu/issues>
- Sentry: Check error tracking dashboard

### Feature Requests
- Email: `product@shuleyetu.com`
- GitHub Discussions: <https://github.com/kadioko/Shuleyetu/discussions>

---

## Next Steps

1. **Create accounts** using the credentials above
2. **Test core features** using the checklist
3. **Report any issues** found
4. **Provide feedback** on UX/UI
5. **Test on mobile** devices
6. **Monitor performance** metrics

---

**Happy Testing! 🚀**
