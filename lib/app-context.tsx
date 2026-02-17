import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { apiRequest } from '@/lib/query-client';

export interface Child {
  id: string;
  name: string;
  birthDate: string;
  gender?: string | null;
  photoUri?: string | null;
  coParentName?: string | null;
  cardColor?: string | null;
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

interface AppContextValue {
  children: Child[];
  selectedChildId: string | null;
  notes: Note[];
  addChild: (child: { name: string; birthDate: string; gender?: string; photoUri?: string; coParentName?: string; cardColor?: string }) => Promise<{ success: boolean; message?: string }>;
  updateChild: (id: string, data: { name?: string; birthDate?: string; gender?: string; photoUri?: string; coParentName?: string; cardColor?: string }) => Promise<{ success: boolean; message?: string }>;
  removeChild: (id: string) => Promise<void>;
  selectChild: (id: string) => void;
  addNote: (text: string, author: string, tags?: string) => Promise<void>;
  updateNote: (id: string, data: { text?: string; color?: string; tags?: string }) => Promise<{ success: boolean; message?: string }>;
  removeNote: (id: string) => Promise<void>;
  refreshChildren: () => Promise<void>;
  refreshNotes: () => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const NOTE_COLORS = ['#FFD3B6', '#C7CEEA', '#A8E6CF', '#FFF5E1', '#FFE8D9', '#D4F5E5', '#E3E7F5'];

export function AppProvider({ children: childrenProp }: { children: ReactNode }) {
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([refreshChildrenInternal(), refreshNotesInternal()]);
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
      setNotes(data);
    } catch {}
  };

  const addChild = async (child: { name: string; birthDate: string; gender?: string; photoUri?: string; coParentName?: string; cardColor?: string }) => {
    try {
      const res = await apiRequest('POST', '/api/children', child);
      const newChild = await res.json();
      setChildrenList(prev => [...prev, newChild]);
      if (!selectedChildId) setSelectedChildId(newChild.id);
      return { success: true };
    } catch (error: any) {
      const msg = error?.message || 'Errore';
      const cleanMsg = msg.replace(/^\d+:\s*/, '');
      return { success: false, message: cleanMsg };
    }
  };

  const updateChildFn = async (id: string, data: { name?: string; birthDate?: string; gender?: string; photoUri?: string; coParentName?: string; cardColor?: string }) => {
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

  const addNote = async (text: string, author: string, tags?: string) => {
    const color = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
    const rotation = String((Math.random() - 0.5) * 6);
    try {
      const res = await apiRequest('POST', '/api/notes', { text, color, rotation, author, tags });
      const newNote = await res.json();
      setNotes(prev => [newNote, ...prev]);
    } catch {}
  };

  const updateNoteFn = async (id: string, data: { text?: string; color?: string; tags?: string }) => {
    try {
      const res = await apiRequest('PUT', `/api/notes/${id}`, data);
      const updated = await res.json();
      setNotes(prev => prev.map(n => n.id === id ? updated : n));
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
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  const value = useMemo(() => ({
    children: childrenList,
    selectedChildId,
    notes,
    addChild,
    updateChild: updateChildFn,
    removeChild,
    selectChild,
    addNote,
    updateNote: updateNoteFn,
    removeNote,
    refreshChildren: refreshChildrenInternal,
    refreshNotes: refreshNotesInternal,
    isLoading,
  }), [childrenList, selectedChildId, notes, isLoading]);

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
