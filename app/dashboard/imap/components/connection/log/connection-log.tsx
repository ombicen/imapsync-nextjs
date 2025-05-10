'use client';

import { useEffect, useRef } from 'react';
import { Badge } from "@/components/ui/badge";

interface ConnectionLogProps {
  logs: Array<{ type: 'info' | 'error' | 'success'; message: string }>;
}

export function ConnectionLog({ logs }: ConnectionLogProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new logs are added
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="mt-4">
      <div className="text-sm font-medium text-muted-foreground mb-2">Connection Log</div>
      <div 
        ref={logContainerRef}
        className="h-32 overflow-y-auto rounded-md border p-3 bg-muted/20"
      >
        {logs.map((log, index) => (
          <div key={index} className="mb-2">
            <Badge 
              variant={log.type === 'error' ? 'destructive' : log.type === 'success' ? 'default' : 'outline'}
              className="text-xs"
            >
              {log.message}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
