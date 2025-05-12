import { NextRequest, NextResponse } from "next/server";
import { emptyMailbox, getMailboxList } from "@/lib/imap/imap-utils";

export async function POST(request: NextRequest) {
  const { config } = await request.json();
  if (!config) {
    return NextResponse.json({ error: "Missing config" }, { status: 400 });
  }
  let client;
  try {
    const { connectToImap } = await import("@/lib/imap/imap-utils");
    client = await connectToImap(config);
    const mailboxes = await getMailboxList(client);
    let emptied = [];
    for (const mailbox of mailboxes) {
      try {
        await emptyMailbox(client, mailbox);
        emptied.push(mailbox);
      } catch (err) {
        // Optionally log or collect errors per mailbox
      }
    }
    return NextResponse.json({
      message: `Emptied mailboxes: ${emptied.join(", ")}`,
      emptied,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to empty mailboxes" },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.logout();
    }
  }
}
