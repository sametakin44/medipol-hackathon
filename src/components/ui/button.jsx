import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        // Primary: amber tabanlı + hover'da soluk mor-mavi gradient ipucu + shadow.
        default:
          "bg-amber-500 text-black hover:bg-amber-400 active:bg-amber-600 hover:shadow-[0_4px_18px_-4px_rgba(245,158,11,0.55),0_0_24px_-6px_rgba(139,92,246,0.35)]",
        ghost:
          "bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white",
        outline:
          "border border-zinc-700 bg-transparent text-zinc-200 hover:bg-white/5 hover:border-zinc-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
