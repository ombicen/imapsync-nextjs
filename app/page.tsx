'use client';

import { useState } from 'react';
import { AppShell } from "@/components/layout/app-shell";
import { ImapSyncContainer } from "@/app/dashboard/imap/components/container/imap-sync-container";
import { ImapConnectionConfig } from "@/app/dashboard/imap/types/imap";

export default function Home() {
  const [sourceConfig, setSourceConfig] = useState<ImapConnectionConfig | null>(null);
  const [destinationConfig, setDestinationConfig] = useState<ImapConnectionConfig | null>(null);

  return (
    <AppShell>
      <ImapSyncContainer
        sourceConfig={sourceConfig}
        destinationConfig={destinationConfig}
      />
    </AppShell>
  );
}