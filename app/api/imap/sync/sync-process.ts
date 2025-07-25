import { ImapFlow } from "imapflow";
import { updateProgress, getProgress } from "../shared/progress-store";

// Define interfaces for ImapFlow types
interface ImapMailbox {
  path: string;
  name: string;
  delimiter: string;
  flags?: string[];
  specialUse?: string;
  listed?: boolean;
  subscribed?: boolean;
}

interface ImapMessage {
  uid: number;
  seq?: number;
  flags?: string[];
  envelope?: any;
  bodyStructure?: any;
  source?: Buffer;
}

// Extend ImapFlow with missing methods for TypeScript
interface ExtendedImapFlow extends ImapFlow {
  list(options?: any): Promise<ImapMailbox[]>;
  mailboxOpen(path: string): Promise<any>;
  mailboxCreate(path: string): Promise<any>;
  status(path: string, options?: any): Promise<any>;
  search(query: any, options?: any): Promise<any[]>;
  fetchOne(uid: number, options?: any): Promise<any>;
  append(path: string, content: Buffer): Promise<any>;
}

// Interface for IMAP configuration
interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

// Interface for sync options
interface SyncOptions {
  filters?: {
    startDate?: string;
    endDate?: string;
    folders?: string[];
  };
  maxMessages?: number;
  batchSize?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Perform the synchronization process between two IMAP servers
 */
export async function performSync(
  sessionId: string,
  sourceConfig: ImapConfig,
  destinationConfig: ImapConfig,
  syncOptions?: SyncOptions
): Promise<void> {
  const startTime = new Date();
  let sourceClient: ExtendedImapFlow | null = null;
  let destinationClient: ExtendedImapFlow | null = null;
  let stats: {
    totalMailboxes: number;
    processedMailboxes: number;
    totalEmails: number;
    syncedEmails: number;
    skippedEmails: number;
    errors: string[];
    mailboxes: Array<{
      name: string;
      totalMessages: number;
      syncedMessages: number;
      skippedMessages: number;
    }>;
    startTime: string;
    endTime: string;
    elapsedTimeSeconds: number;
  } = {
    totalMailboxes: 0,
    processedMailboxes: 0,
    totalEmails: 0,
    syncedEmails: 0,
    skippedEmails: 0,
    errors: [],
    mailboxes: [],
    startTime: startTime.toISOString(),
    endTime: "",
    elapsedTimeSeconds: 0,
  };

  try {
    console.log("Starting sync process");

    // Validate the connection configs
    if (
      !sourceConfig.host ||
      !sourceConfig.port ||
      !sourceConfig.username ||
      !sourceConfig.password
    ) {
      throw new Error("Source configuration is incomplete");
    }

    if (
      !destinationConfig.host ||
      !destinationConfig.port ||
      !destinationConfig.username ||
      !destinationConfig.password
    ) {
      throw new Error("Destination configuration is incomplete");
    }

    // Create source ImapFlow client
    sourceClient = new ImapFlow({
      host: sourceConfig.host,
      port: sourceConfig.port,
      secure: sourceConfig.secure || false,
      auth: {
        user: sourceConfig.username,
        pass: sourceConfig.password,
      },
      logger: false,
      disableAutoIdle: true,
    }) as ExtendedImapFlow;

    // Create destination ImapFlow client
    destinationClient = new ImapFlow({
      host: destinationConfig.host,
      port: destinationConfig.port,
      secure: destinationConfig.secure || false,
      auth: {
        user: destinationConfig.username,
        pass: destinationConfig.password,
      },
      logger: false,
      disableAutoIdle: true,
    }) as ExtendedImapFlow;

    // Connect to source server
    await sourceClient.connect();
    console.log("Connected to source server");

    // Connect to destination server
    await destinationClient.connect();
    console.log("Connected to destination server");

    // Get mailbox list from source
    const mailboxes = await sourceClient.list();
    console.log(`Retrieved ${mailboxes.length} mailboxes from source`);

    // Initialize stats
    stats.totalMailboxes = mailboxes.length;

    // Update progress with total mailboxes
    await updateProgress(sessionId, {
      totalMailboxes: mailboxes.length,
      totalMessages: 0, // Will be updated as we process mailboxes
      percentage: 5, // Initial progress after connection
      logs: [
        {
          message: `Found ${mailboxes.length} mailboxes`,
          timestamp: new Date().toISOString(),
        },
      ],
    });
    console.log(
      `Initial progress update: totalMailboxes=${mailboxes.length}, percentage=5`
    );

    // Process mailboxes (limit to 5 for performance)
    const maxMailboxes = Math.min(5, mailboxes.length);
    stats.totalMailboxes = maxMailboxes; // Fix: only count mailboxes actually processed

    // Use batchSize from syncOptions, fallback to 10 if not set
    const batchSize =
      syncOptions?.batchSize && syncOptions.batchSize > 0
        ? syncOptions.batchSize
        : 10;
    const maxRetries = syncOptions?.maxRetries ?? 0;
    const retryDelay = syncOptions?.retryDelay ?? 0;
    const progressUpdateInterval = Math.max(10, batchSize); // Only update every N messages
    let lastProgressUpdate = 0;

    for (let i = 0; i < maxMailboxes; i++) {
      // Check for stop signal before processing each mailbox
      const progress = await getProgress(sessionId);
      if (progress?.shouldStop) {
        await updateProgress(sessionId, {
          logs: [
            {
              message: "Sync stopped by user",
              timestamp: new Date().toISOString(),
            },
          ],
          isComplete: true,
        });
        console.log("Sync stopped by user");
        break;
      }
      const mailbox = mailboxes[i];
      const mailboxName = mailbox.path;

      console.log(`Processing mailbox: ${mailboxName}`);

      // Update progress with current mailbox including stats count
      await updateProgress(sessionId, {
        currentMailbox: mailboxName,
        processedMailboxes: i,
        logs: [
          {
            message: `Processing mailbox: ${mailboxName} (${
              i + 1
            }/${maxMailboxes})`,
            timestamp: new Date().toISOString(), // Fresh timestamp
          },
        ],
      });

      // Create mailbox stats object
      const mailboxStats = {
        name: mailboxName,
        totalMessages: 0,
        syncedMessages: 0,
        skippedMessages: 0,
      };

      try {
        // Select source mailbox
        await sourceClient.mailboxOpen(mailboxName);
        console.log(`Opened source mailbox: ${mailboxName}`);

        // Create destination mailbox if it doesn't exist
        try {
          await destinationClient.mailboxCreate(mailboxName);
          console.log(`Created destination mailbox: ${mailboxName}`);
        } catch (error) {
          console.log(`Destination mailbox ${mailboxName} already exists`);
        }

        // Select destination mailbox
        await destinationClient.mailboxOpen(mailboxName);
        console.log(`Opened destination mailbox: ${mailboxName}`);

        // Get mailbox status to determine message count
        const status = await sourceClient.status(mailboxName, {
          messages: true,
          unseen: true,
        });

        console.log(`Mailbox status for ${mailboxName}:`, status);

        if (status && status.messages) {
          mailboxStats.totalMessages = status.messages;
          stats.totalEmails += status.messages;
          console.log(`Total messages in ${mailboxName}: ${status.messages}`);

          // Update total message count in progress
          await updateProgress(sessionId, {
            totalMessages: stats.totalEmails,
          });
          console.log(`Updated totalMessages: ${stats.totalEmails}`);

          // Use batchSize for message processing
          const maxMessages = Math.min(batchSize, status.messages);

          if (maxMessages > 0) {
            // Get message sequence numbers (most recent first)
            console.log(
              `Searching for messages in ${mailboxName}, limit: ${maxMessages}`
            );

            // Use a different search approach
            let messages = [];
            try {
              // First try with search command
              messages = await sourceClient.search(
                {
                  all: true,
                },
                { limit: maxMessages }
              );

              console.log(
                `Found ${messages.length} messages in ${mailboxName} using search`
              );

              // Fix for numeric message IDs
              if (messages.length > 0 && typeof messages[0] === "number") {
                console.log("Converting numeric message IDs to objects");
                messages = messages.map((id) => ({ seq: id }));
              }
            } catch (searchError) {
              console.error(
                "Search failed, trying alternative approach:",
                searchError
              );

              // If search fails, try to get sequence numbers directly
              const seq = [];
              for (
                let j = 1;
                j <= Math.min(maxMessages, status.messages);
                j++
              ) {
                seq.push(j);
              }
              messages = seq.map((seqNum) => ({ seq: seqNum }));
              console.log(`Using sequence numbers instead: ${seq.join(", ")}`);
            }

            // If no messages in mailbox, just log it and update progress
            if (messages.length === 0) {
              console.log(`No messages in mailbox: ${mailboxName}`);
              // Update mailbox-specific stats
              mailboxStats.totalMessages = 0;
              mailboxStats.syncedMessages = 0;
              mailboxStats.skippedMessages = 0;

              // Update progress for empty mailbox
              await updateProgress(sessionId, {
                currentMailbox: mailboxName,
                processedMailboxes: i,
                percentage: Math.min(
                  95,
                  5 + Math.floor(((i + 1) / maxMailboxes) * 90)
                ),
                logs: [
                  {
                    message: `Completed empty mailbox: ${mailboxName}`,
                    timestamp: new Date().toISOString(),
                  },
                ],
              });
              console.log(`Completed empty mailbox: ${mailboxName}`);

              continue;
            }

            // Process messages in batches
            for (
              let batchStart = 0;
              batchStart < messages.length;
              batchStart += batchSize
            ) {
              const batch = messages.slice(batchStart, batchStart + batchSize);
              for (let msgIndex = 0; msgIndex < batch.length; msgIndex++) {
                // Check for stop signal before processing each message
                const progress = await getProgress(sessionId);
                if (progress?.shouldStop) {
                  await updateProgress(sessionId, {
                    logs: [
                      {
                        message: "Sync stopped by user",
                        timestamp: new Date().toISOString(),
                      },
                    ],
                    isComplete: true,
                  });
                  console.log("Sync stopped by user");
                  break;
                }
                const message = batch[msgIndex];

                // Update message progress
                const totalProcessedMessages =
                  stats.syncedEmails + stats.skippedEmails;

                // Calculate percentage based solely on processed messages / total messages
                // Reserve 5% for initial connection and 5% for final completion
                let percentage = 5; // Start with 5% base

                if (stats.totalEmails > 0) {
                  // Only calculate message progress if we have messages
                  const messageProgress = Math.min(
                    90,
                    Math.floor(
                      (totalProcessedMessages / stats.totalEmails) * 90
                    )
                  );
                  percentage += messageProgress; // 5% base + message progress (up to 90%) = max 95%
                } else {
                  // If no messages, base progress on mailbox count
                  percentage = Math.min(
                    95,
                    5 + Math.floor(((i + 1) / maxMailboxes) * 90)
                  );
                }

                let attempt = 0;
                let success = false;
                while (attempt <= maxRetries && !success) {
                  try {
                    // Fetch message size
                    const idForError = message.seq || message.uid;
                    const sizeCheck = await sourceClient.fetchOne(idForError, {
                      envelope: true,
                      size: true,
                    });
                    console.log(
                      `Fetched message size for ${idForError}: ${
                        sizeCheck?.size || 0
                      } bytes`
                    );

                    if (sizeCheck && sizeCheck.size) {
                      if (sizeCheck.size > 25 * 1024 * 1024) {
                        // 25MB limit
                        throw new Error(
                          `Message too large (${Math.round(
                            sizeCheck.size / 1024 / 1024
                          )}MB)`
                        );
                      }

                      // Fetch the full message with different options
                      const messageData = message.uid
                        ? await sourceClient.fetchOne(message.uid, {
                            source: true,
                            bodyStructure: true,
                          })
                        : await sourceClient.fetchOne(message.seq, {
                            source: true,
                            bodyStructure: true,
                          });

                      if (messageData && messageData.source) {
                        console.log(
                          `Successfully fetched message source (${messageData.source.length} bytes)`
                        );

                        // Append message to destination
                        await destinationClient.append(
                          mailboxName,
                          messageData.source
                        );
                        mailboxStats.syncedMessages++;
                        stats.syncedEmails++;
                        success = true;

                        // Add periodic progress updates for successful transfers (every 5 messages)
                        if (stats.syncedEmails % 5 === 0) {
                          const totalProcessed =
                            stats.syncedEmails + stats.skippedEmails;
                          await updateProgress(sessionId, {
                            processedMessages: totalProcessed,
                            percentage: Math.min(
                              95,
                              5 +
                                Math.floor(
                                  (totalProcessed / stats.totalEmails) * 90
                                )
                            ),
                            logs: [
                              {
                                message: `Successfully synced ${stats.syncedEmails} messages. Progress: ${totalProcessed}/${stats.totalEmails}`,
                                timestamp: new Date().toISOString(), // Fresh timestamp
                              },
                            ],
                          });
                        }

                        console.log(
                          `Successfully appended message to destination`
                        );
                      } else {
                        console.error(
                          "Message data received but source is missing",
                          messageData
                        );
                        throw new Error(
                          "Message source not available in fetch result"
                        );
                      }
                    } else {
                      // Handle zero size gracefully
                      console.warn(
                        `Message size is zero for message ${idForError}, skipping.`
                      );
                      mailboxStats.skippedMessages++;
                      stats.skippedEmails++;

                      const totalProcessed =
                        stats.syncedEmails + stats.skippedEmails;
                      await updateProgress(sessionId, {
                        processedMessages: totalProcessed,
                        percentage: Math.min(
                          95,
                          5 + Math.floor(((i + 1) / maxMailboxes) * 90)
                        ),
                        logs: [
                          {
                            message: `Skipped message with zero size. Progress: ${totalProcessed}/${stats.totalEmails} in ${mailboxName}`,
                            timestamp: new Date().toISOString(), // Fresh timestamp
                          },
                        ],
                      });
                    }
                  } catch (error: any) {
                    attempt++;
                    if (attempt > maxRetries) {
                      mailboxStats.skippedMessages++;
                      stats.skippedEmails++;
                      stats.errors.push(
                        `Error syncing message in ${mailboxName} (${
                          message.seq || message.uid
                        }): ${error.message || "Unknown error"}`
                      );
                    } else {
                      // Wait before retrying
                      if (retryDelay > 0) {
                        await new Promise((resolve) =>
                          setTimeout(resolve, retryDelay)
                        );
                      }
                    }
                  }
                }
                // Throttle progress updates: only update every progressUpdateInterval messages
                if (
                  totalProcessedMessages - lastProgressUpdate >=
                    progressUpdateInterval ||
                  totalProcessedMessages === stats.totalEmails
                ) {
                  lastProgressUpdate = totalProcessedMessages;
                  await updateProgress(sessionId, {
                    processedMessages: totalProcessedMessages,
                    totalMessages: stats.totalEmails,
                    percentage: Math.min(
                      95,
                      5 +
                        Math.floor(
                          (totalProcessedMessages / stats.totalEmails) * 90
                        )
                    ),
                    logs: [
                      {
                        message: `Processing messages: ${totalProcessedMessages}/${stats.totalEmails} (mailbox: ${mailboxName})`,
                        timestamp: new Date().toISOString(),
                      },
                    ],
                  });
                }
              }
            }
          }
        }

        stats.mailboxes.push(mailboxStats);
        stats.processedMailboxes++;
        console.log(`Completed processing mailbox: ${mailboxName}`);
      } catch (error: any) {
        console.error(`Error processing mailbox ${mailboxName}:`, error);
        stats.errors.push(
          `Error processing mailbox ${mailboxName}: ${
            error.message || "Unknown error"
          }`
        );
      }
    }

    // Calculate elapsed time
    const endTime = new Date();
    stats.endTime = endTime.toISOString();
    stats.elapsedTimeSeconds = Math.round(
      (endTime.getTime() - startTime.getTime()) / 1000
    );
    console.log(
      `Sync process elapsed time: ${stats.elapsedTimeSeconds} seconds`
    );

    // Mark progress as complete with detailed statistics
    await updateProgress(sessionId, {
      processedMessages: stats.totalEmails, // Ensure we show all messages as processed
      percentage: 100,
      isComplete: true,
      logs: [
        {
          message: `Sync completed successfully. Synced ${stats.syncedEmails} messages, skipped ${stats.skippedEmails} messages across ${stats.processedMailboxes} mailboxes in ${stats.elapsedTimeSeconds} seconds.`,
          timestamp: new Date().toISOString(),
        },
      ],
      mailboxes: stats.mailboxes,
      startTime: stats.startTime,
      endTime: stats.endTime,
      elapsedTimeSeconds: stats.elapsedTimeSeconds,
    });
    console.log("Final progress update: percentage=100, isComplete=true");

    console.log("Sync process completed");
  } catch (error: any) {
    console.error("IMAP sync error:", error);

    // Update progress with error
    await updateProgress(sessionId, {
      logs: [
        {
          message: `Error: ${error.message || "Unknown error"}`,
          timestamp: new Date().toISOString(),
        },
      ],
      isComplete: true,
    });
  } finally {
    // Cleanup clients
    if (sourceClient) {
      try {
        await sourceClient.logout();
        console.log("Logged out from source server");
      } catch (e) {
        console.error("Error logging out from source client:", e);
      }
    }

    if (destinationClient) {
      try {
        await destinationClient.logout();
        console.log("Logged out from destination server");
      } catch (e) {
        console.error("Error logging out from destination client:", e);
      }
    }
  }
}
