import { NextResponse } from "next/server";
import { ImapConnectionConfig } from "@/lib/types/imap";
import { ImapFlow } from "imapflow";

export async function POST(request: Request) {
  try {
    const { config } = await request.json();
    
    if (!config || !config.host || !config.port || !config.username || !config.password) {
      return NextResponse.json(
        { type: 'error', message: 'Missing required configuration parameters' },
        { status: 400 }
      );
    }

    // Create ImapFlow client with proper configuration
    const client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.secure || config.tls,
      doSTARTTLS: config.secure ? undefined : true, // Only use STARTTLS if not using secure connection
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      },
      auth: {
        user: config.username,
        pass: config.password,
      },
      logger: {
        info: (obj) => {
          console.log('IMAP info:', obj);
        },
        warn: (obj) => {
          console.warn('IMAP warning:', obj);
        },
        error: (obj) => {
          console.error('IMAP error:', obj);
        }
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 5000,     // 5 seconds
      socketTimeout: 30000,      // 30 seconds
      verifyOnly: true
    });

    try {
      // Connect and test
      await client.connect();
      
      // Test by listing mailboxes
      try {
        // First select INBOX to ensure we're in a valid state
        await client.select('INBOX');
        
        // Then try to list mailboxes
        const mailboxes = await client.listMailboxes();
        
        // Clean up gracefully
        await client.logout();
        
        return NextResponse.json({
          type: 'success',
          message: 'Successfully connected to IMAP server',
          mailboxes: mailboxes
        });
      } catch (error) {
        // If listing mailboxes fails, we still consider the connection successful
        try {
          await client.logout();
        } catch (logoutError) {
          // If logout fails, just close the connection
          client.close();
        }
        
        return NextResponse.json({
          type: 'success',
          message: 'Successfully connected to IMAP server (mailbox listing failed)',
          error: error instanceof Error ? error.message : 'Failed to list mailboxes'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      console.error('IMAP connection error:', error);
      return NextResponse.json(
        { type: 'error', message: errorMessage },
        { status: 500 }
      );
    } finally {
      // Ensure we clean up the connection
      try {
        await client.logout();
      } catch (logoutError) {
        // If logout fails, just close the connection
        client.close();
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred';
    return NextResponse.json(
      { type: 'error', message: errorMessage },
      { status: 500 }
    );
  }
}
