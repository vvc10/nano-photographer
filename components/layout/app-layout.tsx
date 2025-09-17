"use client"

import { useState, ReactNode } from "react"
import { BoardsSidebar, SidebarProvider, useSidebar } from "@/components/board/boards-sidebar"
import { Header } from "./header"

interface AppLayoutProps {
  children: ReactNode
  currentTab?: string
}

function AppLayoutContent({ children, currentTab = "home" }: AppLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const { isCollapsed } = useSidebar()

  return (
    <main className="min-h-dvh flex flex-col overflow-x-hidden">
      <Header 
        onMobileSidebarToggle={() => setIsMobileSidebarOpen(true)} 
      />
      
      {/* Desktop Sidebar - Fixed */}
      <div className="hidden md:block">
        <BoardsSidebar currentTab={currentTab} />
      </div>
      
      {/* Mobile Sidebar */}
      <BoardsSidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        currentTab={currentTab}
      />
      
      {/* Main Content with Dynamic Sidebar Offset */}
      <div className={`transition-all duration-300 ease-in-out ${
        isCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        <div className="container md:mt-26 mt-[140px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-full">
          {children}
        </div>
      </div>
    </main>
  )
}

export function AppLayout({ children, currentTab }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppLayoutContent currentTab={currentTab}>
        {children}
      </AppLayoutContent>
    </SidebarProvider>
  )
}
