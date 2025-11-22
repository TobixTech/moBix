# Quick Fix for Remaining Deployment Issues

## Issue: Navbar useAuthModal Hook Error

The Navbar component is used in multiple pages, some with AuthModalWrapper and some without. This causes build errors when the hook is called outside the context.

### Solution Options

#### Option 1: Wrap All Pages (RECOMMENDED)
Wrap dashboard and profile pages with AuthModalWrapper.

#### Option 2: Make Hook Conditional
Modify Navbar to only call useAuthModal when showAuthButtons is true.

## Implementation

I recommend **Option 2** as it's cleaner and doesn't require wrapping pages that don't need auth modals.

### Changes Needed

1. Modify `components/navbar.tsx` to conditionally call `useAuthModal()`
2. Test all pages to ensure no build errors

### Expected Result
- All pages build successfully
- Auth modal works on homepage
- No context errors on other pages
