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
        accessToken?: string;
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
    list(reference: string, options?: {
      subscribed?: boolean;
      status?: boolean;
    }): Promise<any[]>;
    logout(): Promise<void>;
    close(): void;
  }
}
