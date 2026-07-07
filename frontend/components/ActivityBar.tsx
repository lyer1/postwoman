import React from 'react';
import { useStore } from '../store/useStore';
import { Folder, History, Globe } from 'lucide-react';

export default function ActivityBar() {
  const { activeSidebarTab, setActiveSidebarTab } = useStore();

  const navItems = [
    { id: 'collections', icon: Folder, label: 'Collections' },
    { id: 'environments', icon: Globe, label: 'Environments' },
    { id: 'history', icon: History, label: 'History' },
  ];

  return (
    <div className="w-12 bg-[#131313] border-r border-[#333333] flex flex-col items-center py-4 flex-shrink-0">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSidebarTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveSidebarTab(item.id as any)}
            className={`w-full h-12 flex items-center justify-center relative group
              ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
            `}
            title={item.label}
          >
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#FF6C37]" />
            )}
            <Icon size={22} strokeWidth={1.5} />
          </button>
        );
      })}
    </div>
  );
}
