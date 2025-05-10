'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImapConnectionConfig } from "@/app/dashboard/imap/types/imap";

interface ImapConnectionStatusProps {
  config: ImapConnectionConfig | null;
  connectionTestState: 'idle' | 'testing' | 'connected' | 'failed';
  onTestConnection: () => void;
  logs: Array<{ type: 'info' | 'error' | 'success'; message: string }>;
}

export function ImapConnectionStatus({ 
  config, 
  connectionTestState,
  onTestConnection,
  logs
}: ImapConnectionStatusProps) {
  if (!config) {
    return <Badge variant="outline">Not configured</Badge>;
  }

  const getStatusBadge = () => {
    switch (connectionTestState) {
      case 'testing':
        return <Badge variant="secondary">Testing Connection...</Badge>;
      case 'connected':
        return <Badge variant="secondary">Connected</Badge>;
      case 'failed':
        return <Badge variant="destructive">Connection Failed</Badge>;
      default:
        return <Badge variant="outline">Not Connected</Badge>;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{config.host}:{config.port}</Badge>
          <Badge variant="outline">{config.username}</Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onTestConnection}
          disabled={connectionTestState === 'testing'}
        >
          {connectionTestState === 'testing' ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>
      {logs.length > 0 && (
        <div className="space-y-1">
          {logs.map((log, index) => (
            <div key={index} className="flex items-center gap-2">
              <Badge variant={log.type === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                {log.type === 'error' ? 'Error' : log.type === 'success' ? 'Success' : 'Info'}
              </Badge>
              <span className="text-sm">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
