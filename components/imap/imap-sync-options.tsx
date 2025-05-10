"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImapSyncOptions as SyncOptionsType } from "@/lib/types/imap";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useEffect } from "react";

const formSchema = z.object({
  dryRun: z.boolean().default(true),
  calculateStats: z.boolean().default(true),
  skipExistingMessages: z.boolean().default(true),
  batchSize: z.number().min(10).max(500).default(100),
});

interface ImapSyncOptionsProps {
  options: SyncOptionsType;
  onChange: (options: SyncOptionsType) => void;
  disabled?: boolean;
}

export function ImapSyncOptions({ options, onChange, disabled = false }: ImapSyncOptionsProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: options,
  });
  
  // Update form when external options change
  useEffect(() => {
    form.reset(options);
  }, [form, options]);
  
  // Watch for form changes and propagate them
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.dryRun !== undefined 
          && value.calculateStats !== undefined 
          && value.skipExistingMessages !== undefined
          && value.batchSize !== undefined) {
        onChange(value as SyncOptionsType);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, onChange]);
  
  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormField
          control={form.control}
          name="dryRun"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Dry Run</FormLabel>
                <FormDescription>
                  Simulate the sync without copying any messages
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="calculateStats"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Calculate Statistics</FormLabel>
                <FormDescription>
                  Calculate total messages and mailbox size before syncing
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="skipExistingMessages"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Skip Existing Messages</FormLabel>
                <FormDescription>
                  Skip messages that already exist in the destination
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="batchSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Batch Size: {field.value}</FormLabel>
              <FormControl>
                <Slider
                  value={[field.value]}
                  min={10}
                  max={500}
                  step={10}
                  onValueChange={(value) => field.onChange(value[0])}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                Number of messages to process in each batch
              </FormDescription>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}