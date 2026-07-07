'use client';
import { useState, useRef, useEffect } from 'react';
import { parseCurl } from '../utils/curlParser';
import { exportToPostman } from '../utils/postmanExport';
import { useStore } from '../store/useStore';
import { Search, Folder, MoreVertical, Plus, ChevronRight, Check } from 'lucide-react';
import clsx from 'clsx';
import KeyValTable from './KeyValTable';
import { KeyVal } from '../store/useStore';

export default function Sidebar() {
  const { collections, setCollections, history, addTab, tabs, environments, setEnvironments, activeEnvironmentId, setActiveEnvironmentId, activeSidebarTab } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingColId, setEditingColId] = useState<number | null>(null);
  const [editColName, setEditColName] = useState('');
  
  const [showCurlModal, setShowCurlModal] = useState(false);
  const [curlString, setCurlString] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

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

  const handleCreateEnvironment = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/environments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Environment' })
      });
      if (res.ok) {
        const newEnv = await res.json();
        const data = await fetch('http://127.0.0.1:8000/api/environments').then(r => r.json());
        setEnvironments(data);
        addTab(`env-${newEnv.id}`, { type: 'environment', envId: newEnv.id, name: newEnv.name, envVars: [] });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEnvironment = async (e: React.MouseEvent, envId: number) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/environments/${envId}`, { method: 'DELETE' });
      if (res.ok) {
        setEnvironments(environments.filter(e => e.id !== envId));
        if (activeEnvironmentId === envId.toString()) {
          useStore.getState().setActiveEnvironmentId(null);
        }
      }
    } catch(e) { console.error(e); }
  };



  const renderContent = () => {
    if (activeSidebarTab === 'collections') {
      const filteredCols = collections.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return (
        <div>
          <div className="flex items-center justify-between px-2 py-1 mb-2 group">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">My Workspace</span>
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setShowCurlModal(true)}
                className="bg-[#FF6C37] text-white text-[10px] px-2 py-0.5 rounded"
              >
                Import cURL
              </button>
              <button 
                onClick={() => setShowAddModal(true)} 
                className="text-gray-400 hover:text-white p-0.5 rounded hover:bg-[#333333]"
                data-testid="add-collection-btn"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          
          {showCurlModal && (
            <div className="px-2 mb-2">
              <textarea 
                autoFocus
                className="w-full p-1.5 text-xs border border-[#333333] bg-[#0d0d0d] rounded outline-none focus:border-[#FF6C37] mb-1 text-gray-300 font-mono h-24"
                placeholder="Paste cURL here..."
                value={curlString}
                onChange={e => setCurlString(e.target.value)}
              />
              <div className="flex space-x-1">
                <button onClick={() => {
                  try {
                    const reqState = parseCurl(curlString);
                    const id = `req-${Date.now()}`;
                    addTab(id, { ...reqState, name: 'Imported cURL' });
                    setShowCurlModal(false);
                    setCurlString('');
                  } catch(e: any) {
                    alert(e.message);
                  }
                }} className="flex-1 bg-[#FF6C37] text-white text-xs py-1 rounded">Import</button>
                <button onClick={() => setShowCurlModal(false)} className="flex-1 bg-[#333333] text-white text-xs py-1 rounded">Cancel</button>
              </div>
            </div>
          )}
          
          {showAddModal && (
            <div className="px-2 mb-2">
              <input 
                type="text"
                autoFocus
                className="w-full p-1.5 text-sm border border-[#333333] bg-[#0d0d0d] rounded outline-none focus:border-[#FF6C37] mb-1 text-white"
                placeholder="Collection Name"
                value={newColName}
                onChange={e => setNewColName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateCollection()}
                data-testid="add-collection-input"
              />
              <div className="flex space-x-1">
                <button onClick={handleCreateCollection} className="flex-1 bg-[#FF6C37] text-white text-xs py-1 rounded" data-testid="save-collection-btn">Save</button>
                <button onClick={() => setShowAddModal(false)} className="flex-1 bg-[#333333] text-white text-xs py-1 rounded">Cancel</button>
              </div>
            </div>
          )}
          {(() => {
            const renderCollection = (col: any, depth: number = 0) => {
              const children = collections.filter(c => c.parent_id === col.id);
              return (
                <div key={col.id} className="mb-1" style={{ paddingLeft: `${depth * 8}px` }}>
                  {editingColId === col.id ? (
                    <div className="px-2 py-1">
                      <input 
                        autoFocus
                        className="w-full p-1 text-sm bg-[#0d0d0d] border border-[#FF6C37] rounded outline-none text-white"
                        value={editColName}
                        onChange={e => setEditColName(e.target.value)}
                        onBlur={() => handleRenameCollection(col.id)}
                        onKeyDown={e => e.key === 'Enter' && handleRenameCollection(col.id)}
                        data-testid="rename-collection-input"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-1 hover:bg-[#2A2A2A] rounded group/col relative text-gray-300">
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
                        <ChevronRight id={`col-icon-${col.id}`} size={14} className="text-gray-500 transition-transform" />
                        <Folder size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate font-medium text-xs">{col.name}</span>
                      </div>
                      <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === col.id ? null : col.id); }}
                          className="opacity-0 group-hover/col:opacity-100 text-gray-400 hover:text-white p-0.5 rounded hover:bg-[#333333]"
                          data-testid={`col-menu-btn-${col.name}`}
                        >
                          <MoreVertical size={14} />
                        </button>
                        {openMenuId === col.id && (
                          <div className="absolute right-0 mt-1 w-32 bg-[#2A2A2A] border border-[#333333] shadow-lg z-50 rounded text-left text-xs py-1 text-white">
                            <div className="px-3 py-1.5 hover:bg-[#353535] cursor-pointer" onClick={(e) => { e.stopPropagation(); setEditingColId(col.id); setEditColName(col.name); setOpenMenuId(null); }}>Rename</div>
                            <div className="px-3 py-1.5 hover:bg-[#353535] cursor-pointer" onClick={async (e) => { 
                              e.stopPropagation(); 
                              setOpenMenuId(null);
                              try {
                                const res = await fetch('http://127.0.0.1:8000/api/collections', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ name: 'New Folder', parent_id: col.id })
                                });
                                if (res.ok) {
                                  const colsRes = await fetch('http://127.0.0.1:8000/api/collections');
                                  setCollections(await colsRes.json());
                                  const el = document.getElementById(`col-reqs-${col.id}`);
                                  if (el) el.classList.remove('hidden');
                                  const icon = document.getElementById(`col-icon-${col.id}`);
                                  if (icon) icon.style.transform = 'rotate(90deg)';
                                }
                              } catch(err) { console.error(err); }
                            }}>Add Folder</div>
                            <div className="px-3 py-1.5 hover:bg-[#353535] cursor-pointer" onClick={async (e) => { 
                              e.stopPropagation(); 
                              setOpenMenuId(null);
                              const el = document.getElementById(`col-reqs-${col.id}`);
                              if (el) el.classList.remove('hidden');
                              const icon = document.getElementById(`col-icon-${col.id}`);
                              if (icon) icon.style.transform = 'rotate(90deg)';
                              try {
                                const res = await fetch('http://127.0.0.1:8000/api/requests', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    name: 'New Request',
                                    method: 'GET',
                                    url: '',
                                    collection_id: col.id,
                                    headers: '[]',
                                    query_params: '[]',
                                    body_type: 'none',
                                    body: '',
                                    auth_type: 'none',
                                    auth_data: '{}'
                                  })
                                });
                                if (res.ok) {
                                  const newReq = await res.json();
                                  const colsRes = await fetch('http://127.0.0.1:8000/api/collections');
                                  setCollections(await colsRes.json());
                                  
                                  const initialData = {
                                    saved_id: newReq.id,
                                    collection_id: col.id,
                                    name: newReq.name,
                                    method: newReq.method,
                                    url: newReq.url,
                                    headers: [],
                                    params: [],
                                    bodyType: newReq.body_type,
                                    body: newReq.body,
                                    authType: newReq.auth_type,
                                    authData: {}
                                  };
                                  addTab(`req-${newReq.id}`, initialData);
                                }
                              } catch(err) { console.error(err); }
                            }}>Add Request</div>
                            <div className="px-3 py-1.5 hover:bg-[#353535] cursor-pointer" onClick={(e) => {
                              e.stopPropagation();
                              exportToPostman(col, collections);
                              setOpenMenuId(null);
                            }}>Export</div>
                            <div className="px-3 py-1.5 hover:bg-red-900/50 text-red-400 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDeleteCollection(col.id); setOpenMenuId(null); }} data-testid={`delete-collection-${col.name}`}>Delete</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div id={`col-reqs-${col.id}`} className="hidden ml-4 pl-2 border-l border-[#333333]">
                    {children.map(c => renderCollection(c, depth + 1))}
                    {col.requests?.map((req: any) => {
                      const openTab = Object.values(tabs).find((t: any) => t.saved_id === req.id) as any;
                      const displayMethod = openTab ? openTab.method : req.method;
                      const displayName = openTab ? (openTab.name || 'Untitled Request') : req.name;
                      return (
                        <div 
                          key={`req-${req.id}`}
                          className="flex items-center space-x-2 p-1 hover:bg-[#2A2A2A] rounded cursor-pointer text-sm text-gray-300"
                          onClick={() => {
                            if (openTab) {
                              useStore.getState().setActiveTab(Object.keys(useStore.getState().tabs).find(k => useStore.getState().tabs[k].saved_id === req.id)!);
                            } else {
                              addTab(`req-${req.id}`, {
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
                              });
                            }
                          }}
                          data-testid={`req-${displayName}`}
                        >
                          <span className={clsx("text-[10px] font-bold w-12 flex-shrink-0", 
                            displayMethod === 'GET' ? 'text-green-500' :
                            displayMethod === 'POST' ? 'text-yellow-500' :
                            displayMethod === 'DELETE' ? 'text-red-500' : 'text-blue-500'
                          )}>
                            {displayMethod}
                          </span>
                          <span className="truncate text-xs">{displayName}</span>
                        </div>
                      );
                    })}
                    {children.length === 0 && (!col.requests || col.requests.length === 0) && (
                      <div className="text-xs text-gray-500 p-1">Empty</div>
                    )}
                  </div>
                </div>
              );
            };

            const rootCols = filteredCols.filter(c => !c.parent_id);
            return rootCols.length === 0 ? (
              <div className="text-sm text-gray-500 px-2">No collections found.</div>
            ) : rootCols.map(c => renderCollection(c, 0));
          })()}
        </div>
      );
    } else if (activeSidebarTab === 'history') {
      const filteredHist = history.filter(h => h.url.toLowerCase().includes(searchQuery.toLowerCase()));
      return (
        <div>
          <div className="flex items-center px-2 py-1 mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent</span>
          </div>
          {filteredHist.length === 0 ? (
            <div className="text-sm text-gray-500 px-2">No history found.</div>
          ) : (
            filteredHist.map(item => (
              <div key={item.id} 
                className="flex items-center space-x-2 p-1.5 hover:bg-[#2A2A2A] rounded cursor-pointer text-sm text-gray-300"
                onClick={() => addTab(`hist-${item.id}`, JSON.parse(item.request_data))}
              >
                <span className={clsx("text-[10px] font-bold w-8 flex-shrink-0", 
                  item.method === 'GET' ? 'text-green-500' :
                  item.method === 'POST' ? 'text-yellow-500' :
                  item.method === 'DELETE' ? 'text-red-500' : 'text-blue-500'
                )}>
                  {item.method}
                </span>
                <span className="truncate flex-1">{item.url}</span>
              </div>
            ))
          )}
        </div>
      );
    } else if (activeSidebarTab === 'environments') {
      const filteredEnvs = environments.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return (
        <div>
          <div className="flex items-center px-2 py-1 mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Environments</span>
          </div>
          {filteredEnvs.length === 0 ? (
            <div className="text-sm text-gray-500 px-2">No environments found.</div>
          ) : (
            filteredEnvs.map(env => (
              <div key={env.id} 
                className={clsx(
                  "flex items-center justify-between p-2 rounded cursor-pointer text-sm group",
                  activeEnvironmentId === env.id.toString() ? "bg-[#2A2A2A]" : "hover:bg-[#202020]"
                )}
                onClick={() => {
                  if (activeEnvironmentId !== env.id.toString()) useStore.getState().setActiveEnvironmentId(env.id.toString());
                  else {
                    addTab(`env-${env.id}`, { type: 'environment', envId: env.id, name: env.name, envVars: env.variables ? JSON.parse(env.variables) : [] });
                  }
                }}
              >
                <div className="flex items-center space-x-2 truncate">
                  <div className={clsx("w-2 h-2 rounded-full", activeEnvironmentId === env.id.toString() ? "bg-green-500" : "bg-gray-600")} />
                  <span className="truncate flex-1 text-gray-300">{env.name}</span>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      addTab(`env-${env.id}`, { type: 'environment', envId: env.id, name: env.name, envVars: env.variables ? JSON.parse(env.variables) : [] });
                    }}
                    className="p-1 hover:bg-[#333333] rounded text-gray-400 hover:text-white"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={(e) => handleDeleteEnvironment(e, env.id)}
                    className="p-1 hover:bg-[#333333] rounded text-gray-400 hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      );
    } else {
      return null;
    }
  };

  return (
    <div className="w-[260px] h-full flex flex-col bg-[#1C1C1C] border-r border-[#333333] flex-shrink-0 text-[#e5e2e1]">
      <div className="flex items-center px-3 py-2 border-b border-[#333333] h-12">
        <div className="flex items-center flex-1 bg-[#131313] rounded border border-[#333333] px-2 py-1">
          <Search size={14} className="text-gray-500 mr-2" />
          <input 
            type="text" 
            placeholder={`Search ${activeSidebarTab}...`}
            className="bg-transparent outline-none text-xs text-white w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {activeSidebarTab === 'collections' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="ml-2 text-gray-400 hover:text-white"
            data-testid="add-collection-btn"
          >
            <Plus size={16} />
          </button>
        )}
        {activeSidebarTab === 'environments' && (
          <button 
            onClick={handleCreateEnvironment}
            className="ml-2 text-gray-400 hover:text-white"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {renderContent()}
      </div>
    </div>
  );
}
