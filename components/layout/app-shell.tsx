import { ModeToggle } from "@/components/mode-toggle";
import { MailIcon } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MailIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">IMAP Sync</h1>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="border-t py-4 bg-muted/40">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          IMAP Sync Tool &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}