import { useState } from 'react';
import { Metadata } from 'next';
import { ImapSyncContainer } from '@/app/dashboard/imap/components/container/imap-sync-container';
import { ImapConnectionConfig } from '@/lib/types/imap';

export const metadata: Metadata = {
  title: 'IMAP Sync - Dashboard',
  description: 'Synchronize emails between IMAP servers',
};

export default function ImapLayout() {
  const [sourceConfig, setSourceConfig] = useState<ImapConnectionConfig | null>(null);
  const [destinationConfig, setDestinationConfig] = useState<ImapConnectionConfig | null>(null);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">IMAP Sync Dashboard</h1>
      <ImapSyncContainer
        sourceConfig={sourceConfig}
        destinationConfig={destinationConfig}
      />
    </div>
  );
}
