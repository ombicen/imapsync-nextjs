'use client';

import { useState } from 'react';
import { ImapSyncOptions } from '@/app/dashboard/imap/types/imap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface SyncOptionsSectionProps {
  syncOptions: ImapSyncOptions;
  onOptionsChange: (options: ImapSyncOptions) => void;
}

export function SyncOptionsSection({ syncOptions, onOptionsChange }: SyncOptionsSectionProps) {
  const [formData, setFormData] = useState<ImapSyncOptions>(syncOptions);

  const handleChange = (field: keyof ImapSyncOptions, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    onOptionsChange({ ...syncOptions, [field]: value });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sync Options</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Batch Size</Label>
              <p className="text-sm text-muted-foreground">
                Number of messages to process at once. Larger batches can be faster but use more memory.
              </p>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[formData.batchSize]}
                  onValueChange={(value) => handleChange('batchSize', value[0])}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <Input
                  type="number"
                  value={formData.batchSize}
                  onChange={(e) => handleChange('batchSize', parseInt(e.target.value))}
                  min={1}
                  max={100}
                  className="w-24"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Max Retries</Label>
              <p className="text-sm text-muted-foreground">
                Number of times to retry failed operations. Higher values can help with temporary issues but may slow down the process.
              </p>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[formData.maxRetries]}
                  onValueChange={(value) => handleChange('maxRetries', value[0])}
                  min={0}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <Input
                  type="number"
                  value={formData.maxRetries}
                  onChange={(e) => handleChange('maxRetries', parseInt(e.target.value))}
                  min={0}
                  max={10}
                  className="w-24"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Retry Delay (ms)</Label>
              <p className="text-sm text-muted-foreground">
                Time to wait between retries. Longer delays can help with rate limiting but slow down recovery.
              </p>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[formData.retryDelay]}
                  onValueChange={(value) => handleChange('retryDelay', value[0])}
                  min={0}
                  max={5000}
                  step={100}
                  className="w-full"
                />
                <Input
                  type="number"
                  value={formData.retryDelay}
                  onChange={(e) => handleChange('retryDelay', parseInt(e.target.value))}
                  min={0}
                  max={5000}
                  className="w-24"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-row items-start space-x-3 space-y-0">
              <div className="flex items-center">
                <Switch
                  checked={formData.dryRun}
                  onCheckedChange={(checked) => handleChange('dryRun', checked)}
                />
              </div>
              <div className="space-y-1 leading-none">
                <Label>Dry Run</Label>
                <p className="text-sm text-muted-foreground">
                  Test the sync process without making any changes
                </p>
              </div>
            </div>

            <div className="flex flex-row items-start space-x-3 space-y-0">
              <div className="flex items-center">
                <Switch
                  checked={formData.skipExistingMessages}
                  onCheckedChange={(checked) => handleChange('skipExistingMessages', checked)}
                />
              </div>
              <div className="space-y-1 leading-none">
                <Label>Skip Existing Messages</Label>
                <p className="text-sm text-muted-foreground">
                  Skip messages that already exist in the destination
                </p>
              </div>
            </div>

            <div className="flex flex-row items-start space-x-3 space-y-0">
              <div className="flex items-center">
                <Switch
                  checked={formData.calculateStats}
                  onCheckedChange={(checked) => handleChange('calculateStats', checked)}
                />
              </div>
              <div className="space-y-1 leading-none">
                <Label>Calculate Stats</Label>
                <p className="text-sm text-muted-foreground">
                  Track and display statistics during the sync process
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
