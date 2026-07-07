'use client';
import { useStore } from '../store/useStore';
import clsx from 'clsx';
import { useState } from 'react';

export default function ResponsePane() {
  const { tabs, activeTabId } = useStore();
  const [view, setView] = useState<'Pretty' | 'Raw'>('Pretty');
  
  if (!activeTabId || !tabs[activeTabId]) return null;
  const req = tabs[activeTabId];

  if (!req.response) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#0d0d0d] border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          Enter the URL and click Send to get a response
        </div>
      </div>
    );
  }

  const { status, time, size, headers, body, error } = req.response;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0d0d0d] border-t border-gray-200 dark:border-gray-800 flex-1">
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-800">
        <div className="flex space-x-4">
          <button onClick={() => setView('Pretty')} className={clsx("text-sm font-medium px-2 py-1 rounded", view === 'Pretty' ? "bg-gray-100 dark:bg-gray-800 text-black dark:text-white" : "text-gray-500 hover:text-black dark:hover:text-white")}>Pretty</button>
          <button onClick={() => setView('Raw')} className={clsx("text-sm font-medium px-2 py-1 rounded", view === 'Raw' ? "bg-gray-100 dark:bg-gray-800 text-black dark:text-white" : "text-gray-500 hover:text-black dark:hover:text-white")}>Raw</button>
        </div>
        
        {error ? (
          <div className="text-red-500 text-sm font-semibold flex space-x-3">
            <span>Error</span>
          </div>
        ) : (
          <div className="flex space-x-4 text-xs font-semibold text-gray-600 dark:text-gray-400">
            <span>Status: <span className={clsx(status >= 200 && status < 300 ? "text-green-500" : "text-red-500")}>{status}</span></span>
            <span>Time: <span className="text-green-500">{time} ms</span></span>
            <span>Size: <span className="text-green-500">{size} B</span></span>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-[#151515] text-sm font-mono text-gray-800 dark:text-gray-300">
        {error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <pre className="whitespace-pre-wrap break-all">
            {view === 'Pretty' ? (typeof body === 'object' ? JSON.stringify(body, null, 2) : body) : (typeof body === 'object' ? JSON.stringify(body) : body)}
          </pre>
        )}
      </div>
    </div>
  );
}
