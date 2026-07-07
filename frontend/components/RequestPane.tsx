'use client';
import { useStore, KeyVal } from '../store/useStore';
import { Play, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

export default function RequestPane() {
  const { tabs, activeTabId, updateTab, activeEnvironment } = useStore();
  const [innerTab, setInnerTab] = useState<'Params' | 'Headers' | 'Body' | 'Auth'>('Params');
  
  if (!activeTabId || !tabs[activeTabId]) return <div className="h-full flex items-center justify-center text-gray-500">No active request</div>;
  
  const req = tabs[activeTabId];

  const handleSend = async () => {
    updateTab(activeTabId, { loading: true, response: null });
    try {
      // Create dicts from key-value arrays
      const headers = req.headers.filter(h => h.enabled && h.key).reduce((acc, h) => ({...acc, [h.key]: h.value}), {});
      const params = req.params.filter(p => p.enabled && p.key).reduce((acc, h) => ({...acc, [h.key]: h.value}), {});
      
      let parsedBody = null;
      if (req.bodyType === 'raw') parsedBody = req.bodyRaw;
      else if (req.bodyType === 'formdata' || req.bodyType === 'urlencoded') {
        parsedBody = req.bodyForm.filter(f => f.enabled && f.key).reduce((acc, f) => ({...acc, [f.key]: f.value}), {});
      }

      const res = await fetch('http://127.0.0.1:8000/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: req.method,
          url: req.url,
          headers: headers,
          params: params,
          bodyType: req.bodyType,
          body: parsedBody
        })
      });
      const data = await res.json();
      updateTab(activeTabId, { loading: false, response: data });
    } catch (e: any) {
      updateTab(activeTabId, { loading: false, response: { error: e.message }});
    }
  };

  const KeyValTable = ({ items, onChange }: { items: KeyVal[], onChange: (i: KeyVal[]) => void }) => {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="w-8 p-2"></th>
              <th className="p-2 border-l border-gray-200 dark:border-gray-700">Key</th>
              <th className="p-2 border-l border-gray-200 dark:border-gray-700">Value</th>
              <th className="w-10 p-2 border-l border-gray-200 dark:border-gray-700"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="p-2 text-center">
                  <input type="checkbox" checked={item.enabled} 
                    onChange={e => {
                      const newItems = [...items];
                      newItems[idx].enabled = e.target.checked;
                      onChange(newItems);
                    }}
                  />
                </td>
                <td className="p-0 border-l border-gray-200 dark:border-gray-700">
                  <input type="text" className="w-full p-2 bg-transparent outline-none" placeholder="Key" value={item.key}
                    onChange={e => {
                      const newItems = [...items];
                      newItems[idx].key = e.target.value;
                      onChange(newItems);
                    }}
                  />
                </td>
                <td className="p-0 border-l border-gray-200 dark:border-gray-700">
                  <input type="text" className="w-full p-2 bg-transparent outline-none" placeholder="Value" value={item.value}
                    onChange={e => {
                      const newItems = [...items];
                      newItems[idx].value = e.target.value;
                      onChange(newItems);
                    }}
                  />
                </td>
                <td className="p-2 text-center border-l border-gray-200 dark:border-gray-700">
                  <button onClick={() => onChange(items.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
                <button 
                  onClick={() => onChange([...items, { id: Date.now().toString(), key: '', value: '', enabled: true }])}
                  className="text-sm flex items-center justify-center w-full text-gray-500 hover:text-black dark:hover:text-white"
                >
                  <Plus size={16} className="mr-1"/> Add Item
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0d0d0d] p-4">
      <div className="flex items-center space-x-2 mb-4">
        <select 
          className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white px-3 py-2 rounded text-sm font-semibold border-r-8 border-transparent outline-none"
          value={req.method}
          onChange={(e) => updateTab(activeTabId, { method: e.target.value })}
        >
          {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input 
          type="text" 
          placeholder="Enter request URL" 
          className="flex-1 bg-gray-100 dark:bg-gray-800 text-black dark:text-white px-4 py-2 rounded text-sm outline-none border border-transparent focus:border-orange-500"
          value={req.url}
          onChange={(e) => updateTab(activeTabId, { url: e.target.value })}
        />
        <button 
          onClick={handleSend}
          disabled={req.loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-semibold flex items-center transition-colors disabled:opacity-50"
        >
          {req.loading ? 'Sending...' : <><Play size={16} className="mr-2 fill-current" /> Send</>}
        </button>
      </div>

      <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-800 mb-4">
        {['Params', 'Headers', 'Body', 'Auth'].map(tab => (
          <button 
            key={tab}
            onClick={() => setInnerTab(tab as any)}
            className={clsx("text-sm font-medium pb-2", innerTab === tab ? "border-b-2 border-orange-500 text-black dark:text-white" : "text-gray-500 hover:text-black dark:hover:text-white")}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {innerTab === 'Params' && <KeyValTable items={req.params} onChange={p => updateTab(activeTabId, { params: p })} />}
        {innerTab === 'Headers' && <KeyValTable items={req.headers} onChange={h => updateTab(activeTabId, { headers: h })} />}
        {innerTab === 'Body' && (
          <div className="flex flex-col h-full">
            <div className="flex space-x-4 mb-2 text-sm text-gray-600 dark:text-gray-400">
              {['none', 'raw', 'formdata', 'urlencoded'].map(t => (
                <label key={t} className="flex items-center space-x-1 cursor-pointer">
                  <input type="radio" checked={req.bodyType === t} onChange={() => updateTab(activeTabId, { bodyType: t as any })} />
                  <span>{t}</span>
                </label>
              ))}
            </div>
            {req.bodyType === 'raw' && (
              <textarea 
                className="w-full h-48 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 text-sm font-mono outline-none"
                value={req.bodyRaw}
                onChange={e => updateTab(activeTabId, { bodyRaw: e.target.value })}
                placeholder="Enter raw body (e.g. JSON)"
              />
            )}
            {req.bodyType !== 'none' && req.bodyType !== 'raw' && (
              <KeyValTable items={req.bodyForm} onChange={f => updateTab(activeTabId, { bodyForm: f })} />
            )}
          </div>
        )}
        {innerTab === 'Auth' && (
          <div className="text-sm text-gray-500">Authentication settings (Coming Soon)</div>
        )}
      </div>
    </div>
  );
}
