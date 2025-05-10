import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Error - IMAP Sync Dashboard',
  description: 'An error occurred while loading the IMAP sync dashboard',
};

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Error</h1>
      <div className="space-y-4">
        <p className="text-lg">Something went wrong while loading the IMAP sync dashboard.</p>
        <p className="text-red-500">Error: {error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
