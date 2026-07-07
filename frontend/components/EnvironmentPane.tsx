'use client';
import { useState, useEffect } from 'react';
import { useStore, KeyVal } from '../store/useStore';
import { Globe, Save, Code, Share2, MoreHorizontal, Search, Trash2, Check } from 'lucide-react';
import clsx from 'clsx';

export default function EnvironmentPane() {
  const { tabs, activeTabId, updateTab, setEnvironments, environments } = useStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active tab must be an environment
  const currentTab = activeTabId ? tabs[activeTabId] : null;
  
  if (!currentTab || currentTab.type !== 'environment') {
    return <div className="flex-1 flex items-center justify-center text-gray-500">No environment selected</div>;
  }

  const envVars: KeyVal[] = currentTab.envVars || [];

  const handleUpdateVars = (newVars: KeyVal[]) => {
    if (activeTabId) {
      updateTab(activeTabId, { envVars: newVars });
    }
  };

  const handleUpdateVar = (index: number, field: keyof KeyVal, value: any) => {
    const newVars = [...envVars];
    newVars[index] = { ...newVars[index], [field]: value };
    handleUpdateVars(newVars);
  };

  const handleDeleteVar = (index: number) => {
    const newVars = [...envVars];
    newVars.splice(index, 1);
    handleUpdateVars(newVars);
  };

  const ensureEmptyRow = () => {
    if (envVars.length === 0 || envVars[envVars.length - 1].key !== '' || envVars[envVars.length - 1].value !== '') {
      handleUpdateVars([...envVars, { id: Date.now().toString(), key: '', value: '', enabled: true }]);
    }
  };

  useEffect(() => {
    ensureEmptyRow();
  }, [envVars.length]);

  const handleSave = async () => {
    if (!currentTab.envId) return;
    setIsSaving(true);
    setSaveSuccess(false);

    // Filter out the empty row before saving
    const varsToSave = envVars.filter(v => v.key.trim() !== '');

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/environments/${currentTab.envId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: currentTab.name, 
          variables: JSON.stringify(varsToSave) 
        })
      });
      
      if (res.ok) {
        const data = await fetch('http://127.0.0.1:8000/api/environments').then(r => r.json());
        setEnvironments(data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#131313] text-[#e5e2e1] h-full overflow-hidden">
      {/* Environment Header */}
      <div className="p-4 border-b border-[#333333] flex justify-between items-start shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <Globe size={20} className="text-gray-400" />
            <h1 className="text-[18px] text-white font-semibold">
              <input 
                className="bg-transparent border-none outline-none focus:ring-1 focus:ring-[#FF6C37] px-1 rounded -ml-1"
                value={currentTab.name || ''}
                onChange={e => updateTab(activeTabId, { name: e.target.value })}
              />
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-1 px-3 py-1.5 border border-[#333333] rounded bg-[#131313] hover:bg-[#1C1C1C] text-[#e5e2e1] text-sm transition-colors">
            <Code size={16} />
            <span>Fork</span>
            <span className="text-gray-500 border-l border-[#333333] pl-2 ml-1">0</span>
          </button>
          <button className="px-3 py-1.5 border border-[#333333] rounded bg-[#131313] hover:bg-[#1C1C1C] text-[#e5e2e1] text-sm transition-colors">Share</button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1.5 bg-[#FF6C37] text-white rounded hover:bg-[#ff8559] text-sm font-semibold transition-colors flex items-center space-x-1 disabled:opacity-70"
          >
            {saveSuccess ? <Check size={16} /> : <Save size={16} />}
            <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved' : 'Save'}</span>
          </button>
          <button className="p-1.5 border border-[#333333] rounded bg-[#131313] hover:bg-[#1C1C1C] text-gray-400 transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto bg-[#131313] relative">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="sticky top-0 bg-[#20201f] z-10 shadow-sm border-b border-[#333333]">
            <tr>
              <th className="px-4 py-2 font-semibold text-gray-400 border-r border-[#333333] w-[40px] text-center"></th>
              <th className="px-4 py-2 font-semibold text-gray-400 border-r border-[#333333] w-1/4">VARIABLE</th>
              <th className="px-4 py-2 font-semibold text-gray-400 border-r border-[#333333] w-1/4">INITIAL VALUE</th>
              <th className="px-4 py-2 font-semibold text-gray-400 border-r border-[#333333] w-1/4">CURRENT VALUE</th>
              <th className="px-4 py-2 font-semibold text-gray-400 w-1/4 flex justify-between items-center">
                <span>TYPE</span>
                <div className="flex items-center space-x-2">
                  <Search size={16} className="cursor-pointer hover:text-white transition-colors" />
                  <MoreHorizontal size={16} className="cursor-pointer hover:text-white transition-colors" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="font-mono text-[13px]">
            {envVars.map((v, i) => {
              const isLast = i === envVars.length - 1;
              return (
                <tr key={v.id || i} className="border-b border-[#333333] hover:bg-[#1C1C1C] transition-colors group">
                  <td className="p-0 border-r border-[#333333] relative text-center w-[40px]">
                    <div className="absolute inset-y-0 left-0 w-0.5 bg-transparent group-hover:bg-[#FF6C37]"></div>
                    {!isLast && (
                      <input 
                        type="checkbox" 
                        checked={v.enabled} 
                        onChange={e => handleUpdateVar(i, 'enabled', e.target.checked)}
                        className="accent-[#FF6C37]"
                      />
                    )}
                  </td>
                  <td className="p-0 border-r border-[#333333]">
                    <input 
                      className="w-full bg-transparent px-4 py-2 border-none focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#FF6C37] text-white h-8"
                      spellCheck="false" 
                      type="text" 
                      placeholder={isLast ? "Add a new variable" : ""}
                      value={v.key}
                      onChange={e => handleUpdateVar(i, 'key', e.target.value)}
                    />
                  </td>
                  <td className="p-0 border-r border-[#333333]">
                    {!isLast && (
                      <input 
                        className="w-full bg-transparent px-4 py-2 border-none focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#FF6C37] text-white h-8"
                        spellCheck="false" 
                        type="text" 
                        value={v.value}
                        onChange={e => handleUpdateVar(i, 'value', e.target.value)}
                      />
                    )}
                  </td>
                  <td className="p-0 border-r border-[#333333]">
                    {!isLast && (
                      <input 
                        className="w-full bg-transparent px-4 py-2 border-none focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#FF6C37] text-white h-8"
                        spellCheck="false" 
                        type="text" 
                        value={v.value}
                        onChange={e => handleUpdateVar(i, 'value', e.target.value)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-1 flex items-center justify-between h-8">
                    {!isLast && (
                      <>
                        <div className="flex items-center space-x-2">
                          <select className="bg-transparent border-none text-white outline-none focus:ring-0 text-[13px] p-1 cursor-pointer w-24">
                            <option className="bg-[#1C1C1C] text-white" value="default">default</option>
                            <option className="bg-[#1C1C1C] text-white" value="secret">secret</option>
                          </select>
                        </div>
                        <button 
                          onClick={() => handleDeleteVar(i)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="h-24"></div>
      </div>
    </div>
  );
}
