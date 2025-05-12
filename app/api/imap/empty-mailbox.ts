import { NextApiRequest, NextApiResponse } from "next";
import { emptyMailbox } from "@/lib/imap/imap-utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
  const { config, mailbox } = req.body;
  if (!config || !mailbox) {
    return res.status(400).json({ error: "Missing config or mailbox" });
  }
  try {
    // Dynamically import ImapFlow and connect
    const { connectToImap } = await import("@/lib/imap/imap-utils");
    const client = await connectToImap(config);
    await emptyMailbox(client, mailbox);
    await client.logout();
    return res.status(200).json({ message: `Mailbox '${mailbox}' emptied successfully.` });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to empty mailbox" });
  }
}
