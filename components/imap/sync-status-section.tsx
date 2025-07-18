'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon, StopCircleIcon, RefreshCwIcon } from "lucide-react";
import type { ImapSyncState, ImapSyncProgress, ImapSyncStats } from "@/lib/types/imap";
import { ImapSyncProgress as ProgressComponent } from "./imap-sync-progress";
import { ImapSyncResults as ResultsComponent } from "./imap-sync-results";

interface SyncStatusSectionProps {
  syncState: ImapSyncState;
  progress: ImapSyncProgress;
  stats: ImapSyncStats | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
  isConfigComplete: boolean;
  dryRun: boolean;
}

export function SyncStatusSection({
  syncState,
  progress,
  stats,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  isConfigComplete,
  dryRun,
}: SyncStatusSectionProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold mb-4">Sync Status</h2>
        {syncState === "idle" && !stats && (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Configure both IMAP servers and start the sync process
            </p>
            <Button
              onClick={onStart}
              disabled={!isConfigComplete}
              className="w-full"
            >
              <PlayIcon className="mr-2 h-4 w-4" />
              Start Sync {dryRun && "(Dry Run)"}
            </Button>
          </div>
        )}

        {syncState === "running" && (
          <div className="space-y-4">
            <ProgressComponent progress={progress} />
            <div className="flex gap-2">
              <Button onClick={onPause} variant="outline" className="flex-1">
                <PauseIcon className="mr-2 h-4 w-4" />
                Pause
              </Button>
              <Button onClick={onStop} variant="destructive" className="flex-1">
                <StopCircleIcon className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </div>
          </div>
        )}

        {syncState === "paused" && (
          <div className="space-y-4">
            <ProgressComponent progress={progress} />
            <div className="flex gap-2">
              <Button onClick={onResume} variant="outline" className="flex-1">
                <PlayIcon className="mr-2 h-4 w-4" />
                Resume
              </Button>
              <Button onClick={onStop} variant="destructive" className="flex-1">
                <StopCircleIcon className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </div>
          </div>
        )}

        {syncState === "completed" && stats && (
          <div className="space-y-4">
            <ResultsComponent results={{
              stats: {
                total: stats.total,
                copied: stats.copied,
                skipped: stats.skipped,
                errors: stats.errors
              },
              success: true,
              startTime: new Date().toISOString(),
              endTime: new Date().toISOString(),
              sourceMailbox: 'INBOX',
              destinationMailbox: 'INBOX'
            }} />
            <Button onClick={onReset} className="w-full">
              <RefreshCwIcon className="mr-2 h-4 w-4" />
              Start New Sync
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
