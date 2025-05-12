"use client";

import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";

interface ConnectionLogProps {
  logs: Array<{ type: "info" | "error" | "success"; message: string }>;
  mailboxes?: Array<{
    name: string;
    path: string;
    children?: Array<{ name: string; path: string }>;
  }>;
}

export function ConnectionLog({ logs, mailboxes }: ConnectionLogProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new logs are added
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const renderFolderTree = (
    folders: Array<{
      name: string;
      path: string;
      children?: Array<{ name: string; path: string }>;
    }>,
    indent = 0
  ) => {
    return (
      <div className="flex flex-col shadow-sm p-5 border border-black/10 rounded-sm bg-white border-radius-md">
        <div className="border-l border-dashed border-black/60">
          {folders.map((folder, index) => (
            <div
              key={index}
              style={{ marginLeft: `${indent * 16}px` }}
              className="text-xs pl-1"
            >
              <span className="font-medium">{folder.name}</span>
              {folder.children && folder.children.length > 0 && (
                <div className="ml-4">
                  {renderFolderTree(folder.children, indent + 1)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4">
      <div className="text-sm font-medium text-muted-foreground mb-2">
        Connection Log
      </div>
      <div
        ref={logContainerRef}
        className="h-64 overflow-y-auto rounded-md border p-3 bg-gray-200"
      >
        {logs.map((log, index) => {
          // Check if this log is a folder structure log
          if (
            log.type === "info" &&
            log.message.startsWith("Folder structure:")
          ) {
            try {
              const folders = JSON.parse(
                log.message.replace("Folder structure:", "").trim()
              );
              return (
                <div key={index} className="mb-2">
                  <div className="text-xs font-semibold mb-1">
                    Folder Structure
                  </div>
                  {renderFolderTree(folders)}
                </div>
              );
            } catch {
              // Fallback to plain text if JSON parse fails
              return (
                <div key={index} className="mb-2">
                  <Badge variant="outline" className="text-xs bg-white">
                    {log.message}
                  </Badge>
                </div>
              );
            }
          }
          // Default log rendering
          return (
            <div key={index} className="mb-2">
              <Badge
                variant={
                  log.type === "error"
                    ? "destructive"
                    : log.type === "success"
                    ? "default"
                    : "outline"
                }
                className={`text-xs${
                  log.type === "info"
                    ? " bg-white text-black border-gray-300"
                    : ""
                }`}
              >
                {log.message}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
