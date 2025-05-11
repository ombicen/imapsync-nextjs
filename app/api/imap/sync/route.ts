import { NextResponse } from "next/server";
import { ImapFlow } from "imapflow";

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

export async function POST(request: Request) {
  const startTime = new Date();
  
  try {
    const { sourceConfig, destinationConfig, syncOptions } = await request.json();
    
    if (!sourceConfig || !destinationConfig) {
      return NextResponse.json(
        { type: 'error', message: 'Missing required configuration parameters' },
        { status: 400 }
      );
    }

    // Validate the connection configs
    if (!sourceConfig.host || !sourceConfig.port || !sourceConfig.username || !sourceConfig.password) {
      return NextResponse.json(
        { type: 'error', message: 'Source configuration is incomplete' },
        { status: 400 }
      );
    }

    if (!destinationConfig.host || !destinationConfig.port || !destinationConfig.username || !destinationConfig.password) {
      return NextResponse.json(
        { type: 'error', message: 'Destination configuration is incomplete' },
        { status: 400 }
      );
    }

    // Create source ImapFlow client
    const sourceClient = new ImapFlow({ 
      host: sourceConfig.host,
      port: sourceConfig.port,
      secure: sourceConfig.secure || false,
      auth: {
        user: sourceConfig.username,
        pass: sourceConfig.password,
      },
      logger: false,
      disableAutoIdle: true
    });

    // Create destination ImapFlow client
    const destinationClient = new ImapFlow({
      host: destinationConfig.host,
      port: destinationConfig.port,
      secure: destinationConfig.secure || false,
      auth: {
        user: destinationConfig.username,
        pass: destinationConfig.password,
      },
      logger: false,
      disableAutoIdle: true
    });

    // Initialize stats
    const stats = {
      totalMailboxes: 0,
      processedMailboxes: 0,
      totalEmails: 0,
      syncedEmails: 0,
      skippedEmails: 0,
      errors: [] as string[],
      mailboxes: [] as Array<{
        name: string;
        totalMessages: number;
        syncedMessages: number;
        skippedMessages: number;
      }>,
      startTime: startTime.toISOString(),
      endTime: '',
      elapsedTimeSeconds: 0
    };

    try {
      // Connect to source server
      await sourceClient.connect();
      console.log('Connected to source server');
      
      // Connect to destination server
      await destinationClient.connect();
      console.log('Connected to destination server');

      // Get mailbox list from source
      const mailboxes = await (sourceClient as ExtendedImapFlow).list();
      stats.totalMailboxes = mailboxes.length;
      
      // Process mailboxes (limit to 5 for performance)
      const maxMailboxes = Math.min(5, mailboxes.length);
      
      for (let i = 0; i < maxMailboxes; i++) {
        const mailbox = mailboxes[i];
        const mailboxName = mailbox.path;
        
        console.log(`Processing mailbox: ${mailboxName}`);
        
        // Create mailbox stats object
        const mailboxStats = {
          name: mailboxName,
          totalMessages: 0,
          syncedMessages: 0,
          skippedMessages: 0
        };
        
        try {
          // Select source mailbox
          await (sourceClient as ExtendedImapFlow).mailboxOpen(mailboxName);
          
          // Create destination mailbox if it doesn't exist
          try {
            await (destinationClient as ExtendedImapFlow).mailboxCreate(mailboxName);
          } catch (error) {
            // Mailbox might already exist, which is fine
          }
          
          // Select destination mailbox
          await (destinationClient as ExtendedImapFlow).mailboxOpen(mailboxName);
          
          // Get message count
          console.log(`Getting status for mailbox: ${mailboxName}`);
          const status = await (sourceClient as ExtendedImapFlow).status(mailboxName, {
            messages: true,
            unseen: true
          });
          
          console.log(`Mailbox status:`, status);
          
          if (status && status.messages) {
            mailboxStats.totalMessages = status.messages;
            stats.totalEmails += status.messages;
            
            // Limit to 10 messages per mailbox for performance
            const maxMessages = Math.min(10, status.messages);
            
            if (maxMessages > 0) {
              // Get message sequence numbers (most recent first)
              console.log(`Searching for messages in ${mailboxName}, limit: ${maxMessages}`);
              
              // Use a different search approach
              let messages = [];
              try {
                // First try with search command
                messages = await (sourceClient as ExtendedImapFlow).search({
                  all: true
                }, { limit: maxMessages });
                
                console.log(`Found ${messages.length} messages in ${mailboxName} using search`);
                console.log('First message:', messages.length > 0 ? JSON.stringify(messages[0]) : 'none');
                
                // Fix for numeric message IDs
                if (messages.length > 0 && typeof messages[0] === 'number') {
                  console.log('Converting numeric message IDs to objects');
                  messages = messages.map(id => ({ seq: id }));
                }
              } catch (searchError) {
                console.error('Search failed, trying alternative approach:', searchError);
                
                // If search fails, try to get sequence numbers directly
                const seq = [];
                for (let i = 1; i <= Math.min(maxMessages, status.messages); i++) {
                  seq.push(i);
                }
                messages = seq.map(seqNum => ({ seq: seqNum }));
                console.log(`Using sequence numbers instead: ${seq.join(', ')}`);
              }
              
              // Log the message structure
              if (messages.length > 0) {
                console.log('Message structure example:', JSON.stringify(messages[0]));
              }
              
              // Process messages
              for (const message of messages) {
                // Determine if we're using UID or sequence number - defined outside try block
                const useUid = typeof message.uid !== 'undefined';
                const messageId = useUid ? message.uid : message.seq;
                const idType = useUid ? 'UID' : 'sequence number';
                const idForError = useUid ? `UID ${message.uid}` : `sequence ${message.seq}`;
                
                try {
                  console.log(`Fetching message ${idType} ${messageId} from ${mailboxName}`);
                  
                  // First try to get just the size to check if it's reasonable
                  const sizeCheck = useUid 
                    ? await (sourceClient as ExtendedImapFlow).fetchOne(message.uid, { size: true })
                    : await (sourceClient as ExtendedImapFlow).fetchOne(message.seq, { size: true });
                  
                  if (sizeCheck && sizeCheck.size) {
                    console.log(`Message size: ${sizeCheck.size} bytes`);
                    
                    // Skip very large messages (over 5MB)
                    if (sizeCheck.size > 5 * 1024 * 1024) {
                      throw new Error(`Message too large (${Math.round(sizeCheck.size / 1024 / 1024)}MB)`);
                    }
                    
                    // Fetch the full message with different options
                    const messageData = useUid
                      ? await (sourceClient as ExtendedImapFlow).fetchOne(message.uid, {
                          source: true,
                          bodyStructure: true
                        })
                      : await (sourceClient as ExtendedImapFlow).fetchOne(message.seq, {
                          source: true,
                          bodyStructure: true
                        });
                    
                    if (messageData && messageData.source) {
                      console.log(`Successfully fetched message source (${messageData.source.length} bytes)`);
                      
                      // Append message to destination
                      await (destinationClient as ExtendedImapFlow).append(mailboxName, messageData.source);
                      mailboxStats.syncedMessages++;
                      stats.syncedEmails++;
                      console.log(`Successfully appended message to destination`);
                    } else {
                      console.error('Message data received but source is missing', messageData);
                      throw new Error('Message source not available in fetch result');
                    }
                  } else {
                    console.error('Size check failed', sizeCheck);
                    throw new Error('Failed to check message size');
                  }
                } catch (error: any) {
                  console.error(`Error syncing message ${idForError}:`, error);
                  mailboxStats.skippedMessages++;
                  stats.skippedEmails++;
                  stats.errors.push(`Error syncing message in ${mailboxName} (${idForError}): ${error.message || 'Unknown error'}`);
                }
              }
            }
          }
          
          stats.mailboxes.push(mailboxStats);
          stats.processedMailboxes++;
          
        } catch (error: any) {
          console.error(`Error processing mailbox ${mailboxName}:`, error);
          stats.errors.push(`Error processing mailbox ${mailboxName}: ${error.message || 'Unknown error'}`);
        }
      }
      
      // Calculate elapsed time
      const endTime = new Date();
      stats.endTime = endTime.toISOString();
      stats.elapsedTimeSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
      
      // Close connections
      await sourceClient.logout();
      await destinationClient.logout();
      
      return NextResponse.json({
        type: 'success',
        message: 'IMAP sync completed successfully',
        stats
      });
    } catch (error: any) {
      console.error('IMAP sync error:', error);
      
      // Close connections if they're open
      try { await sourceClient.logout(); } catch (e) {}
      try { await destinationClient.logout(); } catch (e) {}
      
      return NextResponse.json(
        { 
          type: 'error', 
          message: error?.message || 'IMAP sync failed' 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
      ? error 
      : 'Internal server error';
    
    console.error('IMAP sync error:', error);
    
    return NextResponse.json(
      { type: 'error', message: errorMessage },
      { status: 500 }
    );
  }
}
