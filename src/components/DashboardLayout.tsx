import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ProcessSelector from "@/components/ProcessSelector";
import { useTheme } from "@/components/ThemeProvider";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  Landmark,
  School,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ClipboardCheck, Receipt, Users } from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/escola/dashboard" },
  { label: "Checklist Documental", icon: ClipboardCheck, path: "/escola/checklist" },
  { label: "Movimentação Financeira", icon: Receipt, path: "/escola/financeiro" },
  { label: "Dados do Conselho", icon: Users, path: "/escola/conselho" },
  { label: "Prestação de Contas", icon: FileText, path: "#" },
  { label: "Relatórios", icon: BarChart3, path: "#" },
  { label: "Configurações", icon: Settings, path: "#" },
];

const DashboardLayout = () => {
  const { theme, toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex min-h-screen">
        {/* Mobile overlay */}
        {drawerOpen && (
          <div
            className="fixed inset-0 bg-foreground/30 z-40 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
        )}

        {/* Sidebar — 3 states:
             mobile (<768): hidden, opens as drawer
             tablet (768–1023): collapsed icon-only w-16
             desktop (>=1024): full w-60
        */}
        <aside
          className={cn(
            "fixed md:static z-50 inset-y-0 left-0 bg-sidebar flex flex-col transition-all duration-200",
            // Mobile: full-width drawer, hidden by default
            drawerOpen ? "translate-x-0 w-60" : "-translate-x-full w-60",
            // Tablet: always visible, icon-only
            "md:translate-x-0 md:w-16",
            // Desktop: always visible, full width
            "lg:w-60"
          )}
        >
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-4 lg:px-5 border-b border-sidebar-border overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center shrink-0">
              <Landmark className="w-4 h-4 text-brand-purple" />
            </div>
            <span className="text-sm font-heading font-bold text-sidebar-foreground tracking-tight leading-tight hidden lg:block md:hidden">
              Portal de Transparência <span className="text-brand-orange text-xs font-semibold">Forte Mais</span>
            </span>
            {/* Show in mobile drawer */}
            <span className="text-sm font-heading font-bold text-sidebar-foreground tracking-tight leading-tight md:hidden">
              Portal de Transparência <span className="text-brand-orange text-xs font-semibold">Forte Mais</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto md:hidden text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setDrawerOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 lg:px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = item.path !== "#" && location.pathname.startsWith(item.path);
              const navButton = (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.path !== "#") { navigate(item.path); setDrawerOpen(false); }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors",
                    "lg:justify-start md:justify-center lg:px-3 md:px-0",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {/* Label: visible on desktop and mobile drawer, hidden on tablet */}
                  <span className="lg:inline md:hidden">{item.label}</span>
                </button>
              );

              // Wrap in tooltip for tablet collapsed mode
              return (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    {navButton}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="hidden md:block lg:hidden">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          {/* School profile */}
          <div className="px-3 lg:px-4 py-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center shrink-0">
                <School className="w-4 h-4 text-sidebar-foreground" />
              </div>
              <div className="flex-1 min-w-0 hidden lg:block md:hidden">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  E.M. Monteiro Lobato
                </p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate">
                  CNPJ: 12.345.678/0001-90
                </p>
              </div>
              {/* Mobile drawer also shows text */}
              <div className="flex-1 min-w-0 md:hidden">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  E.M. Monteiro Lobato
                </p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate">
                  CNPJ: 12.345.678/0001-90
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <header className="h-16 bg-card border-b border-border flex items-center px-4 gap-3 sticky top-0 z-30">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            <h1 className="text-lg font-heading font-semibold text-foreground truncate">
              Dashboard
            </h1>
            <ProcessSelector />

            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-orange" />
              </Button>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-brand-purple text-primary-foreground text-xs font-medium">
                  JC
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default DashboardLayout;