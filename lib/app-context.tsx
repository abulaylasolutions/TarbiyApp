import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { apiRequest } from '@/lib/query-client';

export interface CogenitoreInfo {
  id: string;
  name: string | null;
  gender: string | null;
  photoUrl: string | null;
  email: string;
}

export interface Child {
  id: string;
  name: string;
  birthDate: string;
  gender?: string | null;
  photoUri?: string | null;
  coParentName?: string | null;
  cogenitori?: string | null;
  cardColor?: string | null;
  salahEnabled?: boolean | null;
  fastingEnabled?: boolean | null;
  userId: string;
  createdAt: string;
}

export interface Note {
  id: string;
  text: string;
  color: string;
  rotation: string;
  createdAt: string;
  author: string;
  userId: string;
  tags?: string | null;
}

export interface PendingChange {
  id: string;
  userId: string;
  targetUserId: string;
  childId: string | null;
  action: string;
  status: string;
  details: string | null;
  createdAt: string;
}

interface AppContextValue {
  children: Child[];
  selectedChildId: string | null;
  notes: Note[];
  cogenitori: CogenitoreInfo[];
  pendingChanges: PendingChange[];
  customPhotos: Record<string, string>;
  addChild: (child: { name: string; birthDate: string; gender?: string; photoUri?: string; coParentName?: string; cardColor?: string; selectedCogenitori?: string[] }) => Promise<{ success: boolean; message?: string; childId?: string }>;
  updateChild: (id: string, data: { name?: string; birthDate?: string; gender?: string; photoUri?: string; coParentName?: string; cardColor?: string; cogenitori?: string; salahEnabled?: boolean; fastingEnabled?: boolean; trackQuranToday?: boolean }) => Promise<{ success: boolean; message?: string }>;
  removeChild: (id: string) => Promise<void>;
  selectChild: (id: string) => void;
  addNote: (text: string, author: string, tags?: string, color?: string) => Promise<void>;
  updateNote: (id: string, data: { text?: string; color?: string; tags?: string }) => Promise<{ success: boolean; message?: string }>;
  removeNote: (id: string) => Promise<void>;
  refreshChildren: () => Promise<void>;
  refreshNotes: () => Promise<void>;
  refreshCogenitori: () => Promise<void>;
  refreshPending: () => Promise<void>;
  refreshCustomPhotos: () => Promise<void>;
  setCustomPhoto: (childId: string, photoUrl: string) => Promise<void>;
  getChildPhoto: (childId: string) => string | null;
  approvePending: (id: string) => Promise<void>;
  rejectPending: (id: string) => Promise<void>;
  getCogenitoreNameById: (uid: string) => string | null;
  isLoading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const NOTE_COLORS = ['#FFD3B6', '#C7CEEA', '#A8E6CF', '#FFF5E1', '#FFE8D9', '#D4F5E5', '#E3E7F5'];

export function AppProvider({ children: childrenProp }: { children: ReactNode }) {
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [notesList, setNotesList] = useState<Note[]>([]);
  const [cogenitori, setCogenitori] = useState<CogenitoreInfo[]>([]);
  const [pendingList, setPendingList] = useState<PendingChange[]>([]);
  const [customPhotos, setCustomPhotos] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        refreshChildrenInternal(),
        refreshNotesInternal(),
        refreshCogenitoriInternal(),
        refreshPendingInternal(),
        refreshCustomPhotosInternal(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshChildrenInternal = async () => {
    try {
      const res = await apiRequest('GET', '/api/children');
      const data = await res.json();
      setChildrenList(data);
      if (data.length > 0 && !selectedChildId) {
        setSelectedChildId(data[0].id);
      }
    } catch {}
  };

  const refreshNotesInternal = async () => {
    try {
      const res = await apiRequest('GET', '/api/notes');
      const data = await res.json();
      setNotesList(data);
    } catch {}
  };

  const refreshCogenitoriInternal = async () => {
    try {
      const res = await apiRequest('GET', '/api/cogenitore');
      const data = await res.json();
      setCogenitori(data.cogenitori || []);
    } catch {}
  };

  const refreshPendingInternal = async () => {
    try {
      const res = await apiRequest('GET', '/api/pending');
      const data = await res.json();
      setPendingList(data || []);
    } catch {}
  };

  const refreshCustomPhotosInternal = async () => {
    try {
      const res = await apiRequest('GET', '/api/custom-photos');
      const data = await res.json();
      setCustomPhotos(data || {});
    } catch {}
  };

  const setCustomPhotoFn = async (childId: string, photoUrl: string) => {
    try {
      await apiRequest('POST', `/api/custom-photos/${childId}`, { photoUrl });
      setCustomPhotos(prev => ({ ...prev, [childId]: photoUrl }));
    } catch (error) {
      console.error('Error setting custom photo:', error);
    }
  };

  const getChildPhoto = (childId: string): string | null => {
    if (customPhotos[childId]) {
      console.log('[PHOTO] Foto personalizzata trovata per', childId, ':', customPhotos[childId].substring(0, 60));
      return customPhotos[childId];
    }
    const child = childrenList.find(c => c.id === childId);
    if (child?.photoUri && child.photoUri.startsWith('http')) {
      console.log('[PHOTO] Foto condivisa trovata per', childId, ':', child.photoUri.substring(0, 60));
      return child.photoUri;
    }
    console.log('[PHOTO] Nessuna foto per', childId, '- photoUri:', child?.photoUri || '(vuoto)');
    return null;
  };

  const addChild = async (child: { name: string; birthDate: string; gender?: string; photoUri?: string; coParentName?: string; cardColor?: string; selectedCogenitori?: string[] }) => {
    try {
      const res = await apiRequest('POST', '/api/children', child);
      const newChild = await res.json();
      setChildrenList(prev => [...prev, newChild]);
      if (!selectedChildId) setSelectedChildId(newChild.id);
      return { success: true, childId: newChild.id };
    } catch (error: any) {
      const msg = error?.message || 'Errore';
      const cleanMsg = msg.replace(/^\d+:\s*/, '');
      return { success: false, message: cleanMsg };
    }
  };

  const updateChildFn = async (id: string, data: { name?: string; birthDate?: string; gender?: string; photoUri?: string; coParentName?: string; cardColor?: string; cogenitori?: string }) => {
    try {
      const res = await apiRequest('PUT', `/api/children/${id}`, data);
      const updated = await res.json();
      setChildrenList(prev => prev.map(c => c.id === id ? updated : c));
      return { success: true };
    } catch (error: any) {
      const msg = error?.message || 'Errore';
      const cleanMsg = msg.replace(/^\d+:\s*/, '');
      return { success: false, message: cleanMsg };
    }
  };

  const removeChild = async (id: string) => {
    try {
      await apiRequest('DELETE', `/api/children/${id}`);
      setChildrenList(prev => {
        const updated = prev.filter(c => c.id !== id);
        if (selectedChildId === id) {
          setSelectedChildId(updated.length > 0 ? updated[0].id : null);
        }
        return updated;
      });
    } catch {}
  };

  const selectChild = (id: string) => {
    setSelectedChildId(id);
  };

  const addNote = async (text: string, author: string, tags?: string, chosenColor?: string) => {
    const color = chosenColor || NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
    const rotation = String((Math.random() - 0.5) * 6);
    try {
      const res = await apiRequest('POST', '/api/notes', { text, color, rotation, author, tags });
      const newNote = await res.json();
      setNotesList(prev => [newNote, ...prev]);
    } catch {}
  };

  const updateNoteFn = async (id: string, data: { text?: string; color?: string; tags?: string }) => {
    try {
      const res = await apiRequest('PUT', `/api/notes/${id}`, data);
      const updated = await res.json();
      setNotesList(prev => prev.map(n => n.id === id ? updated : n));
      return { success: true };
    } catch (error: any) {
      const msg = error?.message || 'Errore';
      const cleanMsg = msg.replace(/^\d+:\s*/, '');
      return { success: false, message: cleanMsg };
    }
  };

  const removeNote = async (id: string) => {
    try {
      await apiRequest('DELETE', `/api/notes/${id}`);
      setNotesList(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  const approvePending = async (id: string) => {
    try {
      await apiRequest('POST', `/api/pending/${id}/approve`);
      setPendingList(prev => prev.filter(p => p.id !== id));
      await refreshChildrenInternal();
    } catch {}
  };

  const rejectPending = async (id: string) => {
    try {
      await apiRequest('POST', `/api/pending/${id}/reject`);
      setPendingList(prev => prev.filter(p => p.id !== id));
    } catch {}
  };

  const getCogenitoreNameById = (uid: string): string | null => {
    const cog = cogenitori.find(c => c.id === uid);
    return cog?.name || null;
  };

  const value = useMemo(() => ({
    children: childrenList,
    selectedChildId,
    notes: notesList,
    cogenitori,
    pendingChanges: pendingList,
    customPhotos,
    addChild,
    updateChild: updateChildFn,
    removeChild,
    selectChild,
    addNote,
    updateNote: updateNoteFn,
    removeNote,
    refreshChildren: refreshChildrenInternal,
    refreshNotes: refreshNotesInternal,
    refreshCogenitori: refreshCogenitoriInternal,
    refreshPending: refreshPendingInternal,
    refreshCustomPhotos: refreshCustomPhotosInternal,
    setCustomPhoto: setCustomPhotoFn,
    getChildPhoto,
    approvePending,
    rejectPending,
    getCogenitoreNameById,
    isLoading,
  }), [childrenList, selectedChildId, notesList, cogenitori, pendingList, customPhotos, isLoading]);

  return (
    <AppContext.Provider value={value}>
      {childrenProp}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
