import { NextResponse } from "next/server";
import { initSession } from "../sse/route";
import { performSync } from "./sync-process";

export async function POST(request: Request) {
  try {
    // Parse the request body
    const { sessionId: providedSessionId, sourceConfig, destinationConfig, syncOptions } = await request.json();
    
    // Input validation
    if (!sourceConfig || !destinationConfig) {
      return NextResponse.json(
        { type: 'error', message: 'Missing required configuration parameters' },
        { status: 400 }
      );
    }

    // Use provided sessionId or generate a new one
    const sessionId = providedSessionId || `sync-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Initialize the session in the SSE store if it doesn't exist yet
    if (!providedSessionId) {
      initSession(sessionId);
    }

    // If this was called directly (not via SSE), start the sync process
    if (!providedSessionId) {
      // Start the sync process asynchronously
      setImmediate(() => {
        performSync(sessionId, sourceConfig, destinationConfig, syncOptions)
          .catch(err => console.error('Error in performSync:', err));
      });
    }

    // Return immediately with session ID
    return NextResponse.json({ sessionId, message: 'Sync process initiated' });
  } catch (error: any) {
    console.error('Error initiating sync process:', error);
    return NextResponse.json(
      { type: 'error', message: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
