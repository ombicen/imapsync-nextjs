'use client';

import { AppShell } from "@/components/layout/app-shell";
import { ImapDashboard } from "@/components/imap/imap-dashboard";

export default function Home() {
  return (
    <AppShell>
      <ImapDashboard />
    </AppShell>
  );
}