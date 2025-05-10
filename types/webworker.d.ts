/// <reference types="webworker" />

declare var self: WorkerGlobalScope;

declare function importScripts(...urls: string[]): void;
