import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded-full border border-white/30",
      // Focus states - GreenScape Lux branded emerald glow with dark offset
      "focus-visible:outline-none",
      "focus-visible:ring-2 focus-visible:ring-emerald-400/60",
      "focus-visible:ring-offset-2 focus-visible:ring-offset-black",
      // Checked state - green brand
      "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-400",
      // States
      "disabled:cursor-not-allowed disabled:opacity-50",
      // Transitions & touch optimization
      "transition-all duration-200",
      "[-webkit-tap-highlight-color:transparent]",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Circle className="h-2 w-2 fill-white text-white transition-transform duration-200" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }

