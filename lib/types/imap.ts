import { ImapFlow } from 'imapflow';

export interface ImapConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean;
  tls: boolean;
}

export type NullableImapConnectionConfig = ImapConnectionConfig | null;

export type ImapSyncState = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'waiting' | 'connecting' | 'copying' | 'finalizing';

export interface ImapSyncOptions {
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  dryRun: boolean;
  skipExistingMessages: boolean;
  calculateStats: boolean;
}

export interface ImapSyncProgress {
  total: number;
  current: number;
  percentage: number;
  estimatedTimeRemaining: string | null;
  status: ImapSyncState;
}

export interface ImapSyncStats {
  total: number;
  copied: number;
  skipped: number;
  errors: string[];
}

export interface ImapSyncResults {
  stats: ImapSyncStats;
  success: boolean;
  message?: string;
  startTime: string;
  endTime: string;
  sourceMailbox: string;
  destinationMailbox: string;
}