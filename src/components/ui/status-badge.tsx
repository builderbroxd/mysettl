import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors",
  {
    variants: {
      status: {
issued: "bg-[#d9edfd] text-[#14507f]",
        financed: "bg-[#ffe9b8] text-[#7a4d00]",
        paid: "bg-[#e6defe] text-[#4a2fc0]",
        cleared: "bg-[#d6f5c0] text-[#1c5a12]",
        pending: "bg-secondary text-muted-foreground",
        failed: "bg-[#ffe1d6] text-[#a3301a]",
        verified: "bg-[#d6f5c0] text-[#1c5a12]",
        expired: "bg-secondary text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "pending",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  dot?: boolean
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, status, dot = true, children, ...props }, ref) => {
    return (
      <div
        className={cn(statusBadgeVariants({ status, className }))}
        ref={ref}
        {...props}
      >
        {dot && (
          <span className="relative flex h-2 w-2">
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75",
                status === "issued" && "bg-[#14507f]",
                status === "financed" && "bg-[#b87400]",
                status === "paid" && "bg-[#4a2fc0]",
                status === "cleared" && "bg-[#1c5a12]",
                status === "pending" && "bg-muted-foreground",
                status === "failed" && "bg-[#a3301a]",
                status === "verified" && "bg-[#1c5a12]",
                status === "expired" && "bg-muted-foreground"
              )}
            />
            <span
              className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                status === "issued" && "bg-[#14507f]",
                status === "financed" && "bg-[#b87400]",
                status === "paid" && "bg-[#4a2fc0]",
                status === "cleared" && "bg-[#1c5a12]",
                status === "pending" && "bg-muted-foreground",
                status === "failed" && "bg-[#a3301a]",
                status === "verified" && "bg-[#1c5a12]",
                status === "expired" && "bg-muted-foreground"
              )}
            />
          </span>
        )}
        {children}
      </div>
    )
  }
)
StatusBadge.displayName = "StatusBadge"

export { StatusBadge, statusBadgeVariants }
