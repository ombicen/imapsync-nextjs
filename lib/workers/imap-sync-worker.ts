import { ImapFlow } from 'imapflow';
import { ImapConnectionConfig } from '@/lib/types/imap';

interface WorkerMessage {
  sourceConfig: ImapConnectionConfig;
  destinationConfig: ImapConnectionConfig;
  syncOptions: {
    batchSize: number;
    maxRetries: number;
    retryDelay: number;
    dryRun: boolean;
    skipExistingMessages: boolean;
    calculateStats: boolean;
  };
}

self.onmessage = async function (event: MessageEvent<WorkerMessage>) {
  try {
    const { sourceConfig, destinationConfig, syncOptions } = event.data;
    
    if (!sourceConfig || !destinationConfig) {
      self.postMessage({ type: 'error', data: 'Missing required configuration' });
      return;
    }

    // Connect to source IMAP server
    const sourceClient = new ImapFlow({
      host: sourceConfig.host,
      port: sourceConfig.port,
      secure: sourceConfig.secure,
      tls: sourceConfig.tls ? {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      } : undefined,
      auth: {
        user: sourceConfig.username,
        pass: sourceConfig.password,
      },
    });

    // Connect to destination IMAP server
    const destinationClient = new ImapFlow({
      host: destinationConfig.host,
      port: destinationConfig.port,
      secure: destinationConfig.secure,
      tls: destinationConfig.tls ? {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      } : undefined,
      auth: {
        user: destinationConfig.username,
        pass: destinationConfig.password,
      },
    });

    try {
      // Connect to both servers
      await sourceClient.connect();
      await destinationClient.connect();

      // Select source mailbox
      await sourceClient.select('INBOX');
      
      // Create destination mailbox if it doesn't exist
      try {
        await destinationClient.select('INBOX');
      } catch {
        throw new Error('Failed to select destination mailbox');
      }

      // Get message count
      const sourceInfo = await sourceClient.getMailboxInfo();
      const totalMessages = sourceInfo.messages;
      
      if (!totalMessages) {
        self.postMessage({ type: 'progress', data: { total: 0, current: 0, percentage: 100 } });
        self.postMessage({ type: 'complete', data: { total: 0, copied: 0, skipped: 0, errors: [] } });
        return;
      }

      // Process messages in batches
      const batchSize = syncOptions.batchSize || 10;
      for (let i = 0; i < totalMessages; i += batchSize) {
        const batch = Array(batchSize).fill(null).map((_, j) => i + j + 1);
        
        // Fetch messages
        const messages = await sourceClient.search(['UID', `${i + 1}:${i + batchSize}`]);

        // Copy messages to destination
        for (const uid of messages) {
          try {
            const message = await sourceClient.fetch(uid, {
              bodies: ['HEADER', 'TEXT'],
              struct: true
            });
            
            await destinationClient.append(message.data, {
              mailbox: 'INBOX',
              flags: message.flags
            });
            
            const progress = Math.round((i + batchSize) / totalMessages * 100);
            self.postMessage({ type: 'progress', data: { total: totalMessages, current: i + batchSize, percentage: progress } });
          } catch (error) {
            console.error('Error copying message:', error);
            self.postMessage({ type: 'error', data: { uid, error: error instanceof Error ? error.message : 'Unknown error' } });
          }
        }
      }

      // Get final stats
      const sourceStats = await sourceClient.getMailboxInfo();
      const destinationStats = await destinationClient.getMailboxInfo();

      // Calculate stats
      const stats = {
        total: totalMessages,
        copied: destinationStats.messages,
        skipped: sourceStats.messages - destinationStats.messages,
        errors: []
      };

      self.postMessage({ type: 'complete', data: stats });
      // Send final stats
      self.postMessage({ 
        type: 'stats', 
        data: stats 
      });

      // Send completion message
      self.postMessage({ 
        type: 'complete', 
        data: null 
      });

    } finally {
      // Clean up connections
      try {
        await sourceClient.logout();
      } catch (error) {
        console.error('Error closing source connection:', error);
      }

      try {
        await destinationClient.logout();
      } catch (error) {
        console.error('Error closing destination connection:', error);
      }
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      data: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
};
