'use client';

import { ImapSyncProgress, ImapSyncStats, ImapSyncState } from '@/app/dashboard/imap/types/imap';

interface SyncStatusSectionProps {
  progress: ImapSyncProgress;
  stats: ImapSyncStats | null;
  state: ImapSyncState;
}

export function SyncStatusSection({ progress, stats, state }: SyncStatusSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Sync Status</h2>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">State</label>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
            {state}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Progress</label>
        <div className="w-full">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>{progress.current}/{progress.total}</span>
            <span>{progress.estimatedTimeRemaining || 'Calculating...'}</span>
          </div>
        </div>
      </div>

      {stats && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Statistics</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Total Emails:</span>
              <span className="font-medium">{stats.totalEmails}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Synced:</span>
              <span className="font-medium">{stats.syncedEmails}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Skipped:</span>
              <span className="font-medium">{stats.skippedEmails}</span>
            </div>
            {stats.errors.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Errors:</span>
                <span className="font-medium text-red-500">{stats.errors.length}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
