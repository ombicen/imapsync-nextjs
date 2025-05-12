import { NextRequest, NextResponse } from "next/server";
import { getProgress, updateProgress } from "../shared/progress-store";

// In-memory store for active sync sessions (replace with your actual session management logic)
export const activeSyncSessions: Record<string, boolean> = {};

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID is required" },
      { status: 400 }
    );
  }

  console.log("Received stop request for sessionId:", sessionId);
  console.log("Current activeSyncSessions:", activeSyncSessions);

  // Set shouldStop flag in progress store
  const progress = await getProgress(sessionId);
  if (!progress) {
    return NextResponse.json(
      { error: "Sync session not found" },
      { status: 404 }
    );
  }
  await updateProgress(sessionId, { shouldStop: true });

  return NextResponse.json({ message: "Stop signal sent" }, { status: 200 });
}
