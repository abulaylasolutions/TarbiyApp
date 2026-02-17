import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export interface Child {
  id: string;
  name: string;
  birthDate: string;
  photoUri?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  text: string;
  color: string;
  rotation: number;
  createdAt: string;
  author: string;
}

interface AppContextValue {
  children: Child[];
  selectedChildId: string | null;
  notes: Note[];
  isPremium: boolean;
  parentName: string;
  addChild: (child: Omit<Child, 'id' | 'createdAt'>) => Promise<void>;
  removeChild: (id: string) => Promise<void>;
  updateChild: (id: string, updates: Partial<Child>) => Promise<void>;
  selectChild: (id: string) => void;
  addNote: (text: string) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  setPremium: (value: boolean) => void;
  setParentName: (name: string) => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEYS = {
  CHILDREN: '@tarbiyapp_children',
  NOTES: '@tarbiyapp_notes',
  SELECTED_CHILD: '@tarbiyapp_selected_child',
  IS_PREMIUM: '@tarbiyapp_is_premium',
  PARENT_NAME: '@tarbiyapp_parent_name',
};

const NOTE_COLORS = ['#FFD3B6', '#C7CEEA', '#A8E6CF', '#FFF5E1', '#FFE8D9', '#D4F5E5', '#E3E7F5'];

export function AppProvider({ children: childrenProp }: { children: ReactNode }) {
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [parentName, setParentNameState] = useState('Genitore');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [childrenData, notesData, selectedId, premiumData, nameData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CHILDREN),
        AsyncStorage.getItem(STORAGE_KEYS.NOTES),
        AsyncStorage.getItem(STORAGE_KEYS.SELECTED_CHILD),
        AsyncStorage.getItem(STORAGE_KEYS.IS_PREMIUM),
        AsyncStorage.getItem(STORAGE_KEYS.PARENT_NAME),
      ]);

      if (childrenData) setChildrenList(JSON.parse(childrenData));
      if (notesData) setNotes(JSON.parse(notesData));
      if (selectedId) setSelectedChildId(selectedId);
      if (premiumData) setIsPremium(JSON.parse(premiumData));
      if (nameData) setParentNameState(nameData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addChild = async (child: Omit<Child, 'id' | 'createdAt'>) => {
    const newChild: Child = {
      ...child,
      id: Crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...childrenList, newChild];
    setChildrenList(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(updated));
    if (!selectedChildId) {
      setSelectedChildId(newChild.id);
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_CHILD, newChild.id);
    }
  };

  const removeChild = async (id: string) => {
    const updated = childrenList.filter(c => c.id !== id);
    setChildrenList(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(updated));
    if (selectedChildId === id) {
      const newSelected = updated.length > 0 ? updated[0].id : null;
      setSelectedChildId(newSelected);
      if (newSelected) {
        await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_CHILD, newSelected);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_CHILD);
      }
    }
  };

  const updateChild = async (id: string, updates: Partial<Child>) => {
    const updated = childrenList.map(c => c.id === id ? { ...c, ...updates } : c);
    setChildrenList(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(updated));
  };

  const selectChild = (id: string) => {
    setSelectedChildId(id);
    AsyncStorage.setItem(STORAGE_KEYS.SELECTED_CHILD, id);
  };

  const addNote = async (text: string) => {
    const newNote: Note = {
      id: Crypto.randomUUID(),
      text,
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      rotation: (Math.random() - 0.5) * 6,
      createdAt: new Date().toISOString(),
      author: parentName,
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updated));
  };

  const removeNote = async (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updated));
  };

  const setPremiumValue = (value: boolean) => {
    setIsPremium(value);
    AsyncStorage.setItem(STORAGE_KEYS.IS_PREMIUM, JSON.stringify(value));
  };

  const setParentName = async (name: string) => {
    setParentNameState(name);
    await AsyncStorage.setItem(STORAGE_KEYS.PARENT_NAME, name);
  };

  const value = useMemo(() => ({
    children: childrenList,
    selectedChildId,
    notes,
    isPremium,
    parentName,
    addChild,
    removeChild,
    updateChild,
    selectChild,
    addNote,
    removeNote,
    setPremium: setPremiumValue,
    setParentName,
    isLoading,
  }), [childrenList, selectedChildId, notes, isPremium, parentName, isLoading]);

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
