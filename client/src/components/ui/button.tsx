import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(135deg,#1e3a8a_0%,#3b2fad_35%,#6d28d9_70%,#7c3aed_100%)] hover:bg-[linear-gradient(135deg,#2563eb_0%,#4f46e5_35%,#7c3aed_70%,#9333ea_100%)] hover:shadow-xl hover:shadow-[#4f46e5]/35 hover:brightness-105 text-white shadow-lg shadow-[#1e3a8a]/30 active:scale-95 transition-all font-extrabold",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:shadow-lg active:shadow-sm border-destructive-border",
        outline:
          "border [border-color:var(--button-outline)] shadow-md hover:shadow-lg active:shadow-sm",
        secondary:
          "border bg-secondary text-secondary-foreground border-secondary-border shadow-md hover:shadow-lg active:shadow-sm",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-9 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 text-xs",
        lg: "min-h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
