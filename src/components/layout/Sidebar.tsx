import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  Banknote,
  Vault,
  Award,
  ShieldCheck,
  Settings,
} from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"

const navigation = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  { name: "Invoices", href: "/app/invoices", icon: FileText },
  { name: "Financing", href: "/app/financing", icon: Banknote },
  { name: "Funding Pool", href: "/app/vault", icon: Vault },
  { name: "Reputation", href: "/app/reputation", icon: Award },
  { name: "Proofs", href: "/app/proofs", icon: ShieldCheck },
  // { name: "Activity", href: "/app/activity", icon: Activity }, // Hidden for now
  { name: "Settings", href: "/app/settings", icon: Settings },
]

interface SidebarContentProps {
  collapsed?: boolean
  onNavigate?: () => void
}

function SidebarContent({ collapsed = false, onNavigate }: SidebarContentProps) {
  const location = useLocation()

  return (
    <>
      {/* Logo */}
      <div className="flex h-20 items-center px-6">
        <Link to="/" className="flex items-center gap-2" onClick={() => onNavigate?.()}>
          <span className="text-2xl font-black tracking-tight text-[hsl(40_45%_94%)]">
            {collapsed ? "S" : "SETTL"}
            <span className="text-lime">.</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => onNavigate?.()}
              className={cn(
                "w-full flex items-center gap-3 rounded-full px-4 py-3 text-sm font-bold transition-colors duration-200",
                isActive
                  ? "bg-lime text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Network card */}
      {!collapsed && (
        <div className="m-3 rounded-3xl bg-white/[0.07] p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[hsl(40_45%_94%)]">
            <span className="h-2 w-2 rounded-full bg-lime" />
            QDay Aevum testnet
          </div>
          <p className="mt-1 text-xs text-sidebar-foreground/80">Mint sUSD in Settings. Gas comes from the faucet.</p>
          <a
            href="https://faucet.qday.info/en"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex h-8 items-center rounded-full bg-lime px-3 text-xs font-bold text-sidebar-accent-foreground transition hover:brightness-95"
          >
            Get gas (tQDAY)
          </a>
        </div>
      )}
    </>
  )
}

interface SidebarProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const isMobile = useIsMobile()

  // Mobile: Render as Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-[280px] p-0 bg-sidebar border-sidebar-border">
          <div className="flex h-full flex-col">
            <SidebarContent onNavigate={() => onOpenChange?.(false)} />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: Render as fixed sidebar
  return (
    <aside
      className={cn(
        "hidden md:flex fixed left-3 top-3 bottom-3 z-40 flex-col rounded-[28px] bg-sidebar transition-all duration-300",
        collapsed ? "w-[72px]" : "w-60"
      )}
    >
      <SidebarContent collapsed={collapsed} />
    </aside>
  )
}
