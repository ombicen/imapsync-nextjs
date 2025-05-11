'use client';

import { useState } from 'react';
import { ImapSyncContainer } from '@/app/dashboard/imap/components/container/imap-sync-container';
import { ImapConnectionConfig } from '@/app/dashboard/imap/types/imap';

export function ImapDashboard() {
  const [sourceConfig, setSourceConfig] = useState<ImapConnectionConfig | null>(null);
  const [destinationConfig, setDestinationConfig] = useState<ImapConnectionConfig | null>(null);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">IMAP Sync Dashboard</h1>
      <ImapSyncContainer
        sourceConfig={sourceConfig}
        destinationConfig={destinationConfig}
        onSourceConfigChange={setSourceConfig}
        onDestinationConfigChange={setDestinationConfig}
      />
    </div>
  );
}