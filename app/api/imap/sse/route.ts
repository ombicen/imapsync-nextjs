import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper function to encode SSE messages
function encodeSSE(event: string, data: any) {
  const encoder = new TextEncoder();
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// Global progress state shared across requests
type ProgressData = {
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
    ...data
  };
  
  // If marked as complete, set phase to complete
  if (data.isComplete) {
    progressStore[sessionId].phase = 'complete';
  }
  
  // Clean up old sessions (keep for 10 minutes)
  const now = Date.now();
  Object.keys(progressStore).forEach(id => {
    const session = progressStore[id];
    if (session.isComplete && now - new Date(session.logs[session.logs.length - 1]?.timestamp || 0).getTime() > 10 * 60 * 1000) {
      delete progressStore[id];
    }
  });
}

// Initialize a new session
export function initSession(sessionId: string) {
  if (!progressStore[sessionId]) {
    progressStore[sessionId] = {
      percentage: 0,
      currentMailbox: '',
      processedMessages: 0,
      totalMessages: 0,
      processedMailboxes: 0,
      totalMailboxes: 0,
      logs: [{
        message: 'Initializing sync session',
        timestamp: new Date().toISOString()
      }],
      isComplete: false,
      sessionId,
      phase: 'start'
    };
  }
  
  return progressStore[sessionId];
}

// SSE endpoint for real-time progress updates
// Type definitions for configuration
interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

interface SyncOptions {
  filters?: {
    startDate?: string;
    endDate?: string;
    folders?: string[];
  };
  maxMessages?: number;
}

// Create a function to dynamically import the sync process module to avoid TypeScript errors
// This works at runtime even though TypeScript can't find the module during static analysis
const importSyncProcess = async () => {
  try {
    // Using dynamic import to avoid TypeScript static analysis errors
    const syncModule = await import('../sync/sync-process');
    return syncModule.performSync;
  } catch (error) {
    console.error('Error importing sync process module:', error);
    throw new Error('Failed to load sync module');
  }
};

// Function to start the actual sync process
async function startSyncProcess(
  sessionId: string, 
  sourceConfig: ImapConfig, 
  destinationConfig: ImapConfig, 
  syncOptions?: SyncOptions
) {
  try {
    console.log(`Starting sync process for session ${sessionId}`);
    
    // Start the sync process directly without making an HTTP request
    // This avoids the issues with server-side fetch in Next.js API routes
    // The process will run asynchronously
    performSync(sessionId, sourceConfig, destinationConfig, syncOptions);
    
    return { success: true, message: 'Sync process started' };
  } catch (error) {
    console.error(`Error starting sync process:`, error);
    updateProgress(sessionId, {
      logs: [{
        message: `Error starting sync: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      }],
      isComplete: true
    });
    return { error: `Failed to start sync process: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// SSE endpoint for real-time progress updates
export async function GET(request: NextRequest) {
  // Set up SSE headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };
  
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');
  
  // Check if session ID is provided
  if (!sessionId) {
    return new NextResponse(JSON.stringify({ error: "Session ID is required" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Check if session exists
  if (!progressStore[sessionId]) {
    // Initialize session if it doesn't exist
    initSession(sessionId);
  }

  // Create a text encoder
  const encoder = new TextEncoder();
  
  // Create a stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Helper function to send SSE data
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      
      // Send initial data
      const initialData = progressStore[sessionId];
      console.log('Sending initial SSE data:', initialData);
      send(initialData);
      
      // Check for startSync param to determine if we should start sync
      const shouldStartSync = url.searchParams.get('startSync') === 'true';
      let sourceConfig: ImapConfig | undefined;
      let destinationConfig: ImapConfig | undefined;
      let syncOptions: SyncOptions | undefined;
      
      if (shouldStartSync) {
        try {
          // Get configs from URL params (base64 encoded JSON)
          const sourceConfigParam = url.searchParams.get('sourceConfig');
          const destConfigParam = url.searchParams.get('destConfig');
          const syncOptionsParam = url.searchParams.get('syncOptions');
          
          if (sourceConfigParam && destConfigParam) {
            sourceConfig = JSON.parse(atob(sourceConfigParam));
            destinationConfig = JSON.parse(atob(destConfigParam));
            syncOptions = syncOptionsParam ? JSON.parse(atob(syncOptionsParam)) : {};
            
            // Start the sync process after a short delay to ensure SSE connection is established
            setTimeout(async () => {
              if (sourceConfig && destinationConfig) {
                try {
                  // Dynamically import the sync process module
                  const performSyncFn = await importSyncProcess();
                  // Call the imported function with the config
                  await performSyncFn(sessionId, sourceConfig, destinationConfig, syncOptions);
                } catch (err) {
                  console.error('Error in sync process:', err);
                  send({ error: `Error in sync: ${err instanceof Error ? err.message : String(err)}` });
                }
              } else {
                console.error('Missing required configuration for sync');
                send({ error: 'Missing required configuration for sync' });
              }
            }, 500);
          }
        } catch (error) {
          console.error('Error parsing sync configs:', error);
          send({ error: `Failed to parse sync configuration: ${error instanceof Error ? error.message : String(error)}` });
        }
      }
      
      // Set up interval to send progress updates
      const intervalId = setInterval(() => {
        if (!progressStore[sessionId]) {
          clearInterval(intervalId);
          send({ error: "Session expired" });
          controller.close();
          return;
        }
        
        const currentData = progressStore[sessionId];
        console.log('Sending SSE update:', { 
          percentage: currentData.percentage,
          currentMailbox: currentData.currentMailbox,
          phase: currentData.phase
        });
        send(currentData);
        
        // If sync is complete, end the stream
        if (currentData.isComplete) {
          console.log('Sync complete, closing SSE stream');
          clearInterval(intervalId);
          controller.close();
        }
      }, 1000); // Send updates every second
      
      // Clean up interval if the connection is closed
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
      });
    }
  });
  
  // Return the SSE stream
  return new NextResponse(stream, { headers });
}

// POST endpoint to start sync process and establish SSE connection in one call
export async function POST(request: NextRequest) {
  try {
    // Generate a unique session ID
    const sessionId = `sync-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Initialize the session
    initSession(sessionId);
    
    // Parse the request body
    const { sourceConfig, destinationConfig, syncOptions } = await request.json() as {
      sourceConfig: ImapConfig;
      destinationConfig: ImapConfig;
      syncOptions?: SyncOptions;
    };
    
    if (!sourceConfig || !destinationConfig) {
      return NextResponse.json(
        { type: 'error', message: 'Missing required configuration parameters' },
        { status: 400 }
      );
    }
    
    // Return the session ID immediately
    // The client will establish an SSE connection with this ID
    // The sync process will be started automatically when the SSE connection is established
    return NextResponse.json({ 
      sessionId, 
      message: 'Session created. Connect to SSE endpoint with this sessionId and startSync=true to begin sync.' 
    });
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { type: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
