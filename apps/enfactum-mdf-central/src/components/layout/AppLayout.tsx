import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Separator } from "@/components/ui/separator";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbList, 
  BreadcrumbPage 
} from "@/components/ui/breadcrumb";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { useLocation } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/activities': 'Activities',
  '/partners': 'Partners',
  '/clients': 'Clients',
  '/vendors': 'Vendors',
  '/poe': 'POE Submissions',
  '/creatives': 'Creative Approval Queue',
  '/financials': 'Financials',
  '/team': 'Team',
  '/settings': 'Settings',
  '/resources': 'Resource Hub',
  '/mdf-pipeline': 'MDF Pipeline',
};

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  // Strip any dynamic suffix (/projects/abc → /projects) before lookup.
  const basePath = '/' + (location.pathname.split('/').filter(Boolean)[0] ?? '');
  const pageTitle = routeTitles[basePath === '/' ? '/' : basePath] || 'Dashboard';
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored === 'dark' || (!stored && prefersDark);
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium">
                    {pageTitle}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            
            <div className="ml-auto flex items-center gap-3">
              <GlobalSearch />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme}
                className="h-9 w-9"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
