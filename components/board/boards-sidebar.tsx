"use client"

import { useState, createContext, useContext, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { 
  Home, 
  Bookmark, 
  ChevronLeft, 
  ChevronRight,
  X
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAnalytics } from "@/hooks/use-analytics"

interface SidebarContextType {
  isCollapsed: boolean
  toggleCollapse: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true) // Default collapsed
  const analytics = useAnalytics()
  
  const toggleCollapse = () => {
    analytics.toggleSidebar(!isCollapsed)
    setIsCollapsed(!isCollapsed)
  }
  
  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapse }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

interface BoardsSidebarProps {
  currentTab?: string
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export function BoardsSidebar({ 
  currentTab = "home", 
  isMobileOpen = false, 
  onMobileClose 
}: BoardsSidebarProps) {
  const { isCollapsed, toggleCollapse } = useSidebar()

  const navigationItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Saved",
      href: "/saved",
      icon: Bookmark,
    }
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header Spacer */}
 
      {/* Logo */}
      <div className="flex items-center justify-between p-3 border-b">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">N</span>
              </div>
              <span className="font-semibold text-lg">Nanographer</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className="h-8 w-8 p-0 hover:bg-muted/50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">N</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className="h-6 w-6 p-0 hover:bg-muted/50 transition-colors"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="p-3 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = currentTab === item.name.toLowerCase()
          
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-10 transition-all duration-200 hover:scale-[1.02] hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                  isCollapsed && "px-2",
                  isActive && "bg-primary/10 text-primary"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4", 
                  !isCollapsed && "mr-3",
                  isActive && "text-primary"
                )} />
                {!isCollapsed && (
                  <span className={cn(
                    "flex-1 text-left",
                    isActive && "text-primary font-medium"
                  )}>{item.name}</span>
                )}
              </Button>
            </Link>
          )
        })}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden md:block fixed left-0 top-0 h-screen z-30 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className="h-full bg-card border-r shadow-sm flex flex-col">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={cn(
        "md:hidden fixed inset-0 z-50 transition-all duration-300 ease-in-out",
        isMobileOpen ? "opacity-100 visible" : "opacity-0 invisible"
      )}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 transition-opacity duration-300" 
          onClick={onMobileClose}
        />
        
        {/* Sidebar */}
        <div className={cn(
          "absolute left-0 top-0 h-full w-64 bg-card border-r shadow-xl transition-transform duration-300 ease-in-out flex flex-col",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex items-center justify-between p-3 border-b flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">N</span>
              </div>
              <span className="font-semibold text-lg">Nanographer</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileClose}
              className="h-8 w-8 p-0 hover:bg-muted/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = currentTab === item.name.toLowerCase()
                
                return (
                  <Link key={item.name} href={item.href} onClick={onMobileClose}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-10 transition-all duration-200 hover:scale-[1.02] hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                        isActive && "bg-primary/10 text-primary"
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4 mr-3",
                        isActive && "text-primary"
                      )} />
                      <span className={cn(
                        "flex-1 text-left",
                        isActive && "text-primary font-medium"
                      )}>{item.name}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
