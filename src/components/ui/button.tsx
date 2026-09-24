import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors duration-200 disabled:cursor-default disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pop",
  {
    variants: {
      variant: {
        primary: "bg-pop text-ink hover:bg-fg",
        quiet: "bg-surface text-fg ring-1 ring-line hover:bg-surface-2",
        ghost: "bg-transparent text-fg hover:bg-surface",
      },
      size: {
        md: "min-h-11 py-2.5",
        sm: "min-h-11 py-2 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>) {
  return <button type={type} className={cn(button({ variant, size }), className)} {...props} />;
}
