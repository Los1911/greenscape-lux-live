import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Explicit height with flexbox centering for consistent alignment
      "inline-flex h-11 items-center justify-center rounded-lg bg-muted/50 p-1 text-muted-foreground gap-1",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // CRITICAL FIX: Consistent dimensions for active/inactive states
      // - Fixed height (h-9) ensures both states are identical height
      // - Flexbox centering (flex items-center justify-center) for perfect text alignment
      // - Explicit line-height (leading-none) prevents browser variance
      // - Symmetric horizontal padding (px-4) for consistent width feel
      // - Only color/background changes between states - no size/padding changes
      "inline-flex h-9 flex-1 items-center justify-center whitespace-nowrap rounded-md px-4 text-sm font-medium leading-none",
      // Transition
      "transition-all duration-200",
      // Focus states - GreenScape Lux branded emerald glow with dark offset
      "focus-visible:outline-none",
      "focus-visible:ring-2 focus-visible:ring-emerald-400/60",
      "focus-visible:ring-offset-2 focus-visible:ring-offset-black",
      "disabled:pointer-events-none disabled:opacity-50",
      // Inactive state styling
      "text-muted-foreground hover:text-foreground hover:bg-muted/30",
      // Active state - ONLY color/background changes, NO size changes
      "data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm",
      // Touch optimization for mobile - removes iOS tap highlight
      "touch-manipulation select-none",
      "[-webkit-tap-highlight-color:transparent]",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2",
      // Focus states - GreenScape Lux branded emerald glow with dark offset
      "focus-visible:outline-none",
      "focus-visible:ring-2 focus-visible:ring-emerald-400/60",
      "focus-visible:ring-offset-2 focus-visible:ring-offset-black",
      // Animation
      "animate-in fade-in-0 data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0 duration-200",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
