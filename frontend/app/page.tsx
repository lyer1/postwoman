'use client';
import ActivityBar from '../components/ActivityBar';
import Sidebar from '../components/Sidebar';
import RequestPane from '../components/RequestPane';
import ResponsePane from '../components/ResponsePane';
import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, X, Search, Cloud, Settings, Terminal, MessageSquare, Trash, CloudLightning, Globe, SquareTerminal } from 'lucide-react';
import clsx from 'clsx';
import EnvironmentPane from '../components/EnvironmentPane';

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
    <main className="flex flex-col h-screen w-screen overflow-hidden bg-[#131313] text-[#e5e2e1] font-sans">
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar />

        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#1C1C1C]">
          {/* Tabs Bar */}
          <div className="flex items-center border-b border-[#333333] overflow-x-auto bg-[#131313] pt-1">
            {Object.keys(tabs).map(tabId => {
              const isActive = activeTabId === tabId;
              return (
                <div 
                  key={tabId}
                  onClick={() => setActiveTab(tabId)}
                  className={clsx(
                    "flex items-center min-w-[120px] max-w-[200px] h-9 px-3 border-r border-[#333333] cursor-pointer text-sm group rounded-t-sm transition-colors",
                    isActive ? "bg-[#1C1C1C] text-white border-t border-t-[#FF6C37]" : "hover:bg-[#2A2A2A] text-gray-400 border-t border-t-transparent"
                  )}
                >
                  {tabs[tabId].type === 'environment' ? (
                    <Globe size={12} className="text-[#FF6C37] mr-2 shrink-0" />
                  ) : (
                    <span className={clsx("text-[10px] font-bold mr-2", 
                      tabs[tabId].method === 'GET' ? 'text-green-500' :
                      tabs[tabId].method === 'POST' ? 'text-yellow-500' :
                      tabs[tabId].method === 'DELETE' ? 'text-red-500' : 'text-blue-500'
                    )}>{tabs[tabId].method}</span>
                  )}
                  {editingTabId === tabId ? (
                    <input 
                      autoFocus
                      className="flex-1 bg-transparent border-none outline-none text-xs w-24 text-white"
                      value={editTabName}
                      onChange={e => setEditTabName(e.target.value)}
                      onBlur={() => { updateTab(tabId, { name: editTabName }); setEditingTabId(null); }}
                      onKeyDown={e => { if (e.key === 'Enter') { updateTab(tabId, { name: editTabName }); setEditingTabId(null); } }}
                    />
                  ) : (
                    <span 
                      className="truncate flex-1 text-xs" 
                      onDoubleClick={() => { setEditingTabId(tabId); setEditTabName(tabs[tabId].name || 'Untitled Request'); }}
                    >
                      {tabs[tabId].name || tabs[tabId].url || 'Untitled Request'}
                    </span>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); closeTab(tabId); }}
                    className={clsx("ml-2 rounded p-0.5", isActive ? "opacity-100 hover:bg-[#333333]" : "opacity-0 group-hover:opacity-100 hover:bg-[#333333]")}
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
            <button 
              onClick={() => addTab(Date.now().toString())}
              className="p-2 text-gray-500 hover:text-white"
              data-testid="add-tab-btn"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Main Stage */}
          {Object.keys(tabs).length > 0 ? (
            activeTabId && tabs[activeTabId]?.type === 'environment' ? (
              <EnvironmentPane />
            ) : (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 h-[45%] min-h-[300px] border-b border-[#333333]">
                  <RequestPane />
                </div>
                <div className="flex-1 h-[55%] overflow-hidden">
                  <ResponsePane />
                </div>
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <p className="mb-4">No active requests</p>
              <button onClick={() => addTab('default')} className="px-4 py-2 bg-[#FF6C37] text-white rounded text-sm hover:bg-[#e65a2a]">Create Request</button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="h-6 bg-[#131313] border-t border-[#333333] flex items-center justify-between px-4 text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 hover:text-white cursor-pointer"><Cloud size={12} /><span>Cloud View</span></div>
          <div className="flex items-center space-x-1 hover:text-white cursor-pointer"><Search size={12} /><span>Find and replace</span></div>
          <div className="flex items-center space-x-1 hover:text-white cursor-pointer"><Terminal size={12} /><span>Console</span></div>
          <div className="flex items-center space-x-1 hover:text-white cursor-pointer"><SquareTerminal size={12} /><span>Terminal</span></div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hover:text-white cursor-pointer">Cookies</div>
          <div className="hover:text-white cursor-pointer">Vault</div>
        </div>
      </div>
    </main>
  );
}
