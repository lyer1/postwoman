'use client';
import { useStore, KeyVal } from '../store/useStore';
import { Play, Plus, Trash2, Save, ChevronDown, Code, Wand2 } from 'lucide-react';
import clsx from 'clsx';
import KeyValTable from './KeyValTable';
import { useState, useMemo } from 'react';
import { generateCurl, generateFetch, generatePython } from '../utils/codeGenerators';
import { parseCurl } from '../utils/curlParser';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-twilight.css';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

export default function RequestPane() {
  const { tabs, activeTabId, updateTab, environments, activeEnvironmentId, setActiveEnvironmentId, collections, setCollections } = useStore();
  const [innerTab, setInnerTab] = useState<'Params' | 'Headers' | 'Body' | 'Auth'>('Params');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveReqName, setSaveReqName] = useState('');
  const [saveCollectionId, setSaveCollectionId] = useState('');
  const [methodDropdownOpen, setMethodDropdownOpen] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeLang, setCodeLang] = useState<'curl' | 'fetch' | 'python'>('curl');
  
  if (!activeTabId || !tabs[activeTabId]) return <div className="h-full flex items-center justify-center text-gray-500">No active request</div>;
  
  const req = tabs[activeTabId];

  const handleSend = async () => {
    updateTab(activeTabId, { loading: true, response: null });
    const currentReq = useStore.getState().tabs[activeTabId];
    
    // Resolve variables
    const activeEnv = activeEnvironmentId ? environments.find(e => e.id.toString() === activeEnvironmentId) : null;
    let envVars: any[] = [];
    if (activeEnv && activeEnv.variables) {
      try {
        envVars = typeof activeEnv.variables === 'string' ? JSON.parse(activeEnv.variables) : activeEnv.variables;
      } catch (e) {}
    }
    const resolveVars = (str: string) => {
      if (!str || typeof str !== 'string' || !envVars.length) return str;
      let res = str;
      envVars.forEach(v => {
        if (v.key && v.enabled) res = res.replace(new RegExp(`{{${v.key}}}`, 'g'), v.value);
      });
      return res;
    };

    try {
      // Create dicts from key-value arrays with resolved values
      const headers = currentReq.headers.filter(h => h.enabled && h.key).reduce((acc, h) => ({...acc, [resolveVars(h.key)]: resolveVars(h.value)}), {} as Record<string, string>);
      
      if (currentReq.authType === 'basic') {
        const user = resolveVars(currentReq.authData?.username || '');
        const pass = resolveVars(currentReq.authData?.password || '');
        headers['Authorization'] = 'Basic ' + btoa(`${user}:${pass}`);
      } else if (currentReq.authType === 'bearer') {
        const token = resolveVars(currentReq.authData?.token || '');
        headers['Authorization'] = 'Bearer ' + token;
      }
      
      const params = currentReq.params.filter(p => p.enabled && p.key).reduce((acc, h) => ({...acc, [resolveVars(h.key)]: resolveVars(h.value)}), {});
      
      let parsedBody = null;
      if (currentReq.bodyType === 'raw') parsedBody = resolveVars(currentReq.bodyRaw);
      else if (currentReq.bodyType === 'formdata' || currentReq.bodyType === 'urlencoded') {
        parsedBody = currentReq.bodyForm.filter(f => f.enabled && f.key).reduce((acc, f) => ({...acc, [resolveVars(f.key)]: resolveVars(f.value)}), {});
      }

      const res = await fetch('http://127.0.0.1:8000/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: currentReq.method,
          url: resolveVars(currentReq.url),
          headers: headers,
          params: params,
          body_type: currentReq.bodyType,
          body: parsedBody,
          environment_id: activeEnvironmentId ? parseInt(activeEnvironmentId) : null
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `HTTP Error ${res.status}`);
      }
      updateTab(activeTabId, { loading: false, response: data });
    } catch (e: any) {
      updateTab(activeTabId, { loading: false, response: { error: e.message }});
    }
  };

  const handleSaveDirect = async () => {
    const currentReq = useStore.getState().tabs[activeTabId];
    if (currentReq.saved_id) {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/requests/${currentReq.saved_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: currentReq.name || 'Untitled Request',
            method: currentReq.method,
            url: currentReq.url,
            collection_id: currentReq.collection_id,
            headers: JSON.stringify(currentReq.headers),
            query_params: JSON.stringify(currentReq.params),
            body_type: currentReq.bodyType,
            body: currentReq.bodyType === 'raw' ? currentReq.bodyRaw : JSON.stringify(currentReq.bodyForm),
            auth_type: currentReq.authType,
            auth_data: JSON.stringify(currentReq.authData)
          })
        });
        if (res.ok) {
          const colsRes = await fetch('http://127.0.0.1:8000/api/collections');
          setCollections(await colsRes.json());
        }
      } catch (e) { console.error(e); }
    } else if (currentReq.collection_id) {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: currentReq.name || 'Untitled Request',
            method: currentReq.method,
            url: currentReq.url,
            collection_id: currentReq.collection_id,
            headers: JSON.stringify(currentReq.headers),
            query_params: JSON.stringify(currentReq.params),
            body_type: currentReq.bodyType,
            body: currentReq.bodyType === 'raw' ? currentReq.bodyRaw : JSON.stringify(currentReq.bodyForm),
            auth_type: currentReq.authType,
            auth_data: JSON.stringify(currentReq.authData)
          })
        });
        if (res.ok) {
          const data = await res.json();
          updateTab(activeTabId, { saved_id: data.id });
          const colsRes = await fetch('http://127.0.0.1:8000/api/collections');
          setCollections(await colsRes.json());
        }
      } catch (e) { console.error(e); }
    } else {
      setSaveReqName(currentReq.name || '');
      setSaveCollectionId('');
      setShowSaveModal(true);
    }
  };

  const handleModalSave = async () => {
    const currentReq = useStore.getState().tabs[activeTabId];
    if (!saveReqName || !saveCollectionId) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveReqName,
          method: currentReq.method,
          url: currentReq.url,
          collection_id: parseInt(saveCollectionId),
          headers: JSON.stringify(currentReq.headers),
          query_params: JSON.stringify(currentReq.params),
          body_type: currentReq.bodyType,
          body: currentReq.bodyType === 'raw' ? currentReq.bodyRaw : JSON.stringify(currentReq.bodyForm),
          auth_type: currentReq.authType,
          auth_data: JSON.stringify(currentReq.authData)
        })
      });
      if (res.ok) {
        const data = await res.json();
        updateTab(activeTabId, { saved_id: data.id, collection_id: parseInt(saveCollectionId), name: saveReqName });
        setShowSaveModal(false);
        const colsRes = await fetch('http://127.0.0.1:8000/api/collections');
        setCollections(await colsRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1C1C1C] p-4 text-[#e5e2e1]">
      <div className="flex items-center space-x-2 mb-4">
        {/* URL Bar Group */}
        <div className="flex flex-1 items-center bg-[#131313] border border-[#333333] rounded h-9">
          {/* Method Dropdown */}
          <div className="relative h-full flex items-center rounded-l">
            <div 
              className="flex items-center px-3 cursor-pointer h-full border-r border-[#333333] select-none min-w-[90px] justify-between hover:bg-[#2A2A2A] rounded-l"
              onClick={() => setMethodDropdownOpen(!methodDropdownOpen)}
              data-testid="method-dropdown-trigger"
            >
              <span 
                data-testid="method-dropdown-trigger-text"
                className={clsx("text-sm font-semibold", 
                  req.method === 'GET' ? 'text-green-500' :
                  req.method === 'POST' ? 'text-yellow-500' :
                  req.method === 'DELETE' ? 'text-red-500' : 'text-blue-500'
                )}>{req.method}</span>
              <ChevronDown size={14} className="ml-1 text-gray-500" />
            </div>
            {methodDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMethodDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-28 bg-[#2A2A2A] border border-[#333333] shadow-xl rounded z-50 py-1">
                  {METHODS.map(m => (
                    <div 
                      key={m} 
                      className={clsx("px-3 py-1.5 text-xs cursor-pointer hover:bg-[#353535] font-semibold", 
                        m === 'GET' ? 'text-green-500' :
                        m === 'POST' ? 'text-yellow-500' :
                        m === 'DELETE' ? 'text-red-500' : 'text-blue-500'
                      )}
                      onClick={() => {
                        updateTab(activeTabId, { method: m });
                        setMethodDropdownOpen(false);
                      }}
                      data-testid={`method-option-${m}`}
                    >
                      {m}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <input 
            type="text" 
            placeholder="Enter request URL" 
            className="flex-1 bg-transparent text-white px-3 py-0 h-full text-sm outline-none"
            value={req.url}
            onChange={(e) => updateTab(activeTabId, { url: e.target.value })}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text');
              if (text && text.trim().startsWith('curl ')) {
                e.preventDefault();
                const parsed = parseCurl(text);
                if (parsed) {
                  updateTab(activeTabId, parsed);
                }
              }
            }}
          />
          <button 
            onClick={handleSend}
            disabled={req.loading}
            className="bg-[#FF6C37] hover:bg-[#e65a2a] text-white px-6 h-full text-sm font-semibold flex items-center justify-center transition-colors disabled:opacity-50 min-w-[100px] rounded-r"
          >
            {req.loading ? 'Sending...' : 'Send'}
          </button>
        </div>
        
        {/* Environment Dropdown */}
        <select 
          className="bg-[#1a1a1a] border border-[#333333] hover:bg-[#2A2A2A] text-white px-3 h-9 rounded text-sm font-semibold outline-none cursor-pointer"
          value={activeEnvironmentId || ''}
          onChange={(e) => setActiveEnvironmentId(e.target.value || null)}
        >
          <option value="">No Environment</option>
          {environments.map(env => (
            <option key={env.id} value={env.id.toString()}>{env.name}</option>
          ))}
        </select>
        
        {/* Save Button */}
        <button 
          onClick={handleSaveDirect}
          className="bg-transparent border border-[#333333] hover:bg-[#2A2A2A] text-white px-4 h-9 rounded text-sm font-semibold flex items-center transition-colors"
          data-testid="request-save-btn"
        >
          <Save size={14} className="mr-2" /> Save
        </button>
        
        {/* Code Button */}
        <button 
          onClick={() => setShowCodeModal(true)}
          className="bg-transparent border border-[#333333] hover:bg-[#2A2A2A] text-white px-3 h-9 rounded text-sm font-semibold flex items-center transition-colors ml-2"
        >
          <Code size={14} className="mr-2" /> Code
        </button>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1c1c1c] p-6 rounded shadow-xl border border-[#333333] w-96 text-white">
            <h2 className="text-lg font-bold mb-4">Save Request</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Request Name</label>
              <input 
                type="text" 
                className="w-full p-2 bg-[#0d0d0d] border border-[#333333] rounded outline-none focus:border-[#FF6C37] text-sm"
                value={saveReqName}
                onChange={e => setSaveReqName(e.target.value)}
                placeholder="e.g. Get User Profile"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Select Collection</label>
              <select 
                className="w-full p-2 bg-[#0d0d0d] border border-[#333333] rounded outline-none focus:border-[#FF6C37] text-sm"
                value={saveCollectionId}
                onChange={e => setSaveCollectionId(e.target.value)}
              >
                <option value="" disabled>Select...</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white font-medium border border-transparent hover:border-[#333333] rounded">Cancel</button>
              <button onClick={handleModalSave} disabled={!saveReqName || !saveCollectionId} className="px-4 py-2 text-sm bg-[#FF6C37] hover:bg-[#e65a2a] text-white rounded font-medium disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}

      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#1C1C1C] border border-[#333333] rounded-lg shadow-2xl p-4 w-[600px] flex flex-col max-h-[80vh]">
            <h2 className="text-lg font-bold mb-4">Generate Code Snippet</h2>
            <div className="flex space-x-2 mb-2 border-b border-[#333333]">
              {['curl', 'fetch', 'python'].map(lang => (
                <button
                  key={lang}
                  className={clsx("px-4 py-2 text-sm font-semibold border-b-2", codeLang === lang ? 'border-[#FF6C37] text-white' : 'border-transparent text-gray-400')}
                  onClick={() => setCodeLang(lang as any)}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            <textarea 
              readOnly 
              className="w-full flex-1 p-3 text-xs border border-[#333333] bg-[#0d0d0d] rounded outline-none text-gray-300 font-mono mb-4 resize-none"
              value={
                codeLang === 'curl' ? generateCurl(req as any) :
                codeLang === 'fetch' ? generateFetch(req as any) :
                generatePython(req as any)
              }
            />
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => {
                  const text = codeLang === 'curl' ? generateCurl(req as any) : codeLang === 'fetch' ? generateFetch(req as any) : generatePython(req as any);
                  navigator.clipboard.writeText(text);
                }}
                className="bg-[#333333] hover:bg-[#444444] text-white px-4 py-1.5 rounded font-semibold text-sm transition-colors"
              >
                Copy to Clipboard
              </button>
              <button 
                onClick={() => setShowCodeModal(false)}
                className="bg-[#FF6C37] hover:bg-[#e65a2a] text-white px-4 py-1.5 rounded font-semibold text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-6 border-b border-[#333333] mb-4 text-sm font-semibold">
        {['Params', 'Headers', 'Body', 'Auth'].map(tab => (
          <button 
            key={tab}
            onClick={() => setInnerTab(tab as any)}
            className={clsx("pb-2 px-1 relative text-[#e5e2e1]", innerTab === tab ? "" : "text-gray-500 hover:text-gray-300")}
          >
            {tab}
            {innerTab === tab && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#FF6C37]" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {innerTab === 'Params' && <KeyValTable items={req.params} onChange={p => updateTab(activeTabId, { params: p })} />}
        {innerTab === 'Headers' && <KeyValTable items={req.headers} onChange={h => updateTab(activeTabId, { headers: h })} />}
        {innerTab === 'Body' && (
          <div className="flex flex-col h-full">
            <div className="flex space-x-4 mb-2 text-sm text-gray-400">
              {['none', 'raw', 'formdata', 'urlencoded'].map(t => (
                <label key={t} className="flex items-center space-x-1 cursor-pointer hover:text-white">
                  <input type="radio" checked={req.bodyType === t} onChange={() => updateTab(activeTabId, { bodyType: t as any })} className="accent-[#FF6C37] bg-transparent" />
                  <span>{t}</span>
                </label>
              ))}
            </div>
            {req.bodyType === 'raw' && (
              <div className="flex flex-col relative w-full h-64">
                <div className="absolute top-2 right-6 z-10">
                  <button
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(req.bodyRaw || '{}');
                        updateTab(activeTabId, { bodyRaw: JSON.stringify(parsed, null, 2) });
                      } catch (e) {
                        alert('Invalid JSON');
                      }
                    }}
                    className="flex items-center space-x-1 bg-[#333333] hover:bg-[#444444] text-white px-2 py-1 rounded text-xs"
                    title="Beautify JSON"
                  >
                    <Wand2 size={12} />
                    <span>Beautify</span>
                  </button>
                </div>
                <div className="w-full h-full bg-[#131313] border border-[#333333] rounded overflow-auto relative">
                  <Editor
                    value={req.bodyRaw || ''}
                    onValueChange={code => updateTab(activeTabId, { bodyRaw: code })}
                    highlight={code => {
                      try {
                        return Prism.highlight(code, Prism.languages.json, 'json');
                      } catch {
                        return code;
                      }
                    }}
                    padding={10}
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 12,
                      minHeight: '100%',
                    }}
                    className="outline-none min-h-full"
                    textareaClassName="focus:outline-none min-h-full"
                  />
                </div>
              </div>
            )}
            {req.bodyType !== 'none' && req.bodyType !== 'raw' && (
              <KeyValTable items={req.bodyForm} onChange={f => updateTab(activeTabId, { bodyForm: f })} />
            )}
          </div>
        )}
        {innerTab === 'Auth' && (
          <div className="flex flex-col h-full">
            <div className="flex space-x-4 mb-4 text-sm text-gray-400">
              <select 
                className="bg-[#1a1a1a] border border-[#333333] hover:bg-[#2A2A2A] text-white px-3 py-1 rounded text-sm outline-none cursor-pointer"
                value={req.authType || 'none'}
                onChange={(e) => updateTab(activeTabId, { authType: e.target.value as any })}
                data-testid="auth-type-select"
              >
                <option value="none">No Auth</option>
                <option value="basic">Basic Auth</option>
                <option value="bearer">Bearer Token</option>
              </select>
            </div>
            
            {req.authType === 'basic' && (
              <div className="flex flex-col space-y-3 w-1/2">
                <input 
                  type="text" 
                  placeholder="Username" 
                  className="bg-[#131313] border border-[#333333] rounded px-3 py-2 text-sm text-white outline-none focus:border-[#594139]"
                  value={req.authData?.username || ''}
                  onChange={(e) => updateTab(activeTabId, { authData: { ...req.authData, username: e.target.value } })}
                  data-testid="auth-basic-username"
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  className="bg-[#131313] border border-[#333333] rounded px-3 py-2 text-sm text-white outline-none focus:border-[#594139]"
                  value={req.authData?.password || ''}
                  onChange={(e) => updateTab(activeTabId, { authData: { ...req.authData, password: e.target.value } })}
                  data-testid="auth-basic-password"
                />
              </div>
            )}
            
            {req.authType === 'bearer' && (
              <div className="flex flex-col space-y-3 w-1/2">
                <input 
                  type="text" 
                  placeholder="Token" 
                  className="bg-[#131313] border border-[#333333] rounded px-3 py-2 text-sm text-white outline-none focus:border-[#594139]"
                  value={req.authData?.token || ''}
                  onChange={(e) => updateTab(activeTabId, { authData: { ...req.authData, token: e.target.value } })}
                  data-testid="auth-bearer-token"
                />
              </div>
            )}

            {(!req.authType || req.authType === 'none') && (
              <div className="text-sm text-gray-500">This request does not use any authorization.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
