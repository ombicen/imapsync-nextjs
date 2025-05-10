declare module 'imapflow' {
  export class ImapFlow {
    constructor(config: {
      host: string;
      port: number;
      secure?: boolean;
      doSTARTTLS?: boolean;
      tls?: {
        rejectUnauthorized?: boolean;
        minVersion?: string;
      };
      auth: {
        user: string;
        pass: string;
      };
      logger?: {
        info: (obj: any) => void;
        warn: (obj: any) => void;
        error: (obj: any) => void;
      };
      connectionTimeout?: number;
      greetingTimeout?: number;
      socketTimeout?: number;
      verifyOnly?: boolean;
    });

    connect(): Promise<void>;
    listMailboxes(detailed?: boolean): Promise<{
      name: string;
      path: string;
      children?: {
        name: string;
        path: string;
      }[];
    }[]>;
    logout(): Promise<void>;
    close(): void;
    select(mailbox: string): Promise<void>;
    getMailboxInfo(): Promise<{
      messages: number;
      unseen: number;
      recent: number;
    }>;
    search(query: string[]): Promise<number[]>;
    fetch(uid: number, options: {
      bodies: string[];
      struct: boolean;
    }): Promise<any>;
    append(data: any, options: {
      mailbox: string;
      flags: string[];
    }): Promise<void>;
  }
}
