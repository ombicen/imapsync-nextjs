importScripts('https://cdn.jsdelivr.net/npm/imapflow@2.1.0/dist/imap-flow.js');

self.onmessage = async function (event) {
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
      tls: sourceConfig.tls,
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
      tls: destinationConfig.tls,
      auth: {
        user: destinationConfig.username,
        pass: destinationConfig.password,
      },
    });

    try {
      // Connect to both servers
      await sourceClient.connect();
      await sourceClient.login();
      await destinationClient.connect();
      await destinationClient.login();

      // Get mailbox list from source
      const mailboxes = await sourceClient.listMailboxes();
      const totalMailboxes = mailboxes.length;
      let currentMailbox = 0;

      // Initialize stats
      const stats = {
        totalEmails: 0,
        syncedEmails: 0,
        skippedEmails: 0,
        errors: [] as string[],
      };

      // Send initial progress
      self.postMessage({ 
        type: 'progress', 
        data: {
          total: totalMailboxes,
          current: currentMailbox,
          percentage: 0,
          estimatedTimeRemaining: null,
          status: 'running',
        }
      });

      // Sync each mailbox
      for (const mailbox of mailboxes) {
        try {
          currentMailbox++;
          
          // Select mailbox on source
          await sourceClient.selectMailbox(mailbox.name);
          
          // Create mailbox on destination if it doesn't exist
          try {
            await destinationClient.createMailbox(mailbox.name);
          } catch (e) {
            // Mailbox might already exist
          }
          
          // Select mailbox on destination
          await destinationClient.selectMailbox(mailbox.name);
          
          // Get messages from source
          const messages = await sourceClient.search(['ALL']);
          stats.totalEmails += messages.length;
          
          // Sync messages in batches
          for (let i = 0; i < messages.length; i += syncOptions.batchSize) {
            const batch = messages.slice(i, i + syncOptions.batchSize);
            
            for (const message of batch) {
              try {
                // Fetch message from source
                const messageData = await sourceClient.fetch(message, {
                  headers: true,
                  body: true,
                });
                
                // Store message on destination
                await destinationClient.appendMessage(mailbox.name, messageData);
                stats.syncedEmails++;
              } catch (error) {
                stats.errors.push(`Failed to sync message ${message}: ${error.message}`);
                stats.skippedEmails++;
              }
            }
            
            // Update progress
            self.postMessage({ 
              type: 'progress', 
              data: {
                total: totalMailboxes,
                current: currentMailbox,
                percentage: Math.round((currentMailbox / totalMailboxes) * 100),
                estimatedTimeRemaining: null,
                status: 'running',
              }
            });
          }
        } catch (error) {
          stats.errors.push(`Failed to sync mailbox ${mailbox.name}: ${error.message}`);
        }
      }

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
        await sourceClient.destroy();
      } catch (error) {
        console.error('Error closing source connection:', error);
      }

      try {
        await destinationClient.logout();
        await destinationClient.destroy();
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
