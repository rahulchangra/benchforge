import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "warning" | "error" | "outline";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-blue-500/20 text-blue-400": variant === "default",
          "bg-green-500/20 text-green-400": variant === "success",
          "bg-amber-500/20 text-amber-400": variant === "warning",
          "bg-red-500/20 text-red-400": variant === "error",
          "border border-neutral-700 text-neutral-400": variant === "outline",
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
