'use client';
import Sidebar from '../components/Sidebar';
import RequestPane from '../components/RequestPane';
import ResponsePane from '../components/ResponsePane';
import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, X } from 'lucide-react';
import clsx from 'clsx';

export default function Home() {
  const { tabs, activeTabId, setActiveTab, closeTab, addTab, updateTab, setCollections, setHistory, setEnvironments } = useStore();
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editTabName, setEditTabName] = useState('');

  useEffect(() => {
    // Fetch initial data
    fetch('http://127.0.0.1:8000/api/collections')
      .then(res => res.json())
      .then(data => setCollections(data))
      .catch(console.error);

    fetch('http://127.0.0.1:8000/api/environments')
      .then(res => res.json())
      .then(data => setEnvironments(data))
      .catch(console.error);

    fetch('http://127.0.0.1:8000/api/history')
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(console.error);
  }, []);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#0d0d0d] text-black dark:text-white font-sans">
      <div className="w-64 h-full flex-shrink-0 border-r border-gray-200 dark:border-gray-800">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs Bar */}
        <div className="flex items-center border-b border-gray-200 dark:border-gray-800 overflow-x-auto bg-gray-50 dark:bg-[#1a1a1a]">
          {Object.keys(tabs).map(tabId => (
            <div 
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={clsx(
                "flex items-center min-w-[120px] max-w-[200px] h-10 px-3 border-r border-gray-200 dark:border-gray-800 cursor-pointer text-sm group",
                activeTabId === tabId ? "bg-white dark:bg-[#0d0d0d] border-t-2 border-t-orange-500" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
              )}
            >
              <span className={clsx("text-xs font-semibold mr-2", 
                tabs[tabId].method === 'GET' ? 'text-green-500' :
                tabs[tabId].method === 'POST' ? 'text-yellow-500' :
                tabs[tabId].method === 'DELETE' ? 'text-red-500' : 'text-blue-500'
              )}>{tabs[tabId].method}</span>
              {editingTabId === tabId ? (
                <input 
                  autoFocus
                  className="flex-1 bg-transparent border-none outline-none text-xs w-24"
                  value={editTabName}
                  onChange={e => setEditTabName(e.target.value)}
                  onBlur={() => { updateTab(tabId, { name: editTabName }); setEditingTabId(null); }}
                  onKeyDown={e => { if (e.key === 'Enter') { updateTab(tabId, { name: editTabName }); setEditingTabId(null); } }}
                />
              ) : (
                <span 
                  className="truncate flex-1" 
                  onDoubleClick={() => { setEditingTabId(tabId); setEditTabName(tabs[tabId].name || 'Untitled Request'); }}
                >
                  {tabs[tabId].name || tabs[tabId].url || 'Untitled Request'}
                </span>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); closeTab(tabId); }}
                className="ml-2 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button 
            onClick={() => addTab(Date.now().toString())}
            className="p-2 text-gray-500 hover:text-black dark:hover:text-white"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Main Content Area */}
        {Object.keys(tabs).length > 0 ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 h-1/2 min-h-[300px] border-b border-gray-200 dark:border-gray-800">
              <RequestPane />
            </div>
            <div className="flex-1 h-1/2 overflow-hidden">
              <ResponsePane />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <p className="mb-4">No active requests</p>
            <button onClick={() => addTab('default')} className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700">Create Request</button>
          </div>
        )}
      </div>
    </main>
  );
}
