import { kv } from '@vercel/kv';

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

// Prefix for Redis keys to avoid collisions
const KEY_PREFIX = 'imapsync:progress:';

// The TTL (time-to-live) for progress data in Redis (24 hours in seconds)
const PROGRESS_TTL = 60 * 60 * 24;

// Local in-memory cache for development environments without Redis
let localProgressStore: Record<string, ProgressData> = {};

// Check if we're running in a serverless environment
const isServerless = process.env.VERCEL === '1';

// Helper to determine if Vercel KV is available
const isKvAvailable = (): boolean => {
  return isServerless && typeof kv !== 'undefined';
};

// Function to update progress for a specific session
export async function updateProgress(sessionId: string, data: Partial<ProgressData>): Promise<ProgressData> {
  // Determine the key for this session
  const key = `${KEY_PREFIX}${sessionId}`;
  
  let currentProgress: ProgressData;
  
  // Get the current progress data
  if (isKvAvailable()) {
    // When using Vercel KV
    currentProgress = await kv.get<ProgressData>(key) || {
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
  } else {
    // Fallback to local storage for development
    console.warn('Vercel KV not available, using local memory store. This will not persist across serverless invocations.');
    if (!localProgressStore[sessionId]) {
      localProgressStore[sessionId] = {
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
    currentProgress = localProgressStore[sessionId];
  }
  
  // Update the progress data
  const updatedProgress: ProgressData = {
    ...currentProgress,
    ...data,
    // Append new logs if provided and limit to last 100 entries
    logs: data.logs 
      ? [...currentProgress.logs, ...data.logs].slice(-100)
      : currentProgress.logs
  };
  
  // Store the updated progress
  if (isKvAvailable()) {
    // Store in Vercel KV with TTL
    await kv.set(key, updatedProgress, { ex: PROGRESS_TTL });
  } else {
    // Store in local memory
    localProgressStore[sessionId] = updatedProgress;
  }
  
  return updatedProgress;
}

// Function to get progress data for a specific session
export async function getProgress(sessionId: string): Promise<ProgressData | null> {
  const key = `${KEY_PREFIX}${sessionId}`;
  
  if (isKvAvailable()) {
    return await kv.get<ProgressData>(key);
  } else {
    return localProgressStore[sessionId] || null;
  }
}

// Function to clear progress data for a specific session
export async function clearProgress(sessionId: string): Promise<void> {
  const key = `${KEY_PREFIX}${sessionId}`;
  
  if (isKvAvailable()) {
    await kv.del(key);
  } else {
    delete localProgressStore[sessionId];
  }
}

// Function to get all active session IDs
export async function getActiveSessions(): Promise<string[]> {
  if (isKvAvailable()) {
    // In a production environment, list keys with the progress prefix
    // Note: This pattern scan might not be efficient for large datasets
    const keys = await kv.keys(`${KEY_PREFIX}*`);
    return keys.map(key => key.replace(KEY_PREFIX, ''));
  } else {
    // In development, return from local store
    return Object.keys(localProgressStore);
  }
}
