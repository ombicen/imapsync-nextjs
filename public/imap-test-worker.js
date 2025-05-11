importScripts('https://cdn.jsdelivr.net/npm/imapflow@2.1.0/dist/imap-flow.js');

// Set a timeout for the connection attempt
const CONNECTION_TIMEOUT = 30000; // Increased to 30 seconds

self.onmessage = async function (event) {
  try {
    const { config } = event.data;
    
    if (!config || !config.host || !config.port || !config.username || !config.password) {
      self.postMessage({
        type: 'error',
        message: 'Missing required configuration parameters'
      });
      return;
    }

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, CONNECTION_TIMEOUT);
    });

    const client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.secure,
      tls: config.tls,
      auth: {
        user: config.username,
        pass: config.password,
      },
      logger: {
        info: () => {},
        warn: () => {},
        error: (msg) => {
          self.postMessage({
            type: 'error',
            message: `IMAP error: ${msg}`
          });
        }
      },
      connectionTimeout: 30000,  // 30 seconds
      greetingTimeout: 15000,   // 15 seconds
      socketTimeout: 60000      // 60 seconds
    });

    try {
      // Race between connection and timeout
      const connectionPromise = client.connect();
      await Promise.race([connectionPromise, timeoutPromise]);
      
      await client.login();
      
      // Test by listing mailboxes
      const mailboxes = await client.listMailboxes();
      
      await client.logout();
      await client.destroy();
      
      self.postMessage({
        type: 'success',
        message: 'Successfully connected to IMAP server',
        mailboxes: mailboxes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      self.postMessage({
        type: 'error',
        message: 'Connection failed: ' + errorMessage
      });
    } finally {
      // Ensure we clean up the connection
      try {
        await client.logout();
        await client.destroy();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred';
    self.postMessage({
      type: 'error',
      message: errorMessage
    });
  }
};