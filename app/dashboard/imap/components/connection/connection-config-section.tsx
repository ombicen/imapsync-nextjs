'use client';

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { ImapConfigForms } from "./forms/config-forms";
import { ImapConnectionStatus } from "./status/connection-status";
import { ConnectionLog } from "./log/connection-log";
import { ImapTestWorker } from "@/lib/workers/imap-test-worker";
import { ImapConnectionConfig } from "@/app/dashboard/imap/types/imap";

interface ConnectionConfigSectionProps {
  title: string;
  config: ImapConnectionConfig | null;
  showForm: boolean;
  onToggleForm: () => void;
  onSubmit: (config: ImapConnectionConfig) => void;
  disabled?: boolean;
}

// Type guard to ensure config is not null
const isConfigValid = (config: ImapConnectionConfig | null): config is ImapConnectionConfig => {
  return config !== null;
};

export function ConnectionConfigSection({
  title,
  config,
  showForm,
  onToggleForm,
  onSubmit,
  disabled = false,
}: ConnectionConfigSectionProps) {
  const [connectionTestState, setConnectionTestState] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [logs, setLogs] = useState<Array<{ type: 'info' | 'error' | 'success'; message: string }>>([]);

  const addLog = (type: 'info' | 'error' | 'success', message: string) => {
    setLogs(prev => [
      ...prev,
      { type, message }
    ]);
  };

  const handleTestConnection = async () => {
    if (!config) return;
    
    setConnectionTestState('testing');
    addLog('info', 'Attempting to connect to IMAP server...');
    
    try {
      const response = await fetch('/api/imap/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });

      const result = await response.json();

      if (result.type === 'success') {
        setConnectionTestState('connected');
        addLog('success', 'Successfully connected to IMAP server');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addLog('error', `Connection failed: ${errorMessage}`);
      setConnectionTestState('failed');
    }
  };
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{title}</h2>
            {config && config.host && (
              <Badge variant="outline" className="ml-2">
                {config.host}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTestConnection}
              disabled={disabled || !config}
            >
              Test Connection
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleForm}
              disabled={disabled}
            >
              {showForm ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {showForm && (
          <ImapConfigForms
            type={title.toLowerCase() as "source" | "destination"}
            onSubmit={onSubmit}
            disabled={disabled}
          />
        )}

        {isConfigValid(config) && !showForm && (
          <ImapConnectionStatus 
            config={config} 
            connectionTestState={connectionTestState}
            onTestConnection={handleTestConnection}
            logs={logs}
            onLog={addLog}
          />
        )}
      </CardContent>
    </Card>
  );
}
