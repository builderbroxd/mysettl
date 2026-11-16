import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
  }
  variant?: "default" | "primary" | "success" | "warning"
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, title, value, subtitle, icon: Icon, trend, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-3xl border bg-card p-6 transition-transform duration-300 hover:-translate-y-1",
          variant === "primary" && "border-transparent bg-lime",
          variant === "success" && "border-transparent bg-lilac",
          variant === "warning" && "border-transparent bg-amber",
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={cn("text-sm font-medium", variant === "default" ? "text-muted-foreground" : "text-foreground/70")}>{title}</p>
            <p className="text-3xl font-bold tracking-tight number-display">{value}</p>
            {subtitle && (
              <p className={cn("text-sm", variant === "default" ? "text-muted-foreground" : "text-foreground/70")}>{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center text-xs font-medium",
                    trend.value >= 0 ? "text-success" : "text-destructive"
                  )}
                >
                  {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                "rounded-full p-3",
                variant === "default" ? "bg-secondary text-secondary-foreground" : "bg-white/60 text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </div>
    )
  }
)
StatCard.displayName = "StatCard"

export { StatCard }
