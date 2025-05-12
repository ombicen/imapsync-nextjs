import { ImapFlow } from "imapflow";
import { ImapConnectionConfig } from "@/lib/types/imap";

// Ensure this file contains the definition of emptyMailbox
export async function emptyMailbox(
  client: any,
  mailbox: string
): Promise<void> {
  try {
    await client.mailboxDelete(mailbox);
  } catch (err) {
    // Ignore error if mailbox does not exist or cannot be deleted
  }
  await client.mailboxCreate(mailbox);
}

export async function connectToImap(
  config: ImapConnectionConfig
): Promise<ImapFlow> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
    tls: {
      rejectUnauthorized: config.tls,
    },
  });

  await client.connect();
  return client;
}

interface MailboxInfo {
  messages: number;
  unseen: number;
  recent: number;
}

interface Mailbox {
  name: string;
  path: string;
  children?: Mailbox[];
}

export async function getMailboxList(client: ImapFlow): Promise<string[]> {
  const mailboxes = await client.list("", {
    subscribed: false,
    status: true,
    tree: true,
  });
  return mailboxes.map((mailbox) => mailbox.name);
}

export async function getMailboxTree(client: ImapFlow): Promise<Mailbox[]> {
  const mailboxes = await client.listMailboxes(true);
  return mailboxes;
}

export async function getMailboxInfo(
  client: ImapFlow,
  mailbox: string
): Promise<MailboxInfo> {
  await client.select(mailbox);
  const [mailboxInfo] = await client.fetch("1", {
    messages: true,
    unseen: true,
    recent: true,
  });
  return {
    messages: mailboxInfo.messages,
    unseen: mailboxInfo.unseen,
    recent: mailboxInfo.recent,
  };
}
