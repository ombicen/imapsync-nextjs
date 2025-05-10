'use client';

import * as React from 'react';
import { type DialogProps } from '@radix-ui/react-dialog';
import { Input } from './input';
import { Button } from './button';
import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';

interface SearchDialogProps extends DialogProps {
  onSearch: (query: string) => void;
}

export function SearchDialog({ onSearch, ...props }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <form 
        onSubmit={handleSubmit}
        className="max-h-[85vh] w-full overflow-hidden rounded-md bg-popover text-popover-foreground shadow-lg"
      >
        <div className="flex flex-col p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
