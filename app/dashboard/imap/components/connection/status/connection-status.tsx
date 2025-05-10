"use client";

import { ImapConnectionConfig } from "@/app/dashboard/imap/types/imap";
import { CheckCircle, ShieldCheck, Mail } from "lucide-react";
import { ConnectionLog } from "../log/connection-log";
import { Button } from "@/components/ui/button";

interface ImapConnectionStatusProps {
  config: ImapConnectionConfig | null;
  connectionTestState?: 'idle' | 'testing' | 'connected' | 'failed';
  onTestConnection?: () => Promise<void>;
  logs: Array<{ type: 'info' | 'error' | 'success'; message: string }>;
  mailboxes?: Array<{ name: string; path: string; children?: Array<{ name: string; path: string }> }>;
  onLog: (type: 'info' | 'error' | 'success', message: string) => void;
}

export function ImapConnectionStatus({ 
  config, 
  connectionTestState = 'idle',
  logs,
  mailboxes,
  onLog
}: ImapConnectionStatusProps) {
  return (
    <div className="rounded-md border p-4 bg-muted/40">
      <div className="flex items-start space-x-4">
        <div className="flex-1 space-y-1">
          {config && (
            <>
              <p className="text-sm font-medium leading-none">
                <span className="text-muted-foreground">Host:</span> {config.host}:{config.port}
              </p>
              <p className="text-sm font-medium leading-none mt-2">
                <span className="text-muted-foreground">Username:</span> {config.username}
              </p>

            </>
          )}
          
          <div className="flex mt-3 gap-4">
            {connectionTestState === 'connected' && (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs">Connected</span>
              </div>
            )}
            {connectionTestState === 'testing' && (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-1" />
                <span className="text-xs">Testing...</span>
              </div>
            )}
            {connectionTestState === 'failed' && (
              <div className="flex items-center">
                <ShieldCheck className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-xs text-red-500">Failed</span>
              </div>
            )}
            
            {config?.secure && connectionTestState !== 'testing' && (
              <div className="flex items-center">
                <ShieldCheck className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs">Secure</span>
              </div>
            )}
            
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-xs">IMAP</span>
            </div>
          </div>
        </div>
      
      </div>
      <ConnectionLog logs={logs} mailboxes={mailboxes} />
    </div>
  );
}