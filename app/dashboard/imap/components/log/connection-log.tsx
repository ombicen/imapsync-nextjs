'use client';

import { useEffect, useState } from 'react';

interface ConnectionLogProps {
  logs: Array<{ type: 'info' | 'error' | 'success'; message: string }>;
}

export function ConnectionLog({ logs }: ConnectionLogProps) {
  const [showLog, setShowLog] = useState(false);

  const logTypes = {
    info: 'bg-blue-50 text-blue-700',
    error: 'bg-red-50 text-red-700',
    success: 'bg-green-50 text-green-700',
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setShowLog(!showLog)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
      >
        Connection Log
        {showLog ? (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        )}
      </button>

      {showLog && (
        <div className="mt-2 p-4 bg-gray-50 rounded-lg">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 p-2 ${logTypes[log.type]}`}
            >
              <span className="font-medium">{log.type.toUpperCase()}</span>
              <span>{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
