import { BottomNavBar } from "@/components/BottomNavBar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen w-full max-w-lg mx-auto bg-background">
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <BottomNavBar />
    </div>
  );
}
