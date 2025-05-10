"use client";

import { ImapConnectionConfig } from "@/lib/types/imap";
import { CheckCircle, ShieldCheck, Mail } from "lucide-react";

interface ImapConnectionStatusProps {
  config: ImapConnectionConfig;
}

export function ImapConnectionStatus({ config }: ImapConnectionStatusProps) {
  return (
    <div className="rounded-md border p-4 bg-muted/40">
      <div className="flex items-start space-x-4">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium leading-none">
            <span className="text-muted-foreground">Host:</span> {config.host}:{config.port}
          </p>
          <p className="text-sm font-medium leading-none mt-2">
            <span className="text-muted-foreground">Username:</span> {config.username}
          </p>
          <p className="text-sm font-medium leading-none mt-2">
            <span className="text-muted-foreground">Mailbox:</span> {config.mailbox}
          </p>
          
          <div className="flex mt-3 gap-4">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-xs">Connected</span>
            </div>
            
            {config.secure && (
              <div className="flex items-center">
                <ShieldCheck className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs">Secure</span>
              </div>
            )}
            
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-xs">IMAP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}