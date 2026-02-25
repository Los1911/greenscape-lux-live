import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
        "placeholder:text-muted-foreground/60",
        // Focus states - GreenScape Lux branded emerald glow with dark offset
        "focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-emerald-400/60",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        "focus-visible:border-primary/50",
        // States
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Transitions & touch optimization
        "transition-colors resize-none",
        "[-webkit-tap-highlight-color:transparent]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
