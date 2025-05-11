'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SyncStatusSectionProps {
  isSyncing: boolean;
  onSyncStart: () => void;
  onSyncStop: () => void;
  syncProgress?: number;
  syncStats?: {
    totalMessages: number;
    processedMessages: number;
    errors: number;
  } | null;
  syncLogs?: {message: string; timestamp: string}[];
  syncError?: string | null;
  syncComplete?: boolean;
  syncSummary?: {
    mailboxes: Array<{
      name: string;
      totalMessages: number;
      syncedMessages: number;
      skippedMessages: number;
    }>;
    startTime: string;
    endTime: string;
    elapsedTimeSeconds: number;
  } | null;
  onReset?: () => void;
}

export function SyncStatusSection({
  isSyncing,
  onSyncStart,
  onSyncStop,
  syncProgress,
  syncStats,
  syncLogs = [],
  syncError = null,
  syncComplete = false,
  syncSummary = null,
  onReset,
}: SyncStatusSectionProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sync Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-4">
            {!isSyncing && !syncComplete && (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription className="text-center">
                    Configure both IMAP servers and start the sync process
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={onSyncStart}
                  className="w-full"
                >
                  Start Sync
                </Button>
              </div>
            )}
            
            {!isSyncing && syncComplete && syncSummary && (
              <div className="space-y-6">
                <Alert variant="default" className="bg-green-50 border-green-200">
                  <AlertDescription className="text-center text-green-700">
                    Sync completed successfully!
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium">Start Time</div>
                      <div className="text-sm">{new Date(syncSummary.startTime).toLocaleTimeString()}</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium">End Time</div>
                      <div className="text-sm">{new Date(syncSummary.endTime).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-sm font-medium">Total Duration</div>
                    <div className="text-lg font-bold">{syncSummary.elapsedTimeSeconds} seconds</div>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-gray-100 p-2 font-medium">Mailbox Summary</div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2 text-left">Mailbox</th>
                          <th className="p-2 text-right">Total</th>
                          <th className="p-2 text-right">Synced</th>
                          <th className="p-2 text-right">Skipped</th>
                        </tr>
                      </thead>
                      <tbody>
                        {syncSummary.mailboxes.map((mailbox, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="p-2 border-t">{mailbox.name}</td>
                            <td className="p-2 border-t text-right">{mailbox.totalMessages}</td>
                            <td className="p-2 border-t text-right">{mailbox.syncedMessages}</td>
                            <td className="p-2 border-t text-right">{mailbox.skippedMessages}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {syncStats && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm font-medium">Total Messages</div>
                        <div className="text-lg font-bold">{syncStats.totalMessages}</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm font-medium">Synced</div>
                        <div className="text-lg font-bold">{syncStats.processedMessages}</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm font-medium">Errors</div>
                        <div className="text-lg font-bold">{syncStats.errors}</div>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={onReset}
                    className="w-full"
                  >
                    Start New Sync
                  </Button>
                </div>
              </div>
            )}
            {isSyncing && (
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Syncing in progress...</span>
                </div>
                {syncProgress !== undefined && (
                  <div className="w-full">
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${syncProgress}%` }}
                      />
                    </div>
                    <div className="text-xs text-center mt-1">{syncProgress}% complete</div>
                  </div>
                )}
                {syncStats && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-sm font-medium">Total Messages</div>
                      <div className="text-lg font-bold">{syncStats.totalMessages}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">Processed</div>
                      <div className="text-lg font-bold">{syncStats.processedMessages}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">Errors</div>
                      <div className="text-lg font-bold">{syncStats.errors}</div>
                    </div>
                  </div>
                )}
                {syncError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>
                      Error: {syncError}
                    </AlertDescription>
                  </Alert>
                )}
                
                {syncLogs.length > 0 && (
                  <div className="mt-4 max-h-40 overflow-y-auto border rounded p-2 text-xs">
                    {syncLogs.map((log, index) => (
                      <div key={index} className="mb-1">
                        <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
                      </div>
                    ))}
                  </div>
                )}
                
                <Button
                  variant="destructive"
                  onClick={onSyncStop}
                  className="w-full mt-4"
                >
                  Stop Sync
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
