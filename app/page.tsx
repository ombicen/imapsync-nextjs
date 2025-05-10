import { AppShell } from "@/components/layout/app-shell";
import { ImapSyncContainer } from "@/components/imap/imap-sync-container";

export default function Home() {
  return (
    <AppShell>
      <ImapSyncContainer />
    </AppShell>
  );
}