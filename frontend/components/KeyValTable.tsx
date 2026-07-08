import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { KeyVal } from '../store/useStore';

interface KeyValTableProps {
  items: KeyVal[];
  onChange: (items: KeyVal[]) => void;
}

export default function KeyValTable({ items, onChange }: KeyValTableProps) {
  return (
    <div className="w-full">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="text-[#a88a81] border-b border-[#333333]">
          <tr>
            <th className="w-8 p-1"></th>
            <th className="p-1 font-semibold border-r border-[#333333]">Key</th>
            <th className="p-1 font-semibold border-r border-[#333333]">Value</th>
            <th className="w-8 p-1"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id || `kv-${idx}`} className="border-b border-[#333333] hover:bg-[#2A2A2A]">
              <td className="p-1 text-center">
                <input type="checkbox" checked={item.enabled} 
                  className="accent-[#FF6C37]"
                  onChange={e => {
                    const newItems = [...items];
                    newItems[idx].enabled = e.target.checked;
                    onChange(newItems);
                  }}
                />
              </td>
              <td className="p-0 border-r border-[#333333]">
                <input type="text" className="w-full p-1.5 bg-transparent outline-none text-sm text-white placeholder-gray-500" placeholder="Key" value={item.key}
                  onChange={e => {
                    const newItems = [...items];
                    newItems[idx].key = e.target.value;
                    onChange(newItems);
                  }}
                />
              </td>
              <td className="p-0 border-r border-[#333333]">
                <input type="text" className="w-full p-1.5 bg-transparent outline-none text-sm text-white placeholder-gray-500" placeholder="Value" value={item.value}
                  onChange={e => {
                    const newItems = [...items];
                    newItems[idx].value = e.target.value;
                    onChange(newItems);
                  }}
                />
              </td>
              <td className="p-1 text-center">
                <button onClick={() => onChange(items.filter((_, i) => i !== idx))} className="text-gray-500 hover:text-[#ffb4ab]"><Trash2 size={12}/></button>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={4} className="p-1 border-b border-[#333333]">
              <button 
                onClick={() => onChange([...items, { id: Date.now().toString(), key: '', value: '', enabled: true }])}
                className="text-xs flex items-center w-full text-gray-500 hover:text-white p-1"
              >
                <Plus size={14} className="mr-1"/> Add Item
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
