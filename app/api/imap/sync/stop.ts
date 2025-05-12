import { NextApiRequest, NextApiResponse } from "next";
import { getProgress, updateProgress } from "../shared/progress-store";

// In-memory store for active sync sessions (replace with your actual session management logic)
export const activeSyncSessions: Record<string, boolean> = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    console.log("Received stop request for sessionId:", sessionId);
    console.log("Current activeSyncSessions:", activeSyncSessions);

    // Set shouldStop flag in progress store
    const progress = await getProgress(sessionId);
    if (!progress) {
      return res.status(404).json({ error: "Sync session not found" });
    }
    await updateProgress(sessionId, { shouldStop: true });

    return res.status(200).json({ message: "Stop signal sent" });
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
