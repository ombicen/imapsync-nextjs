'use client';

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImapConfigForms } from "@/components/imap/imap-config-forms";
import { ImapSyncOptions } from "@/components/imap/imap-sync-options";
import { ImapSyncResults } from "@/components/imap/imap-sync-results";
import { ImapSyncProgress } from "@/components/imap/imap-sync-progress";
import { ImapConnectionStatus } from "@/components/imap/imap-connection-status";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  RefreshCwIcon,
  PlayIcon,
  PauseIcon, 
  StopCircleIcon 
} from "lucide-react";
import { 
  ImapSyncState, 
  ImapConnectionConfig, 
  ImapSyncOptions as SyncOptionsType,
  SyncProgress, 
  SyncResults 
} from "@/lib/types/imap";

export function ImapSyncContainer() {
  const [sourceConfig, setSourceConfig] = useState<ImapConnectionConfig | null>(null);
  const [destinationConfig, setDestinationConfig] = useState<ImapConnectionConfig | null>(null);
  const [syncOptions, setSyncOptions] = useState<SyncOptionsType>({
    dryRun: true,
    calculateStats: true,
    skipExistingMessages: true,
    batchSize: 100,
  });
  const [syncState, setSyncState] = useState<ImapSyncState>("idle");
  const [showSourceForm, setShowSourceForm] = useState(true);
  const [showDestinationForm, setShowDestinationForm] = useState(true);
  const [progress, setProgress] = useState<SyncProgress>({
    total: 0,
    current: 0,
    percentage: 0,
    estimatedTimeRemaining: null,
    status: "waiting",
  });
  const [stats, setStats] = useState<SyncResults | null>(null);
  
  const handleSourceConfigSubmit = (config: ImapConnectionConfig) => {
    setSourceConfig(config);
    setShowSourceForm(false);
    toast({
      title: "Source configuration saved",
      description: `Connected to ${config.host} as ${config.username}`,
    });
  };
  
  const handleDestinationConfigSubmit = (config: ImapConnectionConfig) => {
    setDestinationConfig(config);
    setShowDestinationForm(false);
    toast({
      title: "Destination configuration saved",
      description: `Connected to ${config.host} as ${config.username}`,
    });
  };
  
  const handleSyncOptionsChange = (options: SyncOptionsType) => {
    setSyncOptions(options);
  };
  
  const handleStartSync = () => {
    if (!sourceConfig || !destinationConfig) {
      toast({
        title: "Configuration incomplete",
        description: "Please set both source and destination configurations",
        variant: "destructive",
      });
      return;
    }
    
    setSyncState("running");
    
    // Simulate progress updates
    const totalEmails = 250; // In a real app, this would come from the IMAP server
    setProgress({
      total: totalEmails,
      current: 0,
      percentage: 0,
      estimatedTimeRemaining: "about 5 minutes",
      status: "connecting",
    });
    
    // Simulate a sync process
    let currentEmail = 0;
    const interval = setInterval(() => {
      if (currentEmail >= totalEmails) {
        clearInterval(interval);
        setSyncState("completed");
        setProgress({
          total: totalEmails,
          current: totalEmails,
          percentage: 100,
          estimatedTimeRemaining: null,
          status: "completed",
        });
        setStats({
          totalMessages: totalEmails,
          totalSize: "125.4 MB",
          messageCopied: syncOptions.dryRun ? 0 : totalEmails,
          messagesFailed: 0,
          timeTaken: "4m 32s",
          dryRun: syncOptions.dryRun,
        });
        return;
      }
      
      currentEmail += Math.floor(Math.random() * 10) + 1;
      currentEmail = Math.min(currentEmail, totalEmails);
      const percentage = Math.floor((currentEmail / totalEmails) * 100);
      
      // Calculate remaining time based on progress
      const remaining = totalEmails - currentEmail;
      const estimatedSeconds = remaining * 0.2; // Assume 5 emails per second
      let estimatedTimeRemaining = "";
      
      if (estimatedSeconds > 60) {
        estimatedTimeRemaining = `about ${Math.ceil(estimatedSeconds / 60)} minutes`;
      } else {
        estimatedTimeRemaining = `${Math.ceil(estimatedSeconds)} seconds`;
      }
      
      setProgress({
        total: totalEmails,
        current: currentEmail,
        percentage,
        estimatedTimeRemaining,
        status: currentEmail < totalEmails / 2 ? "copying" : "finalizing",
      });
    }, 200);
    
    return () => clearInterval(interval);
  };
  
  const handlePauseSync = () => {
    setSyncState("paused");
    toast({
      title: "Sync paused",
      description: "You can resume the sync operation at any time",
    });
  };
  
  const handleResumeSync = () => {
    setSyncState("running");
    toast({
      title: "Sync resumed",
      description: "Continuing the sync operation",
    });
  };
  
  const handleStopSync = () => {
    setSyncState("idle");
    setProgress({
      total: 0,
      current: 0,
      percentage: 0,
      estimatedTimeRemaining: null,
      status: "waiting",
    });
    toast({
      title: "Sync stopped",
      description: "The sync operation has been cancelled",
      variant: "destructive",
    });
  };
  
  const handleReset = () => {
    setSyncState("idle");
    setProgress({
      total: 0,
      current: 0,
      percentage: 0,
      estimatedTimeRemaining: null,
      status: "waiting",
    });
    setStats(null);
    setShowSourceForm(true);
    setShowDestinationForm(true);
  };
  
  const isConfigComplete = sourceConfig && destinationConfig;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="flex-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  Source
                  {sourceConfig && (
                    <Badge variant="outline" className="ml-2">
                      {sourceConfig.host}
                    </Badge>
                  )}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSourceForm(!showSourceForm)}
                  disabled={syncState === "running"}
                >
                  {showSourceForm ? (
                    <ChevronUpIcon className="h-4 w-4" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <AnimatePresence>
                {showSourceForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ImapConfigForms
                      type="source"
                      onSubmit={handleSourceConfigSubmit}
                      disabled={syncState === "running"}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {sourceConfig && !showSourceForm && (
                <ImapConnectionStatus config={sourceConfig} />
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  Destination
                  {destinationConfig && (
                    <Badge variant="outline" className="ml-2">
                      {destinationConfig.host}
                    </Badge>
                  )}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDestinationForm(!showDestinationForm)}
                  disabled={syncState === "running"}
                >
                  {showDestinationForm ? (
                    <ChevronUpIcon className="h-4 w-4" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <AnimatePresence>
                {showDestinationForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ImapConfigForms
                      type="destination"
                      onSubmit={handleDestinationConfigSubmit}
                      disabled={syncState === "running"}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {destinationConfig && !showDestinationForm && (
                <ImapConnectionStatus config={destinationConfig} />
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="flex-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Sync Options</h2>
              <ImapSyncOptions
                options={syncOptions}
                onChange={handleSyncOptionsChange}
                disabled={syncState === "running"}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Sync Status</h2>
              {syncState === "idle" && !stats && (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    Configure both IMAP servers and start the sync process
                  </p>
                  <Button
                    onClick={handleStartSync}
                    disabled={!isConfigComplete}
                    className="w-full"
                  >
                    <PlayIcon className="mr-2 h-4 w-4" />
                    Start Sync {syncOptions.dryRun && "(Dry Run)"}
                  </Button>
                </div>
              )}
              
              {syncState === "running" && (
                <div className="space-y-4">
                  <ImapSyncProgress progress={progress} />
                  <div className="flex gap-2">
                    <Button onClick={handlePauseSync} variant="outline" className="flex-1">
                      <PauseIcon className="mr-2 h-4 w-4" />
                      Pause
                    </Button>
                    <Button onClick={handleStopSync} variant="destructive" className="flex-1">
                      <StopCircleIcon className="mr-2 h-4 w-4" />
                      Stop
                    </Button>
                  </div>
                </div>
              )}
              
              {syncState === "paused" && (
                <div className="space-y-4">
                  <ImapSyncProgress progress={progress} />
                  <div className="flex gap-2">
                    <Button onClick={handleResumeSync} variant="outline" className="flex-1">
                      <PlayIcon className="mr-2 h-4 w-4" />
                      Resume
                    </Button>
                    <Button onClick={handleStopSync} variant="destructive" className="flex-1">
                      <StopCircleIcon className="mr-2 h-4 w-4" />
                      Stop
                    </Button>
                  </div>
                </div>
              )}
              
              {syncState === "completed" && stats && (
                <div className="space-y-4">
                  <ImapSyncResults results={stats} />
                  <Button onClick={handleReset} className="w-full">
                    <RefreshCwIcon className="mr-2 h-4 w-4" />
                    Start New Sync
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}