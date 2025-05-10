export interface ImapConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean;
  tls: boolean;
  mailbox: string;
}

export interface ImapSyncOptions {
  dryRun: boolean;
  calculateStats: boolean;
  skipExistingMessages: boolean;
  batchSize: number;
}

export type ImapSyncState = "idle" | "running" | "paused" | "completed" | "failed";

export interface SyncProgress {
  total: number;
  current: number;
  percentage: number;
  estimatedTimeRemaining: string | null;
  status: "waiting" | "connecting" | "copying" | "finalizing" | "completed";
}

export interface SyncResults {
  totalMessages: number;
  totalSize: string;
  messageCopied: number;
  messagesFailed: number;
  timeTaken: string;
  dryRun: boolean;
}