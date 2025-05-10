declare module 'imapflow' {
  export interface AppendResponseObject {
    uid: number;
    flags: string[];
    size: number;
  }

  export interface DownloadObject {
    meta: {
      filename: string;
      size: number;
      contentType: string;
    };
    content: NodeJS.ReadableStream;
  }

  export interface FetchQueryObject {
    [key: string]: any;
  }

  export interface SearchObject {
    [key: string]: any;
  }

  export interface IdInfoObject {
    [key: string]: string;
  }

  export class ImapFlow {
    constructor(config: {
      host: string;
      port: number;
      secure?: boolean;
      doSTARTTLS?: boolean;
      servername?: string;
      disableCompression?: boolean;
      auth: {
        user: string;
        pass?: string;
        accessToken?: string;
        loginMethod?: string;
      };
      clientInfo?: IdInfoObject;
      disableAutoIdle?: boolean;
      tls?: {
        rejectUnauthorized?: boolean;
        minVersion?: string;
        minDHSize?: number;
      };
      logger?: boolean | {
        debug: (obj: any) => void;
        info: (obj: any) => void;
        warn: (obj: any) => void;
        error: (obj: any) => void;
      } | {
        info: (obj: any) => void;
        warn: (obj: any) => void;
        error: (obj: any) => void;
      };
      logRaw?: boolean;
      emitLogs?: boolean;
      verifyOnly?: boolean;
      proxy?: string;
      qresync?: boolean;
      maxIdleTime?: number;
      missingIdleCommand?: string;
      disableBinary?: boolean;
      disableAutoEnable?: boolean;
      connectionTimeout?: number;
      greetingTimeout?: number;
      socketTimeout?: number;
    });

    connect(): Promise<void>;
    append(path: string, content: string | Buffer, flags?: string[], idate?: Date): Promise<AppendResponseObject>;
    close(): void;
    list(reference: string, options?: {
      subscribed?: boolean;
      status?: boolean;
      tree?: boolean;
    }): Promise<any[]>;
    listMailboxes(tree?: boolean): Promise<any[]>;
    select(mailbox: string): Promise<any>;
    fetch(range: string | SearchObject, query: FetchQueryObject, options?: {
      uid?: boolean;
      changedSince?: number;
      binary?: boolean;
    }): Promise<any[]>;
    download(range: string, part?: string, options?: {
      uid?: boolean;
      maxBytes?: number;
      chunkSize?: number;
    }): Promise<DownloadObject>;
    downloadMany(range: string, parts: string[], options?: {
      uid?: boolean;
    }): Promise<{ [part: string]: DownloadObject }>;
    logout(): Promise<void>;

    // Properties
    capabilities: string[];
    state: 'disconnected' | 'connected' | 'selected';
    selectedMailbox: string | null;
  }
}
