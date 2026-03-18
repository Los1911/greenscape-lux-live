import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card component
 *
 * SAFARI COMPOSITING FIX:
 * Changed `transition-all` to `transition-[box-shadow,border-color]`.
 *
 * WHY: `transition-all` (= `transition-property: all`) tells the browser that
 * ANY CSS property might animate, including `opacity` and `transform`. Safari
 * preemptively promotes elements with `transition-all` to their own GPU
 * compositing layer to be ready for potential animations. This extra compositing
 * layer can cause z-index mis-ordering with sibling layers (like the
 * AnimatedBackground diagonal gradient) because Safari's compositor manages
 * GPU layers independently from the CSS paint-order/z-index system.
 *
 * By scoping the transition to only `box-shadow` and `border-color` (the only
 * properties that actually change on hover via `hover:shadow-lg`), Safari no
 * longer promotes the Card to a separate compositing layer, and the normal
 * CSS z-index stacking order is respected.
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-3xl border border-border/40 bg-card shadow-sm transition-[box-shadow,border-color] duration-200 hover:shadow-lg",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
