"use client";

import { Progress } from "@/components/ui/progress";
import { SyncProgress } from "@/lib/types/imap";
import { motion } from "framer-motion";

interface ImapSyncProgressProps {
  progress: SyncProgress;
}

export function ImapSyncProgress({ progress }: ImapSyncProgressProps) {
  const getStatusColor = () => {
    switch (progress.status) {
      case "connecting":
        return "text-yellow-500 dark:text-yellow-400";
      case "copying":
        return "text-blue-500 dark:text-blue-400";
      case "finalizing":
        return "text-purple-500 dark:text-purple-400";
      case "completed":
        return "text-green-500 dark:text-green-400";
      default:
        return "text-muted-foreground";
    }
  };
  
  const getStatusText = () => {
    switch (progress.status) {
      case "connecting":
        return "Connecting to servers...";
      case "copying":
        return "Copying messages...";
      case "finalizing":
        return "Finalizing sync...";
      case "completed":
        return "Sync completed";
      default:
        return "Waiting to start";
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className={`text-sm font-medium ${getStatusColor()}`}>{getStatusText()}</p>
        <span className="text-sm font-medium">{progress.percentage}%</span>
      </div>
      
      <Progress value={progress.percentage} className="h-2" />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {progress.current} / {progress.total} messages
        </span>
        {progress.estimatedTimeRemaining && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {progress.estimatedTimeRemaining} remaining
          </motion.span>
        )}
      </div>
    </div>
  );
}