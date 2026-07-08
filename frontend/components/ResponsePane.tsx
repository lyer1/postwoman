'use client';
import { useStore } from '../store/useStore';
import clsx from 'clsx';
import { useState } from 'react';
import { Rocket } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function ResponsePane() {
  const { tabs, activeTabId } = useStore();
  const [tab, setTab] = useState<'Body' | 'Cookies' | 'Headers' | 'Test Results'>('Body');
  const [view, setView] = useState<'Pretty' | 'Raw'>('Pretty');
  
  if (!activeTabId || !tabs[activeTabId]) return null;
  const req = tabs[activeTabId];

  if (!req.response) {
    return (
      <div className="flex flex-col h-full bg-[#1C1C1C] p-4 text-[#e5e2e1]">
        <div className="flex space-x-6 border-b border-[#333333] mb-4 text-sm font-semibold">
          <div className="pb-2 px-1 text-gray-500">Response</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-sm">
          <Rocket size={48} className="mb-4 text-[#FF6C37] opacity-80" strokeWidth={1} />
          <p>Click Send to get a response</p>
        </div>
      </div>
    );
  }

  const { status, time, size, headers, body, error } = req.response;

  return (
    <div className="flex flex-col h-full bg-[#1C1C1C] flex-1 text-[#e5e2e1] px-4 pt-4">
      <div className="flex items-center justify-between border-b border-[#333333] mb-2">
        <div className="flex space-x-6 text-sm font-semibold">
          {['Body', 'Cookies', 'Headers', 'Test Results'].map(t => (
            <button 
              key={t}
              onClick={() => setTab(t as any)}
              className={clsx("pb-2 px-1 relative text-[#e5e2e1]", tab === t ? "" : "text-gray-500 hover:text-gray-300")}
            >
              {t}
              {tab === t && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#FF6C37]" />}
            </button>
          ))}
        </div>
        
        {error ? (
          <div className="text-[#ffb4ab] text-xs font-semibold mb-2">
            Error
          </div>
        ) : (
          <div className="flex space-x-4 text-xs mb-2">
            <span className="text-gray-400">Status: <span className={clsx(status >= 200 && status < 300 ? "text-green-500" : "text-red-500", "font-semibold")}>{status}</span></span>
            <span className="text-gray-400">Time: <span className="text-green-500 font-semibold">{time} ms</span></span>
            <span className="text-gray-400">Size: <span className="text-green-500 font-semibold">{size} B</span></span>
          </div>
        )}
      </div>
      
      {tab === 'Body' && (
        <div className="flex flex-col h-full overflow-hidden">
          {!error && (
            <div className="flex space-x-2 mb-2">
              <button onClick={() => setView('Pretty')} className={clsx("text-xs font-medium px-2 py-1 rounded", view === 'Pretty' ? "bg-[#2A2A2A] text-white" : "text-gray-500 hover:text-white")}>Pretty</button>
              <button onClick={() => setView('Raw')} className={clsx("text-xs font-medium px-2 py-1 rounded", view === 'Raw' ? "bg-[#2A2A2A] text-white" : "text-gray-500 hover:text-white")}>Raw</button>
            </div>
          )}
          <div className="flex-1 overflow-auto bg-[#131313] border border-[#333333] p-0 text-sm rounded">
            {error ? (
              <div className="text-[#ffb4ab] p-2">{error}</div>
            ) : (
              view === 'Pretty' && typeof body === 'object' ? (
                <SyntaxHighlighter
                  language="json"
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, padding: '0.5rem', background: 'transparent' }}
                  wrapLines={true}
                >
                  {JSON.stringify(body, null, 2)}
                </SyntaxHighlighter>
              ) : (
                <pre className="whitespace-pre-wrap break-all p-2 font-[JetBrains_Mono] text-gray-300">
                  {typeof body === 'object' ? JSON.stringify(body) : body}
                </pre>
              )
            )}
          </div>
        </div>
      )}

      {tab === 'Headers' && (
        <div className="flex-1 overflow-auto bg-[#131313] border border-[#333333] rounded">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1C1C1C] border-b border-[#333333] text-gray-400">
              <tr>
                <th className="px-3 py-2 font-semibold w-1/3 border-r border-[#333333]">Key</th>
                <th className="px-3 py-2 font-semibold">Value</th>
              </tr>
            </thead>
            <tbody>
              {headers && Object.entries(headers).map(([k, v]: [string, any], i) => (
                <tr key={i} className="border-b border-[#333333] hover:bg-[#1C1C1C]">
                  <td className="px-3 py-1.5 border-r border-[#333333] font-mono text-gray-300 break-all">{k}</td>
                  <td className="px-3 py-1.5 font-mono text-[#e5e2e1] break-all">{v}</td>
                </tr>
              ))}
              {(!headers || Object.keys(headers).length === 0) && (
                <tr><td colSpan={2} className="px-3 py-4 text-center text-gray-500">No headers</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Test Results' && (
        <div className="flex-1 overflow-y-auto mt-2">
          {req.response.testResults && req.response.testResults.length > 0 ? (
            <div className="flex flex-col space-y-2 text-sm">
              <div className="font-semibold text-gray-300 mb-2">
                Test Results ({req.response.testResults.filter((t: any) => t.pass).length}/{req.response.testResults.length} passed)
              </div>
              {req.response.testResults.map((tr: any, idx: number) => (
                <div key={idx} className="flex flex-col bg-[#131313] p-3 rounded border border-[#333333]">
                  <div className="flex items-center space-x-2">
                    {tr.pass ? (
                      <span className="bg-green-500/20 text-green-500 px-2 py-0.5 rounded text-xs font-bold">PASS</span>
                    ) : (
                      <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-xs font-bold">FAIL</span>
                    )}
                    <span className="text-gray-300 font-medium">{tr.name}</span>
                  </div>
                  {!tr.pass && tr.error && (
                    <div className="text-red-400 text-xs mt-2 font-mono break-words whitespace-pre-wrap">
                      {tr.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 h-full flex items-center justify-center text-gray-500 text-sm">
              No test results found.
            </div>
          )}
        </div>
      )}

      {tab !== 'Body' && tab !== 'Headers' && tab !== 'Test Results' && (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          {tab} (Coming Soon)
        </div>
      )}
    </div>
  );
}
