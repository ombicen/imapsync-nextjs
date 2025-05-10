"use client";

import type { ImapSyncResults } from "@/lib/types/imap";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertCircle, ClockIcon, Database, Mail } from "lucide-react";
import { motion } from "framer-motion";

interface ImapSyncResultsProps {
  results: ImapSyncResults;
}

export function ImapSyncResults({ results }: ImapSyncResultsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {results.message && (
        <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/30 p-3 border border-yellow-200 dark:border-yellow-900">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Dry Run Mode
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                <p>
                  This was a simulation. No emails were actually copied.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="rounded-md p-4 border bg-card">
        <h3 className="font-medium mb-3 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          Sync Complete
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Messages</p>
            <p className="text-lg font-medium flex items-center">
              <Mail className="h-4 w-4 mr-1 text-blue-500" />
              {results.stats.total.toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Size</p>
            <p className="text-lg font-medium flex items-center">
              <Database className="h-4 w-4 mr-1 text-purple-500" />
              {results.stats.total.toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Time Taken</p>
            <p className="text-lg font-medium flex items-center">
              <ClockIcon className="h-4 w-4 mr-1 text-amber-500" />
              {new Date(results.endTime).toLocaleTimeString()}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Messages Copied</p>
            <p className="text-lg font-medium">
              {results.message ? (
                <span className="text-yellow-500">{results.message} (simulated)</span>
              ) : (
                results.stats.copied.toLocaleString()
              )}
            </p>
          </div>
        </div>
        
        {results.stats.errors.length > 0 && (
          <>
            <Separator className="my-3" />
            <div className="text-sm text-destructive flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {results.stats.errors.length} errors occurred
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}