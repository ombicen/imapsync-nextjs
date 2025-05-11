importScripts('https://cdn.jsdelivr.net/npm/imapflow@2.1.0/dist/imap-flow.js');

// Log function that sends logs back to the main thread
function log(message, data) {
  self.postMessage({ 
    type: 'log', 
    data: { message, data, timestamp: new Date().toISOString() } 
  });
}

self.onmessage = async function (event) {
  log('Worker received message', event.data);
  try {
    const { sourceConfig, destinationConfig, syncOptions } = event.data;
    log('Processing sync with configs', { sourceConfig, destinationConfig, syncOptions });
    
    if (!sourceConfig || !destinationConfig) {
      self.postMessage({ type: 'error', data: 'Missing required configuration' });
      return;
    }

    log('Initializing source client');
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

    log('Initializing destination client');
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
      log('Connecting to source server');
      await sourceClient.connect();
      log('Source server connected, logging in');
      await sourceClient.login();
      log('Source login successful');
      
      log('Connecting to destination server');
      await destinationClient.connect();
      log('Destination server connected, logging in');
      await destinationClient.login();
      log('Destination login successful');

      // Get mailbox list from source
      const mailboxes = await sourceClient.listMailboxes();
      const totalMailboxes = mailboxes.length;
      let currentMailbox = 0;

      // Initialize stats
      const stats = {
        totalEmails: 0,
        syncedEmails: 0,
        skippedEmails: 0,
        errors: [],
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
    log('Critical error in worker', error);
    self.postMessage({ 
      type: 'error', 
      data: error && error.message ? error.message : 'Unknown error occurred' 
    });
  }
};
