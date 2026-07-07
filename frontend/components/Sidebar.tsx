'use client';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Folder, Clock, Plus, ChevronRight, MoreVertical } from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<'collections' | 'history'>('collections');
  const { collections, history, addTab } = useStore();

  return (
    <div className="w-full h-full flex flex-col bg-[#f9f9f9] dark:bg-[#1c1c1c] border-r border-gray-200 dark:border-gray-800">
      <div className="flex px-4 py-3 border-b border-gray-200 dark:border-gray-800 space-x-4">
        <button 
          onClick={() => setActiveTab('collections')}
          className={clsx("text-sm font-medium pb-1", activeTab === 'collections' ? "border-b-2 border-orange-500 text-black dark:text-white" : "text-gray-500 hover:text-black dark:hover:text-white")}
        >
          Collections
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={clsx("text-sm font-medium pb-1", activeTab === 'history' ? "border-b-2 border-orange-500 text-black dark:text-white" : "text-gray-500 hover:text-black dark:hover:text-white")}
        >
          History
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'collections' ? (
          <div>
            <div className="flex items-center justify-between px-2 py-1 mb-2 group">
              <span className="text-xs font-semibold text-gray-500">My Workspace</span>
              <button className="text-gray-400 hover:text-black dark:hover:text-white"><Plus size={14} /></button>
            </div>
            {collections.length === 0 ? (
              <div className="text-sm text-gray-500 px-2">No collections found.</div>
            ) : (
              collections.map(col => (
                <div key={col.id} className="mb-1">
                  <div className="flex items-center space-x-1 p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded cursor-pointer text-sm">
                    <ChevronRight size={14} className="text-gray-400" />
                    <Folder size={14} className="text-gray-500" />
                    <span className="truncate">{col.name}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center px-2 py-1 mb-2">
              <span className="text-xs font-semibold text-gray-500">Recent</span>
            </div>
            {history.length === 0 ? (
              <div className="text-sm text-gray-500 px-2">No history found.</div>
            ) : (
              history.map(item => (
                <div key={item.id} 
                  className="flex items-center space-x-2 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded cursor-pointer text-sm"
                  onClick={() => addTab(`hist-${item.id}`, JSON.parse(item.request_data))}
                >
                  <span className={clsx("text-xs font-semibold w-10", 
                    item.method === 'GET' ? 'text-green-500' :
                    item.method === 'POST' ? 'text-yellow-500' :
                    item.method === 'DELETE' ? 'text-red-500' : 'text-blue-500'
                  )}>
                    {item.method}
                  </span>
                  <span className="truncate text-gray-700 dark:text-gray-300 flex-1">{item.url}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
