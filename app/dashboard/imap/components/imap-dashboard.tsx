'use client';

import { useState } from 'react';
import { ImapSyncContainer } from './container/imap-sync-container';
import { ImapConnectionConfig } from '../types/imap';

export default function ImapDashboard() {
  const [sourceConfig, setSourceConfig] = useState<ImapConnectionConfig | null>(null);
  const [destinationConfig, setDestinationConfig] = useState<ImapConnectionConfig | null>(null);

  const handleSourceConfigChange = (config: ImapConnectionConfig) => {
    setSourceConfig(config);
  };

  const handleDestinationConfigChange = (config: ImapConnectionConfig) => {
    setDestinationConfig(config);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">IMAP Sync Dashboard</h1>
      <ImapSyncContainer
        sourceConfig={sourceConfig}
        destinationConfig={destinationConfig}
        onSourceConfigChange={handleSourceConfigChange}
        onDestinationConfigChange={handleDestinationConfigChange}
      />
    </div>
  );
}
