// Global progress state shared across requests
export type ProgressData = {
  percentage: number;
  currentMailbox: string;
  processedMessages: number;
  totalMessages: number;
  processedMailboxes: number;
  totalMailboxes: number;
  logs: Array<{message: string; timestamp: string}>;
  isComplete: boolean;
  sessionId: string;
  phase?: string;
  mailboxes?: Array<{
    name: string;
    totalMessages: number;
    syncedMessages: number;
    skippedMessages: number;
  }>;
  // Time tracking fields
  startTime?: string;
  endTime?: string;
  elapsedTimeSeconds?: number;
};

// Store progress data by session ID
const progressStore: Record<string, ProgressData> = {};

// Function to update progress for a specific session
export function updateProgress(sessionId: string, data: Partial<ProgressData>) {
  if (!progressStore[sessionId]) {
    progressStore[sessionId] = {
      percentage: 0,
      currentMailbox: '',
      processedMessages: 0,
      totalMessages: 0,
      processedMailboxes: 0,
      totalMailboxes: 0,
      logs: [],
      isComplete: false,
      sessionId,
      phase: 'start'
    };
  }
  
  progressStore[sessionId] = {
    ...progressStore[sessionId],
    ...data,
    // Append new logs if provided
    logs: data.logs 
      ? [...progressStore[sessionId].logs, ...data.logs].slice(-100)
      : progressStore[sessionId].logs
  };
  
  return progressStore[sessionId];
}

// Function to get progress data for a specific session
export function getProgress(sessionId: string): ProgressData | null {
  return progressStore[sessionId] || null;
}

// Function to clear progress data for a specific session
export function clearProgress(sessionId: string): void {
  delete progressStore[sessionId];
}

// Function to get all active session IDs
export function getActiveSessions(): string[] {
  return Object.keys(progressStore);
}
