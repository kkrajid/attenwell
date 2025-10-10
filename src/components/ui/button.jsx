import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hover)] hover:scale-105",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hover)] hover:scale-105",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        meditation: "bg-meditation text-meditation-foreground shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hover)] hover:scale-105",
        "focus-study": "bg-focus-study text-focus-study-foreground shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hover)] hover:scale-105",
        "focus-play": "bg-focus-play text-focus-play-foreground shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hover)] hover:scale-105",
        game: "bg-game text-game-foreground shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hover)] hover:scale-105",
        parent: "bg-parent text-parent-foreground shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hover)] hover:scale-105",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 rounded-md px-3",
        lg: "h-14 rounded-[var(--radius)] px-8 text-base",
        xl: "h-16 rounded-[var(--radius)] px-10 text-lg",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };