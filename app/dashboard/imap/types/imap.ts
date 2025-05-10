export interface ImapConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean;
  tls: boolean;
}

export type NullableImapConnectionConfig = ImapConnectionConfig | null;

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
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
}

export interface ImapSyncStats {
  totalEmails: number;
  syncedEmails: number;
  skippedEmails: number;
  errors: string[];
}

export interface ImapSyncResults {
  stats: ImapSyncStats;
  success: boolean;
  message?: string;
}

export type ImapSyncState = 'idle' | 'running' | 'paused' | 'completed' | 'failed';
