import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/", icon: "fas fa-tachometer-alt" },
    { name: "Accounts", href: "/accounts", icon: "fas fa-university" },
    { name: "Transactions", href: "/transactions", icon: "fas fa-exchange-alt" },
    { name: "Forecasting", href: "/forecasting", icon: "fas fa-chart-bar" },
    { name: "Budget", href: "/budget", icon: "fas fa-calculator" },
    { name: "Reports", href: "/reports", icon: "fas fa-download" },
  ];

  const initials = user?.username?.substring(0, 2).toUpperCase() || "U";

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      <aside 
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0 sidebar-transition",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-chart-line text-sidebar-primary-foreground text-sm"></i>
            </div>
            <span className="font-semibold text-lg text-sidebar-foreground">RunwayIQ</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    location === item.href
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  onClick={onClose}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  <i className={`${item.icon} w-4 h-4`}></i>
                  {item.name}
                </a>
              </Link>
            ))}
            
            {/* Divider */}
            <div className="border-t border-sidebar-border my-4"></div>
            
            <button className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full text-left">
              <i className="fas fa-cog w-4 h-4"></i>
              Settings
            </button>
          </nav>

          {/* User Profile */}
          <div className="px-4 py-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
                <span className="text-sidebar-primary-foreground text-sm font-medium">
                  {initials}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-sidebar-foreground">
                  {user?.username}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {user?.email}
                </p>
              </div>
              <button 
                onClick={() => logout()}
                className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
                data-testid="button-logout"
              >
                <i className="fas fa-sign-out-alt w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
