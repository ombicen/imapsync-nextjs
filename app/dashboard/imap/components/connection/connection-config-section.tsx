'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDownIcon, ChevronUpIcon, Mail, Settings, Terminal } from "lucide-react";
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

const isDev = process.env.NODE_ENV === "development";

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
  const [mailboxes, setMailboxes] = useState<Array<{ name: string; path: string; children?: Array<{ name: string; path: string }> }>>([]);
  const [formValues, setFormValues] = useState<ImapConnectionConfig>({
    host: config?.host || '',
    port: config?.port || 993,
    username: config?.username || '',
    password: config?.password || '',
    secure: config?.secure ?? true,
    tls: config?.tls ?? false,
  });

  const [emptying, setEmptying] = useState(false);
  const [emptyResult, setEmptyResult] = useState<string | null>(null);

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
        if (result.mailboxes) {
          setMailboxes(result.mailboxes);
        }
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

  const handleEmptyMailbox = async () => {
    if (!config || !mailboxes.length) return;
    setEmptying(true);
    setEmptyResult(null);
    try {
      // For demo, just use the first mailbox
      const mailbox = mailboxes[0].name;
      const response = await fetch("/api/imap/empty-mailbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, mailbox }),
      });
      const result = await response.json();
      if (response.ok) {
        setEmptyResult(result.message);
        addLog("success", result.message);
      } else {
        setEmptyResult(result.error || "Failed to empty mailbox");
        addLog("error", result.error || "Failed to empty mailbox");
      }
    } catch (error: any) {
      setEmptyResult(error.message || "Failed to empty mailbox");
      addLog("error", error.message || "Failed to empty mailbox");
    } finally {
      setEmptying(false);
    }
  };

  return (
    <Card>
       <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
            {config && config.host && (
              <Badge variant="outline" className="ml-2">
                {config.host}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={disabled || !config}
          >
            {connectionTestState === 'testing' ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
              </div>
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
          {isDev && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEmptyMailbox}
              disabled={disabled || !config || emptying}
            >
              {emptying ? "Emptying..." : "Empty Mailbox"}
            </Button>
          )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleForm}
              disabled={disabled}
              title={showForm ? "Show connection log" : "Configure settings"}
            >
              {showForm ? (
                <Terminal className="h-4 w-4" />
              ) : (
                <Settings className="h-4 w-4" />
              )}
            </Button>
          </div>
      </CardHeader>
      <CardContent className="pt-6">


        {showForm && (
          <ImapConfigForms
            type={title.toLowerCase() as "source" | "destination"}
            initialValues={formValues}
            onSubmit={(values) => {
              setFormValues(values);
              onSubmit(values);
              // Check if all required fields are filled, auto toggle to connection log
              // Works for both source and destination servers
              if (values.host && 
                  values.port && 
                  values.username && 
                  values.password) {
                // Auto-toggle to connection log view
                setTimeout(() => onToggleForm(), 500);
              }
            }}
            disabled={disabled}
          />
        )}

        {isConfigValid(config) && !showForm && (
          <ImapConnectionStatus 
            config={config} 
            connectionTestState={connectionTestState}
            logs={logs}
            mailboxes={mailboxes}
            onLog={addLog}
          />
        )}
        {emptyResult && (
          <div className="mt-2 text-xs text-gray-600">{emptyResult}</div>
        )}
      </CardContent>
    </Card>
  );
}
