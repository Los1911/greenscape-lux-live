import * as React from "react"

import { cn } from "@/lib/utils"

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // CRITICAL FIX: Cross-platform consistent input text alignment
          // 
          // Height & Display:
          // - Explicit height (h-12) for consistent sizing across devices
          // - Flexbox display ensures proper internal alignment
          "flex h-12 w-full",
          
          // Border & Shape:
          // - Rounded corners with consistent border
          "rounded-full border border-border/60 bg-background",
          
          // VERTICAL TEXT CENTERING FIX:
          // - Explicit line-height matching the computed inner height
          // - For h-12 (48px) with border (2px total), inner = 46px
          // - Using leading-[46px] ensures single-line text is perfectly centered
          // - Combined with py-0 to prevent padding interference
          "leading-[46px] py-0",
          
          // Horizontal padding only (vertical handled by line-height):
          "px-4",
          
          // Typography:
          // - Consistent font size across breakpoints
          // - text-base (16px) prevents iOS zoom on focus
          "text-base",
          
          // File input styling:
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:leading-[46px]",
          
          // Placeholder styling:
          "placeholder:text-muted-foreground placeholder:leading-[46px]",
          
          // Focus states - GreenScape Lux branded emerald glow with dark offset
          "focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-emerald-400/60",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          
          // Disabled state:
          "disabled:cursor-not-allowed disabled:opacity-50",
          
          // Transitions:
          "transition-all duration-200",
          
          // Mobile optimizations:
          // - touch-manipulation improves touch responsiveness
          // - Webkit appearance reset for iOS consistency
          // - Remove iOS tap highlight
          "touch-manipulation",
          "[-webkit-appearance:none] [appearance:none]",
          "[-webkit-tap-highlight-color:transparent]",
          // Remove iOS inner shadow
          "[-webkit-box-shadow:none] [box-shadow:none]",
          
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
