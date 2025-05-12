import { NextResponse } from "next/server";
import { updateProgress } from "../shared/progress-store";
import { performSync } from "./sync-process";
import { activeSyncSessions } from "./stop"; // Import the activeSyncSessions object

export async function POST(request: Request) {
  try {
    // Parse the request body
    const {
      sessionId: providedSessionId,
      sourceConfig,
      destinationConfig,
      syncOptions,
    } = await request.json();

    // Input validation
    if (!sourceConfig || !destinationConfig) {
      return NextResponse.json(
        { type: "error", message: "Missing required configuration parameters" },
        { status: 400 }
      );
    }

    // Use provided sessionId or generate a new one
    const sessionId =
      providedSessionId ||
      `sync-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    // Initialize the session in the progress store
    await updateProgress(sessionId, {
      percentage: 0,
      currentMailbox: "",
      processedMessages: 0,
      totalMessages: 0,
      processedMailboxes: 0,
      totalMailboxes: 0,
      logs: [
        {
          message: "Initializing sync session",
          timestamp: new Date().toISOString(),
        },
      ],
      isComplete: false,
      sessionId,
      phase: "start",
    });

    // Register the sessionId in activeSyncSessions
    activeSyncSessions[sessionId] = true;

    // If this was called directly (not via SSE), start the sync process
    if (!providedSessionId) {
      // Start the sync process asynchronously
      setImmediate(() => {
        performSync(
          sessionId,
          sourceConfig,
          destinationConfig,
          syncOptions
        ).catch((err) => console.error("Error in performSync:", err));
      });
    }

    // Return immediately with session ID
    return NextResponse.json({ sessionId, message: "Sync process initiated" });
  } catch (error: any) {
    console.error("Error initiating sync process:", error);
    return NextResponse.json(
      { type: "error", message: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
