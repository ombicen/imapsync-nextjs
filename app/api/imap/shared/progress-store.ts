import { kv } from "@vercel/kv";

// Global progress state shared across requests
export type ProgressData = {
  percentage: number;
  currentMailbox: string;
  processedMessages: number;
  totalMessages: number;
  processedMailboxes: number;
  totalMailboxes: number;
  logs: Array<{ message: string; timestamp: string }>;
  isComplete: boolean;
  sessionId: string;
  phase?: string;
  mailboxes?: Array<{
    name: string;
    totalMessages: number;
    syncedMessages: number;
    skippedMessages: number;
  }>;
  startTime?: string;
  endTime?: string;
  elapsedTimeSeconds?: number;
  shouldStop?: boolean;
};

const KEY_PREFIX = "imapsync:progress:";
const PROGRESS_TTL = 60 * 60 * 24;
let localProgressStore: Record<string, ProgressData> = {};
const isServerless = process.env.VERCEL === "1";

const isKvAvailable = (): boolean => {
  const requiredVars = [
    "KV_REDIS_KV_URL",
    "KV_REST_API_URL",
    "KV_REST_API_TOKEN",
  ];
  return (
    isServerless &&
    typeof kv !== "undefined" &&
    requiredVars.every((v) => !!process.env[v])
  );
};

const getDefaultProgressData = (sessionId: string): ProgressData => ({
  percentage: 0,
  currentMailbox: "",
  processedMessages: 0,
  totalMessages: 0,
  processedMailboxes: 0,
  totalMailboxes: 0,
  logs: [],
  isComplete: false,
  sessionId,
  phase: "start",
});

const handleKvError = (
  err: unknown,
  fallbackStore: Record<string, ProgressData>,
  sessionId: string,
  data: ProgressData
) => {
  console.error("KV operation failed, falling back to memory store", err);
  fallbackStore[sessionId] = data;
};

export async function updateProgress(
  sessionId: string,
  data: Partial<ProgressData>
): Promise<ProgressData> {
  const key = `${KEY_PREFIX}${sessionId}`;
  let currentProgress: ProgressData;

  if (isKvAvailable()) {
    try {
      currentProgress =
        (await kv.get<ProgressData>(key)) || getDefaultProgressData(sessionId);
    } catch (err) {
      console.error("Failed to fetch progress from KV", err);
      currentProgress = getDefaultProgressData(sessionId);
    }
  } else {
    console.warn("Vercel KV not available, using local memory store.");
    currentProgress =
      localProgressStore[sessionId] || getDefaultProgressData(sessionId);
  }

  const updatedProgress: ProgressData = {
    ...currentProgress,
    ...data,
    logs: data.logs
      ? [...currentProgress.logs, ...data.logs].slice(-100)
      : currentProgress.logs,
  };

  if (isKvAvailable()) {
    try {
      await kv.set(key, updatedProgress, { ex: PROGRESS_TTL });
    } catch (err) {
      handleKvError(err, localProgressStore, sessionId, updatedProgress);
    }
  } else {
    localProgressStore[sessionId] = updatedProgress;
  }

  return updatedProgress;
}

export async function getProgress(
  sessionId: string
): Promise<ProgressData | null> {
  const key = `${KEY_PREFIX}${sessionId}`;

  if (isKvAvailable()) {
    try {
      return await kv.get<ProgressData>(key);
    } catch (err) {
      console.error("Failed to fetch progress from KV", err);
      return null;
    }
  } else {
    return localProgressStore[sessionId] || null;
  }
}

export async function clearProgress(sessionId: string): Promise<void> {
  const key = `${KEY_PREFIX}${sessionId}`;

  if (isKvAvailable()) {
    try {
      await kv.del(key);
    } catch (err) {
      console.error("Failed to delete progress from KV", err);
    }
  } else {
    delete localProgressStore[sessionId];
  }
}

export async function getActiveSessions(): Promise<string[]> {
  if (isKvAvailable()) {
    try {
      const keys = await kv.keys(`${KEY_PREFIX}*`);
      return keys.map((key) => key.replace(KEY_PREFIX, ""));
    } catch (err) {
      console.error("Failed to fetch active sessions from KV", err);
      return [];
    }
  } else {
    return Object.keys(localProgressStore);
  }
}
