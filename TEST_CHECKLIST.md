# Test Checklist - Profile Completion & Payment Features

## Keyboard Navigation & Focus Visibility
- [ ] Tab through StandardizedButton components - focus ring should be visible
- [ ] Tab through PaymentMethodModal - all interactive elements accessible
- [ ] Tab through PaymentMethodManager - proper focus order
- [ ] Escape key closes modals properly
- [ ] Enter/Space activates buttons

## Toast Notifications & Error Persistence
- [ ] Success toast appears when payment method added
- [ ] Error toast appears for billing portal failures
- [ ] Error messages persist in PaymentMethodModal until dismissed
- [ ] Error messages in PaymentMethodManager stay visible until resolved
- [ ] Toast messages have proper contrast and are readable

## Profile Percentage Updates
- [ ] Profile completion percentage updates when payment method added
- [ ] UnifiedProfileTracker reflects changes immediately after payment setup
- [ ] Profile completion items show correct completion status
- [ ] Percentage calculation matches actual completed items (test with mock data)

## Payment Flow Integration
- [ ] "Add Payment Method" button opens PaymentMethodModal
- [ ] "Manage Payment Methods" opens billing portal (requires Stripe customer)
- [ ] Billing portal redirects back to dashboard correctly
- [ ] Profile completion refreshes after successful payment operations

## Loading & Disabled States
- [ ] StandardizedButton shows loading spinner when loading=true
- [ ] Buttons are disabled during async operations
- [ ] Loading states prevent multiple clicks
- [ ] Disabled buttons have proper opacity and cursor styles

## Dark Theme & Accessibility
- [ ] All components render correctly in dark theme
- [ ] StandardizedButton glow effects work in dark mode
- [ ] Focus rings are visible against dark backgrounds
- [ ] Error messages have sufficient contrast
- [ ] Screen readers can access all interactive elements

## Edge Cases
- [ ] Handle missing Stripe customer ID gracefully
- [ ] Handle network errors during billing portal creation
- [ ] Handle missing payment methods in profile completion
- [ ] Test with users who have no payment history