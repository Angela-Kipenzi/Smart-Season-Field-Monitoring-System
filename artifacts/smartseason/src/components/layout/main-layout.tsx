import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { 
  LayoutDashboard, 
  Sprout, 
  Users, 
  LogOut, 
  Menu,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { data: currentUserData, isLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });

  const currentUser = currentUserData?.user;
  const isAdmin = currentUser?.role === "admin";

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Fields", href: "/fields", icon: Sprout },
    ...(isAdmin ? [{ name: "Agents", href: "/agents", icon: Users }] : []),
  ];

  const NavLinks = () => (
    <>
      {navigation.map((item) => {
        const isActive = location.startsWith(item.href);
        return (
          <Link 
            key={item.name} 
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            data-testid={`nav-${item.name.toLowerCase()}`}
          >
            <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-background border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/logo.svg`} alt="SmartSeason Logo" className="h-8 w-8" />
          <span className="font-bold text-lg text-primary tracking-tight">SmartSeason</span>
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[280px] p-0">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <img src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/logo.svg`} alt="SmartSeason Logo" className="h-8 w-8" />
                <span className="font-bold text-lg text-primary tracking-tight">SmartSeason</span>
              </div>
            </div>
            <nav className="p-4 space-y-1 flex flex-col">
              <NavLinks />
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-background border-r border-border h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <img src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/logo.svg`} alt="SmartSeason Logo" className="h-8 w-8" />
          </div>
          <span className="font-bold text-xl text-primary tracking-tight">SmartSeason</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLinks />
        </nav>
        
        <div className="p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start px-2 py-6 h-auto hover:bg-muted"
                data-testid="user-menu-trigger"
              >
                <div className="flex items-center gap-3 w-full overflow-hidden">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={clerkUser?.imageUrl} alt={clerkUser?.fullName || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {clerkUser?.firstName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start flex-1 overflow-hidden">
                    <span className="text-sm font-medium truncate w-full">
                      {isLoading ? "Loading..." : currentUser?.name || clerkUser?.fullName}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {isLoading ? "..." : (currentUser?.role === "admin" ? "Coordinator" : "Field Agent")}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{currentUser?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive cursor-pointer" 
                onClick={() => signOut()}
                data-testid="btn-sign-out"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-h-[calc(100vh-65px)] md:min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
