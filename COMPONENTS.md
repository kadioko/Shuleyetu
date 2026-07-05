# Component Documentation

This document describes all reusable UI components in the Shuleyetu application.

## Location

All components are located in `shuleyetu-web/src/components/ui/`

---

## Core Components

### Toast Notification System

**File**: `Toast.tsx`

A global notification system for displaying success, error, warning, and info messages.

#### Usage

```tsx
import { useToast } from '@/components/ui/Toast';

export function MyComponent() {
  const { addToast } = useToast();

  const handleSuccess = () => {
    addToast({
      type: 'success',
      title: 'Success!',
      message: 'Your order has been created.',
      duration: 5000, // optional, defaults to 5000ms
    });
  };

  return <button onClick={handleSuccess}>Create Order</button>;
}
```

#### Props

- `type`: `'success' | 'error' | 'warning' | 'info'`
- `title`: Display title (required)
- `message`: Optional detailed message
- `duration`: Auto-dismiss time in milliseconds (default: 5000)

#### Features

- Auto-dismiss with customizable duration
- Manual dismiss button
- Smooth slide-in animation
- Color-coded backgrounds and icons
- Positioned at bottom-right corner

---

### Skeleton Loaders

**File**: `SkeletonLoader.tsx`

Reusable skeleton components for loading states with smooth gradient animations.

#### Pre-configured Components

```tsx
import {
  SkeletonLoader,
  TextSkeleton,
  CircularSkeleton,
  CardSkeleton,
  TableRowSkeleton,
  VendorCardSkeleton,
} from '@/components/ui/SkeletonLoader';

// Generic skeleton with custom dimensions
<SkeletonLoader width="100%" height="20px" />

// Text skeleton (multiple lines)
<TextSkeleton lines={3} />

// Circular skeleton for avatars
<CircularSkeleton size="lg" />

// Card skeleton for content blocks
<CardSkeleton height="200px" />

// Table row skeleton
<TableRowSkeleton />

// Pre-configured vendor card skeleton
<VendorCardSkeleton />
```

#### Features

- Smooth gradient animation
- Multiple variants for different UI patterns
- Customizable width and height
- Responsive design

---

### Progress Steps

**File**: `ProgressSteps.tsx`

Visual progress indicator for multi-step forms.

#### Usage

```tsx
import { ProgressSteps } from '@/components/ui/ProgressSteps';

const steps = [
  { title: 'Vendor', description: 'Choose a vendor' },
  { title: 'Items', description: 'Select items' },
  { title: 'Info', description: 'Customer details' },
  { title: 'Review', description: 'Confirm order' },
];

<ProgressSteps
  steps={steps}
  currentStep={2}
  onStepClick={(step) => console.log('Clicked step:', step)}
/>
```

#### Props

- `steps`: Array of `{ title: string; description: string }`
- `currentStep`: Current step number (1-indexed)
- `onStepClick`: Optional callback when step is clicked

#### Features

- Visual step circles with numbers
- Connector lines between steps
- Status indicators (pending, active, completed)
- Clickable steps for navigation

---

### Form Field with Real-time Validation

**File**: `FormField.tsx`

Advanced form field component with real-time validation and visual feedback.

#### Usage

```tsx
import { FormField, ValidationRules } from '@/components/ui/FormField';

<FormField
  label="Email"
  name="email"
  type="email"
  value={email}
  onChange={setEmail}
  validation={ValidationRules.email}
  placeholder="your@email.com"
  required
/>

<FormField
  label="Phone"
  name="phone"
  type="tel"
  value={phone}
  onChange={setPhone}
  validation={ValidationRules.tanzanianPhone}
  required
/>

<FormField
  label="Description"
  name="description"
  type="textarea"
  value={description}
  onChange={setDescription}
  validation={{ maxLength: 500 }}
  helperText="Max 500 characters"
/>
```

#### Props

- `label`: Field label (required)
- `name`: Input name attribute (required)
- `type`: `'text' | 'email' | 'tel' | 'number' | 'password' | 'textarea'`
- `value`: Current value
- `onChange`: Change handler
- `onBlur`: Blur handler
- `validation`: Validation rules object
- `required`: Mark as required
- `placeholder`: Placeholder text
- `helperText`: Helper text below field
- `showValidationIcon`: Show validation status icon (default: true)

#### Validation Rules

Pre-configured rules available:

```tsx
ValidationRules.required        // { required: true }
ValidationRules.email          // { required: true, email: true }
ValidationRules.phone          // { required: true, phone: true }
ValidationRules.name           // { required: true, minLength: 2, maxLength: 50 }
ValidationRules.password       // { required: true, minLength: 8 }
ValidationRules.optionalEmail  // { email: true }
ValidationRules.optionalPhone  // { phone: true }
ValidationRules.tanzanianPhone // Tanzanian-specific validation
```

#### Custom Validation

```tsx
<FormField
  label="Username"
  name="username"
  validation={{
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
    custom: (value) => {
      if (value === 'admin') return 'Username not available';
      return null;
    },
  }}
/>
```

#### Features

- Real-time validation as user types
- Blur validation for final check
- Color-coded borders (error, success)
- Validation icons and messages
- Helper text support
- Loading spinner during async validation

---

### Empty States

**File**: `EmptyState.tsx`

Flexible empty state component with helpful CTAs.

#### Usage

```tsx
import { EmptyState, EmptyOrders, EmptyInventory } from '@/components/ui/EmptyState';

// Generic empty state
<EmptyState
  title="No results found"
  description="Try adjusting your search criteria"
  icon={<SearchIcon />}
  action={{
    label: 'Clear Filters',
    href: '/vendors',
    variant: 'primary',
  }}
  secondaryAction={{
    label: 'Browse All',
    href: '/vendors',
  }}
/>

// Pre-configured empty states
<EmptyOrders />
<EmptyInventory />
<EmptyVendors />
<EmptySearch />
<EmptyDashboard />
<EmptyOrdersList />
<EmptyNotifications />
```

#### Props

- `title`: Empty state title (required)
- `description`: Descriptive text (required)
- `icon`: Optional icon component
- `action`: Primary action button
  - `label`: Button text
  - `href`: Navigation link
  - `variant`: `'primary' | 'secondary'`
- `secondaryAction`: Secondary action link

#### Features

- Customizable icons
- Multiple action buttons
- Responsive design
- Consistent styling with app theme

---

### Charts

**File**: `Chart.tsx`

Data visualization components for analytics.

#### Components

#### StatCard

```tsx
import { StatCard } from '@/components/ui/Chart';

<StatCard
  title="Total Sales"
  value="450,000 TZS"
  change={12.5}
  icon={<DollarIcon />}
/>
```

Props:
- `title`: Card title
- `value`: Main value to display
- `change`: Optional percentage change
- `icon`: Optional icon component

#### LineChart

```tsx
import { LineChart } from '@/components/ui/Chart';

<LineChart
  data={[
    { label: 'Jan', value: 45000 },
    { label: 'Feb', value: 52000 },
    { label: 'Mar', value: 48000 },
  ]}
  width={350}
  height={200}
/>
```

Props:
- `data`: Array of `{ label: string; value: number }`
- `width`: Chart width in pixels
- `height`: Chart height in pixels

#### PieChart

```tsx
import { PieChart } from '@/components/ui/Chart';

<PieChart
  data={[
    { label: 'Paid', value: 45 },
    { label: 'Pending', value: 30 },
    { label: 'Completed', value: 25 },
  ]}
  width={200}
  height={200}
/>
```

Props:
- `data`: Array of `{ label: string; value: number }`
- `width`: Chart width in pixels
- `height`: Chart height in pixels

#### BarChart

```tsx
import { BarChart } from '@/components/ui/Chart';

<BarChart
  data={[
    { label: 'Q1', value: 120000 },
    { label: 'Q2', value: 150000 },
    { label: 'Q3', value: 130000 },
  ]}
  width={350}
  height={200}
/>
```

Props:
- `data`: Array of `{ label: string; value: number }`
- `width`: Chart width in pixels
- `height`: Chart height in pixels

#### Features

- SVG-based rendering (no external charting library)
- Responsive design
- Color-coded data
- Grid lines and axis labels
- Smooth animations

---

## Layout Components

### ScrollToTop

**File**: `ScrollToTop.tsx`

Smooth scroll-to-top button for long pages.

#### Usage

```tsx
import { ScrollToTop } from '@/components/ui/ScrollToTop';

export default function Layout() {
  return (
    <>
      <main>{/* page content */}</main>
      <ScrollToTop />
    </>
  );
}
```

#### Features

- Appears after scrolling down
- Smooth scroll animation
- Positioned at bottom-right
- Keyboard accessible

---

## Usage Patterns

### Form with Validation

```tsx
import { FormField, ValidationRules } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';

export function CreateItemForm() {
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Submit form
      addToast({
        type: 'success',
        title: 'Item created',
        message: 'Your item has been saved.',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error.message,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormField
        label="Item Name"
        name="name"
        value={name}
        onChange={setName}
        validation={ValidationRules.name}
        required
      />
      
      <FormField
        label="Price (TZS)"
        name="price"
        type="number"
        value={price}
        onChange={setPrice}
        validation={{ required: true, min: 0 }}
        required
      />
      
      <button type="submit">Create Item</button>
    </form>
  );
}
```

### Multi-step Form

```tsx
import { ProgressSteps } from '@/components/ui/ProgressSteps';
import { FormField } from '@/components/ui/FormField';

export function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});

  const steps = [
    { title: 'Step 1', description: 'Basic Info' },
    { title: 'Step 2', description: 'Details' },
    { title: 'Step 3', description: 'Review' },
  ];

  return (
    <>
      <ProgressSteps steps={steps} currentStep={step} />
      
      {step === 1 && (
        <FormField
          label="Name"
          name="name"
          value={formData.name || ''}
          onChange={(value) => setFormData({ ...formData, name: value })}
        />
      )}
      
      {step === 2 && (
        <FormField
          label="Email"
          name="email"
          type="email"
          value={formData.email || ''}
          onChange={(value) => setFormData({ ...formData, email: value })}
        />
      )}
      
      <button onClick={() => setStep(step + 1)}>Next</button>
    </>
  );
}
```

---

## Styling

All components use Tailwind CSS with the following color scheme:

- **Primary**: Sky blue (`sky-500`, `sky-400`)
- **Success**: Emerald green (`emerald-500`, `emerald-400`)
- **Error**: Red (`red-500`, `red-400`)
- **Warning**: Amber (`amber-500`, `amber-400`)
- **Background**: Slate (`slate-950`, `slate-900`, `slate-800`)
- **Text**: Slate (`slate-50`, `slate-100`, `slate-300`, `slate-400`)

---

## Best Practices

1. **Always use `useToast` for feedback** - Don't use `alert()` or `console.log()`
2. **Use FormField for all inputs** - Provides consistent validation and styling
3. **Show skeleton loaders while fetching** - Better perceived performance
4. **Use empty states** - Guide users when there's no data
5. **Validate on blur and change** - Real-time feedback without being intrusive
6. **Use pre-configured validation rules** - Consistency across forms
7. **Keep forms simple** - Use multi-step forms for complex flows
8. **Test on mobile** - All components are responsive

---

## Accessibility

All components follow WCAG 2.1 guidelines:

- Proper semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance
- Focus indicators
- Screen reader friendly

---

## Performance

- Components use React.memo where appropriate
- Validation debounced to avoid excessive re-renders
- Charts use SVG for better performance
- Skeleton loaders use CSS animations (no JavaScript)
- Toast notifications are efficiently managed with context

---

## School Portal UI Composition

The school portal (`/schools/portal`) is built from existing reusable components
and utility libraries. It is not a single reusable component; rather, it
composes the primitives above into tab-specific modules.

### Page Structure

- **File**: `src/app/schools/portal/page.tsx`
- **Layout**: `src/app/schools/portal/layout.tsx` with `SchoolProvider` context
- **Context**: `src/app/schools/portal/SchoolContext.tsx` (loads the current
  school and role)
- **API client**: `src/lib/schoolPortal.ts`

### Tabs / Modules

- **Dashboard**: `StatCard`, `Badge`, `Loading`, `EmptyState`
- **Classes**: forms with `Input`, `SubmitButton`, tables
- **Students**: forms with `Input`, `Select`, tables, class filter
- **Staff**: forms with `Input`, `Select`, tables
- **Attendance**: `Select`, date `input`, `Badge` for status
- **Fees**: `Input`, date `input`, `Badge` for status
- **Announcements**: text `Input`, textarea `Input`, audience `Select`

### Common Components Used

- `StatCard` from `@/components/ui/Chart` for dashboard metrics
- `Badge` from `@/components/ui/Badge` for status labels
- `EmptyState` and `Loading` for empty/loading states
- `useToast` from `@/components/ui/Toast` for success/error feedback

---

## Future Enhancements

- [ ] Add Storybook for component documentation
- [ ] Add more chart types (area, scatter, etc.)
- [ ] Add date picker component
- [ ] Add file upload component
- [ ] Add modal/dialog component
- [ ] Add dropdown/select component
- [ ] Add pagination component
- [ ] Add breadcrumb component
