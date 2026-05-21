import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-white border border-[#C9A84C] rounded-full text-[#A07830] hover:bg-[#FDF6E8] hover:shadow-[0_0_0_3px_rgba(201,168,76,0.15)] active:scale-[0.97] [&_svg]:text-[#C9A84C]",
        destructive:
          "bg-white border border-red-400 rounded-full text-red-600 hover:bg-red-50 active:scale-[0.97]",
        outline:
          "bg-white border border-[#C9A84C] rounded-full text-[#A07830] hover:bg-[#FDF6E8] hover:shadow-[0_0_0_3px_rgba(201,168,76,0.15)] active:scale-[0.97] [&_svg]:text-[#C9A84C]",
        secondary:
          "bg-white border border-[#C9A84C] rounded-full text-[#A07830] hover:bg-[#FDF6E8] active:scale-[0.97] [&_svg]:text-[#C9A84C]",
        ghost:
          "bg-transparent border border-transparent rounded-full text-[#A07830] hover:bg-[#FDF6E8] hover:border-[#C9A84C] active:scale-[0.97] [&_svg]:text-[#C9A84C]",
        link: "text-[#A07830] underline-offset-4 hover:underline rounded-none",
        "outline-gold":
          "bg-white border border-[#C9A84C] rounded-full text-[#A07830] hover:bg-[#FDF6E8] hover:shadow-[0_0_0_3px_rgba(201,168,76,0.15)] active:scale-[0.97] [&_svg]:text-[#C9A84C]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }