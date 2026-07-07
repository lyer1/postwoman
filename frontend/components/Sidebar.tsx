'use client';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Folder, Plus, ChevronRight, MoreVertical } from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<'collections' | 'history'>('collections');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingColId, setEditingColId] = useState<number | null>(null);
  const [editColName, setEditColName] = useState('');
  const { collections, setCollections, history, addTab } = useStore();

  const handleCreateCollection = async () => {
    if (!newColName) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newColName, user_id: 1 })
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewColName('');
        const data = await fetch('http://127.0.0.1:8000/api/collections').then(r => r.json());
        setCollections(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCollection = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this collection and all its saved requests?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/collections/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await fetch('http://127.0.0.1:8000/api/collections').then(r => r.json());
        setCollections(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [isRenaming, setIsRenaming] = useState(false);

  const handleRenameCollection = async (id: number) => {
    if (!editColName || isRenaming) {
      setEditingColId(null);
      return;
    }
    setIsRenaming(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/collections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editColName, user_id: 1 })
      });
      if (res.ok) {
        const data = await fetch('http://127.0.0.1:8000/api/collections').then(r => r.json());
        setCollections(data);
      }
    } catch (e) {
      console.error(e);
    }
    setEditingColId(null);
    setIsRenaming(false);
  };

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
              <button 
                onClick={() => setShowAddModal(true)}
                className="text-gray-400 hover:text-black dark:hover:text-white"
                data-testid="add-collection-btn"
              >
                <Plus size={14} />
              </button>
            </div>
            
            {showAddModal && (
              <div className="px-2 mb-2">
                <input 
                  type="text"
                  autoFocus
                  className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0d0d0d] rounded outline-none focus:border-orange-500 mb-1"
                  placeholder="Collection Name"
                  value={newColName}
                  onChange={e => setNewColName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateCollection()}
                  data-testid="add-collection-input"
                />
                <div className="flex space-x-1">
                  <button onClick={handleCreateCollection} className="flex-1 bg-orange-500 text-white text-xs py-1 rounded" data-testid="save-collection-btn">Save</button>
                  <button onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-200 dark:bg-gray-700 text-black dark:text-white text-xs py-1 rounded">Cancel</button>
                </div>
              </div>
            )}
            {collections.length === 0 ? (
              <div className="text-sm text-gray-500 px-2">No collections found.</div>
            ) : (
              collections.map(col => (
                <div key={col.id} className="mb-1">
                  {editingColId === col.id ? (
                    <div className="px-2 py-1">
                      <input 
                        autoFocus
                        className="w-full p-1 text-sm bg-white dark:bg-[#0d0d0d] border border-orange-500 rounded outline-none"
                        value={editColName}
                        onChange={e => setEditColName(e.target.value)}
                        onBlur={() => handleRenameCollection(col.id)}
                        onKeyDown={e => e.key === 'Enter' && handleRenameCollection(col.id)}
                        data-testid="rename-collection-input"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded group/col relative">
                      <div 
                        className="flex items-center space-x-1 cursor-pointer text-sm flex-1 overflow-hidden"
                        onClick={() => {
                          const el = document.getElementById(`col-reqs-${col.id}`);
                          if (el) el.classList.toggle('hidden');
                          const icon = document.getElementById(`col-icon-${col.id}`);
                          if (icon) icon.style.transform = el?.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(90deg)';
                        }}
                        data-testid={`collection-${col.name}`}
                      >
                        <ChevronRight id={`col-icon-${col.id}`} size={14} className="text-gray-400 transition-transform" />
                        <Folder size={14} className="text-gray-500 flex-shrink-0" />
                        <span className="truncate font-medium">{col.name}</span>
                      </div>
                      <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === col.id ? null : col.id); }}
                          className="opacity-0 group-hover/col:opacity-100 text-gray-400 hover:text-black dark:hover:text-white p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-700"
                          data-testid={`col-menu-btn-${col.name}`}
                        >
                          <MoreVertical size={14} />
                        </button>
                        {openMenuId === col.id && (
                          <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 shadow-lg z-50 rounded text-left text-xs py-1">
                            <div className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" onClick={(e) => { e.stopPropagation(); setEditingColId(col.id); setEditColName(col.name); setOpenMenuId(null); }}>Rename</div>
                            <div className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" onClick={(e) => { e.stopPropagation(); addTab(Date.now().toString(), { collection_id: col.id, name: 'Untitled Request' }); setOpenMenuId(null); }}>Add Request</div>
                            <div className="px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDeleteCollection(col.id); setOpenMenuId(null); }} data-testid={`delete-collection-${col.name}`}>Delete</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div id={`col-reqs-${col.id}`} className="hidden ml-4 pl-2 border-l border-gray-200 dark:border-gray-700">
                    {(!col.requests || col.requests.length === 0) ? (
                      <div className="text-xs text-gray-400 p-1">Empty</div>
                    ) : (
                      col.requests.map((req: any) => (
                        <div 
                          key={req.id}
                          className="flex items-center space-x-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded cursor-pointer text-sm"
                          onClick={() => {
                            // Populate the tab with saved request data
                            const initialData = {
                              saved_id: req.id,
                              collection_id: col.id,
                              name: req.name,
                              method: req.method,
                              url: req.url,
                              headers: JSON.parse(req.headers || '[]'),
                              params: JSON.parse(req.query_params || '[]'),
                              bodyType: req.body_type,
                              body: req.body,
                              authType: req.auth_type,
                              authData: JSON.parse(req.auth_data || '{}')
                            };
                            addTab(`req-${req.id}`, initialData);
                          }}
                          data-testid={`req-${req.name}`}
                        >
                          <span className={clsx("text-[10px] font-bold w-8 flex-shrink-0", 
                            req.method === 'GET' ? 'text-green-500' :
                            req.method === 'POST' ? 'text-yellow-500' :
                            req.method === 'DELETE' ? 'text-red-500' : 'text-blue-500'
                          )}>
                            {req.method}
                          </span>
                          <span className="truncate text-xs">{req.name}</span>
                        </div>
                      ))
                    )}
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
