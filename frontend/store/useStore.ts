import { create } from 'zustand';

export interface KeyVal {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestState {
  id?: string;
  name?: string;
  method: string;
  url: string;
  headers: KeyVal[];
  params: KeyVal[];
  bodyType: 'none' | 'raw' | 'formdata' | 'urlencoded';
  bodyRaw: string;
  bodyForm: KeyVal[];
  response: any | null;
  loading: boolean;
}

interface AppState {
  activeTabId: string;
  tabs: Record<string, RequestState>;
  collections: any[];
  environments: any[];
  history: any[];
  activeEnvironment: any | null;
  
  // Actions
  addTab: (tabId: string, initialData?: Partial<RequestState>) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, data: Partial<RequestState>) => void;
  setCollections: (cols: any[]) => void;
  setEnvironments: (envs: any[]) => void;
  setHistory: (hist: any[]) => void;
  setActiveEnvironment: (env: any) => void;
}

const defaultRequestState: RequestState = {
  method: 'GET',
  url: '',
  headers: [],
  params: [],
  bodyType: 'none',
  bodyRaw: '',
  bodyForm: [],
  response: null,
  loading: false,
};

export const useStore = create<AppState>((set) => ({
  activeTabId: 'default',
  tabs: {
    'default': { ...defaultRequestState }
  },
  collections: [],
  environments: [],
  history: [],
  activeEnvironment: null,
  
  addTab: (tabId, initialData) => set((state) => ({
    tabs: { ...state.tabs, [tabId]: { ...defaultRequestState, ...initialData } },
    activeTabId: tabId
  })),
  closeTab: (tabId) => set((state) => {
    const newTabs = { ...state.tabs };
    delete newTabs[tabId];
    // fallback logic to open another tab can be added here
    return { tabs: newTabs, activeTabId: Object.keys(newTabs)[0] || '' };
  }),
  setActiveTab: (tabId) => set({ activeTabId: tabId }),
  updateTab: (tabId, data) => set((state) => ({
    tabs: {
      ...state.tabs,
      [tabId]: { ...state.tabs[tabId], ...data }
    }
  })),
  setCollections: (cols) => set({ collections: cols }),
  setEnvironments: (envs) => set({ environments: envs }),
  setHistory: (hist) => set({ history: hist }),
  setActiveEnvironment: (env) => set({ activeEnvironment: env })
}));
