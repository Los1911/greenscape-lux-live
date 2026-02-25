# Login Screen Alignment Fix - Cross-Platform

## Issue Summary
Alignment inconsistencies on the login screen across mobile and tablet devices:
1. **Login/Sign Up toggle pill** - Active and inactive tabs not perfectly aligned
2. **Input field text alignment** - Email/password input text sits slightly low within rounded inputs

## Root Causes Identified
1. **Tab Toggle Issues:**
   - Inconsistent padding between active/inactive states
   - Browser default button styling causing height variance
   - Missing explicit line-height causing text position drift

2. **Input Field Issues:**
   - Reliance on browser default input rendering
   - Inconsistent vertical padding across iOS/Android
   - iOS Safari inner shadow affecting visual alignment

## Files Modified

### 1. `src/components/ui/tabs.tsx`
**Changes:**
- Fixed `TabsList` height to `h-11` with explicit flexbox centering
- Fixed `TabsTrigger` with:
  - Explicit height `h-9` (identical for active/inactive)
  - Flexbox centering (`flex items-center justify-center`)
  - Explicit `leading-none` to prevent browser line-height variance
  - `flex-1` for equal width distribution
  - Only color/background changes between states (no size changes)
  - Added `touch-manipulation` and `-webkit-tap-highlight-color:transparent` for iOS

### 2. `src/components/ui/input.tsx`
**Changes:**
- Explicit height `h-12` (48px) for consistent sizing
- Line-height trick: `leading-[46px]` (48px - 2px border = 46px inner height)
- Zero vertical padding `py-0` (line-height handles centering)
- Horizontal padding only `px-4`
- Added `-webkit-appearance: none` to reset iOS defaults
- Removed iOS inner shadow with `-webkit-box-shadow: none`
- Font size `text-base` (16px) to prevent iOS zoom on focus

### 3. `src/styles/mobile-optimizations.css`
**New Section Added:** Cross-Platform Input & Tab Alignment Fixes
- Input type-specific resets for all text input types
- Tab/toggle button alignment fixes using Radix selectors
- iOS Safari specific fixes using `@supports (-webkit-touch-callout: none)`
- Android Chrome specific fixes
- Tablet breakpoint fixes (768px - 1024px)
- Portrait and landscape tablet orientation handling
- High DPI / Retina display border fixes

## Technical Details

### Tab Alignment Solution
```css
/* Key: Fixed height + flexbox centering + no padding changes between states */
.tab-trigger {
  height: 36px;           /* Fixed height */
  display: inline-flex;   /* Flexbox */
  align-items: center;    /* Vertical center */
  justify-content: center;/* Horizontal center */
  line-height: 1;         /* Prevent line-height variance */
}

/* Active state - ONLY visual changes, no size changes */
.tab-trigger[data-state="active"] {
  background: white;
  color: green;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}
```

### Input Alignment Solution
```css
/* Key: Line-height equals inner height for perfect centering */
input {
  height: 48px;           /* Explicit height */
  line-height: 46px;      /* Inner height (48px - 2px border) */
  padding: 0 16px;        /* Horizontal only */
  -webkit-appearance: none; /* Reset iOS defaults */
}
```

## Validation Checklist
- [ ] iOS Safari (iPhone)
- [ ] iOS Safari (iPad)
- [ ] Android Chrome (Phone)
- [ ] Android Chrome (Tablet)
- [ ] Tablet Portrait Mode
- [ ] Tablet Landscape Mode

## Expected Behavior After Fix
1. **Toggle tabs:** Active and inactive tabs have identical height and vertical alignment
2. **Input fields:** Text is vertically centered within the input field
3. **Cross-platform:** Consistent appearance across iOS Safari, Android Chrome, and tablet browsers

## Testing Instructions
1. Open `/portal-login` on mobile device
2. Verify Login/Sign Up tabs are perfectly aligned (same height, no vertical offset)
3. Tap into email/password fields
4. Verify text appears vertically centered (not low or high)
5. Test in both portrait and landscape orientations
6. Test on tablet devices in both orientations
