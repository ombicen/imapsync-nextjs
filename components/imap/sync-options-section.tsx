'use client';

import { Card, CardContent } from "@/components/ui/card";
import type { ImapSyncOptions } from "@/lib/types/imap";
import { ImapSyncOptions as ImapSyncOptionsComponent } from "./imap-sync-options";

interface SyncOptionsSectionProps {
  options: ImapSyncOptions;
  onChange: (options: ImapSyncOptions) => void;
  disabled?: boolean;
}

export function SyncOptionsSection({
  options,
  onChange,
  disabled = false,
}: SyncOptionsSectionProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold mb-4">Sync Options</h2>
        <ImapSyncOptionsComponent
          options={options}
          onChange={onChange}
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}
