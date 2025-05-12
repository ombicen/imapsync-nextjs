import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Import from shared progress store
import {
  ProgressData,
  getProgress,
  updateProgress,
} from "../shared/progress-store";

// Types for config and sync options
interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  tls?: boolean;
}

interface SyncOptions {
  filters?: {
    startDate?: string;
    endDate?: string;
    folders?: string[];
  };
  maxMessages?: number;
}

// Type for the performSync function that will be dynamically imported
type PerformSyncFunction = (
  sessionId: string,
  sourceConfig: ImapConfig,
  destinationConfig: ImapConfig,
  syncOptions?: SyncOptions
) => Promise<void>;

// Initialize a new session - used internally only
async function initSession(sessionId: string): Promise<ProgressData | null> {
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

  return await getProgress(sessionId);
}

// Import the sync process module directly
import { performSync } from "../sync/sync-process";

// Function to get the performSync function
const importSyncProcess = async (): Promise<PerformSyncFunction> => {
  return performSync;
};

// SSE endpoint for real-time progress updates
export async function GET(request: NextRequest) {
  // Set up SSE headers
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  // Check if session ID is provided
  if (!sessionId) {
    return new NextResponse(
      JSON.stringify({ error: "Session ID is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Check if session exists
  const existingProgress = await getProgress(sessionId);
  if (!existingProgress) {
    // Initialize session if it doesn't exist
    await initSession(sessionId);
  }

  // Create a text encoder
  const encoder = new TextEncoder();

  // Create a stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      // Helper function to send SSE data
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial data
      const initialData = await getProgress(sessionId);
      console.log("Sending initial SSE data:", initialData);
      send(initialData);

      // Check for startSync param to determine if we should start sync
      const shouldStartSync = url.searchParams.get("startSync") === "true";
      let sourceConfig: ImapConfig | undefined;
      let destinationConfig: ImapConfig | undefined;
      let syncOptions: SyncOptions | undefined;

      if (shouldStartSync) {
        try {
          // Get configs from URL params (base64 encoded JSON)
          const sourceConfigParam = url.searchParams.get("sourceConfig");
          const destConfigParam = url.searchParams.get("destConfig");
          const syncOptionsParam = url.searchParams.get("syncOptions");

          if (sourceConfigParam && destConfigParam) {
            sourceConfig = JSON.parse(atob(sourceConfigParam));
            destinationConfig = JSON.parse(atob(destConfigParam));
            syncOptions = syncOptionsParam
              ? JSON.parse(atob(syncOptionsParam))
              : {};

            // Start the sync process after a short delay to ensure SSE connection is established
            setTimeout(async () => {
              if (sourceConfig && destinationConfig) {
                try {
                  // Dynamically import the sync process module
                  const performSyncFn = await importSyncProcess();
                  // Call the imported function with the config
                  if (performSyncFn) {
                    await performSyncFn(
                      sessionId,
                      sourceConfig,
                      destinationConfig,
                      syncOptions
                    );
                  } else {
                    throw new Error("Failed to load sync function");
                  }
                } catch (err) {
                  console.error("Error in sync process:", err);
                  send({
                    error: `Error in sync: ${
                      err instanceof Error ? err.message : String(err)
                    }`,
                  });
                }
              } else {
                console.error("Missing required configuration for sync");
                send({ error: "Missing required configuration for sync" });
              }
            }, 500);
          }
        } catch (error) {
          console.error("Error parsing sync configs:", error);
          send({
            error: `Failed to parse sync configuration: ${
              error instanceof Error ? error.message : String(error)
            }`,
          });
        }
      }

      // Clear or create an interval to send progress updates
      const intervalRef = setInterval(async () => {
        try {
          if (request.signal.aborted) {
            clearInterval(intervalRef);
            console.log(
              `Client disconnected, clearing interval for session ${sessionId}`
            );
            return;
          }

          // Get the progress for this session
          const progress = await getProgress(sessionId);

          // If progress exists, send it
          if (progress) {
            console.log(`Sending progress update for session ${sessionId}:`, {
              percentage: progress.percentage,
              currentMailbox: progress.currentMailbox,
              isComplete: progress.isComplete,
            });
            send(progress);
          } else {
            console.log(`No progress data found for session ${sessionId}`);
          }
        } catch (error) {
          console.error("Error sending progress update:", error);
        }
      }, 1000); // Send updates every second

      // Clean up interval if the connection is closed
      request.signal.addEventListener("abort", async () => {
        clearInterval(intervalRef);
        if (sessionId) {
          await updateProgress(sessionId, { shouldStop: true });
          console.log(
            `SSE connection closed for session ${sessionId}, sync should stop.`
          );
        }
      });
    },
  });

  // Return the SSE stream
  return new NextResponse(stream, { headers });
}

// POST endpoint to start sync process and establish SSE connection in one call
export async function POST(request: NextRequest) {
  try {
    // Generate a unique session ID
    const sessionId = `sync-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}`;

    // Initialize the session
    initSession(sessionId);

    // Parse the request body
    const { sourceConfig, destinationConfig, syncOptions } =
      (await request.json()) as {
        sourceConfig: ImapConfig;
        destinationConfig: ImapConfig;
        syncOptions?: SyncOptions;
      };

    if (!sourceConfig || !destinationConfig) {
      return NextResponse.json(
        { type: "error", message: "Missing required configuration parameters" },
        { status: 400 }
      );
    }

    // Return the session ID immediately
    // The client will establish an SSE connection with this ID
    // The sync process will be started automatically when the SSE connection is established
    return NextResponse.json({
      sessionId,
      message:
        "Session created. Connect to SSE endpoint with this sessionId and startSync=true to begin sync.",
    });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      {
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
