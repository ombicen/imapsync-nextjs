// This hook is no longer needed as the application uses EventSource for SSE
// Consider removing this file if not used elsewhere

// import { useState, useEffect, useRef, useCallback } from 'react';

// interface SSEOptions {
//   onProgress?: (data: any) => void;
//   onComplete?: (data: any) => void;
//   onError?: (error: string) => void;
// }

// Polling-based implementation that works with Next.js static exports
// const useSSE = (url: string, options: SSEOptions = {}) => {
//   const [isConnected, setIsConnected] = useState(false);
//   const [messages, setMessages] = useState<any[]>([]); // Array to store messages
//   const [error, setError] = useState<string | null>(null);
//   const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
//   const abortControllerRef = useRef<AbortController | null>(null);

//   // Function to poll the progress endpoint
//   const pollProgress = useCallback(async () => {
//     if (!url) return;
    
//     try {
//       // Create a new AbortController for this request
//       if (abortControllerRef.current) {
//         abortControllerRef.current.abort();
//       }
//       abortControllerRef.current = new AbortController();
      
//       console.log('Polling progress endpoint:', url);
      
//       const response = await fetch(url, {
//         method: 'GET',
//         headers: {
//           'Cache-Control': 'no-cache',
//         },
//         signal: abortControllerRef.current.signal
//       });
      
//       if (!response.ok) {
//         throw new Error(`Server responded with ${response.status}`);
//       }
      
//       const data = await response.json();
//       console.log('Received progress data:', data);
      
//       // Process the data
//       if (data) {
//         // Add to messages
//         setMessages(prev => [...prev, data]);
        
//         // Call the appropriate callback based on data state
//         if (data.isComplete) {
//           // Handle completion
//           if (options.onComplete) {
//             options.onComplete(data);
//           }
          
//           // Stop polling when complete
//           if (pollingIntervalRef.current) {
//             clearInterval(pollingIntervalRef.current);
//             pollingIntervalRef.current = null;
//           }
          
//           setIsConnected(false);
//         } else {
//           // Handle progress update
//           if (options.onProgress) {
//             options.onProgress(data);
//           }
          
//           setIsConnected(true);
//         }
//       }
//     } catch (err: any) { // Type assertion for error handling
//       if (err.name !== 'AbortError') {
//         console.error('Error polling progress endpoint:', err);
//         setError(err.message || 'Failed to connect to server');
        
//         if (options.onError) {
//           options.onError(err.message || 'Failed to connect to server');
//         }
//       }
//     }
//   }, [url, options]);

//   // Start/stop polling when URL changes
//   useEffect(() => {
//     if (!url) {
//       // Clean up if URL is empty
//       if (pollingIntervalRef.current) {
//         clearInterval(pollingIntervalRef.current);
//         pollingIntervalRef.current = null;
//       }
//       setIsConnected(false);
//       return;
//     }
    
//     // Start with an immediate poll
//     pollProgress();
    
//     // Then set up interval for regular polling
//     pollingIntervalRef.current = setInterval(pollProgress, 1000); // Poll every second
    
//     return () => {
//       // Clean up on unmount or URL change
//       if (pollingIntervalRef.current) {
//         clearInterval(pollingIntervalRef.current);
//         pollingIntervalRef.current = null;
//       }
      
//       if (abortControllerRef.current) {
//         abortControllerRef.current.abort();
//         abortControllerRef.current = null;
//       }
//     };
//   }, [url, pollProgress]);

//   // Disconnect function to stop polling
//   const disconnect = useCallback(() => {
//     if (pollingIntervalRef.current) {
//       clearInterval(pollingIntervalRef.current);
//       pollingIntervalRef.current = null;
//     }
    
//     if (abortControllerRef.current) {
//       abortControllerRef.current.abort();
//       abortControllerRef.current = null;
//     }
    
//     setIsConnected(false);
//   }, []);

//   return { isConnected, messages, error, disconnect };
// };

// export default useSSE;
