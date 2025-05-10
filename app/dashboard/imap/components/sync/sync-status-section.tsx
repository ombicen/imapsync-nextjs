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
}

export function SyncStatusSection({
  isSyncing,
  onSyncStart,
  onSyncStop,
  syncProgress,
  syncStats,
}: SyncStatusSectionProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sync Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-4">
            {!isSyncing && (
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
                <Button
                  variant="destructive"
                  onClick={onSyncStop}
                  className="w-full"
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
