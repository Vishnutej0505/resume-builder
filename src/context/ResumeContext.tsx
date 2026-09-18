import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { loadAIUsage, loadResume, saveAIUsage, saveResume } from '../lib/storage.ts';
import type { AIUsage, PersonalInfo, SectionItem, SectionType } from '../types/resume.ts';
import { resumeReducer } from './resumeReducer.ts';

const SAVE_DEBOUNCE_MS = 500;

interface ResumeContextValue {
  isLoaded: boolean;
  resume: ReturnType<typeof resumeReducer>;
  aiUsage: AIUsage;
  updatePersonalInfo: (patch: Partial<PersonalInfo>) => void;
  addSection: (sectionType: SectionType) => void;
  removeSection: (sectionType: SectionType) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  addItem: (sectionType: SectionType) => void;
  removeItem: (sectionType: SectionType, itemIndex: number) => void;
  updateItem: (sectionType: SectionType, itemIndex: number, patch: Partial<SectionItem>) => void;
  updateBullet: (sectionType: SectionType, itemIndex: number, bulletIndex: number, text: string) => void;
  addBullet: (sectionType: SectionType, itemIndex: number) => void;
  removeBullet: (sectionType: SectionType, itemIndex: number, bulletIndex: number) => void;
  setTemplate: (template: string) => void;
  spendAICredit: () => void;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [resume, dispatch] = useReducer(resumeReducer, undefined, () => ({
    schemaVersion: 1,
    personalInfo: { name: '', email: '', phone: '', location: '', linkedIn: null },
    sections: [],
    selectedTemplate: 'classic',
    updatedAt: new Date().toISOString(),
  }));
  const [aiUsage, setAiUsage] = useState<AIUsage | null>(null);

  // Hydrate from AsyncStorage once on mount.
  useEffect(() => {
    (async () => {
      const [loadedResume, loadedAIUsage] = await Promise.all([loadResume(), loadAIUsage()]);
      dispatch({ type: 'HYDRATE', resume: loadedResume });
      setAiUsage(loadedAIUsage);
      setIsLoaded(true);
    })();
  }, []);

  // Debounced persistence — write on pause, not on keystroke (TRD.md Section 4).
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveResume(resume);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [resume, isLoaded]);

  useEffect(() => {
    if (!isLoaded || !aiUsage) return;
    saveAIUsage(aiUsage);
  }, [aiUsage, isLoaded]);

  const value = useMemo<ResumeContextValue>(
    () => ({
      isLoaded,
      resume,
      aiUsage: aiUsage ?? {
        schemaVersion: 1,
        freeCreditsRemaining: 0,
        subscriptionActive: false,
        subscriptionProductId: null,
        lastSyncedAt: new Date().toISOString(),
      },
      updatePersonalInfo: (patch) => dispatch({ type: 'UPDATE_PERSONAL_INFO', patch }),
      addSection: (sectionType) => dispatch({ type: 'ADD_SECTION', sectionType }),
      removeSection: (sectionType) => dispatch({ type: 'REMOVE_SECTION', sectionType }),
      reorderSections: (fromIndex, toIndex) => dispatch({ type: 'REORDER_SECTIONS', fromIndex, toIndex }),
      addItem: (sectionType) => dispatch({ type: 'ADD_ITEM', sectionType }),
      removeItem: (sectionType, itemIndex) => dispatch({ type: 'REMOVE_ITEM', sectionType, itemIndex }),
      updateItem: (sectionType, itemIndex, patch) =>
        dispatch({ type: 'UPDATE_ITEM', sectionType, itemIndex, patch }),
      updateBullet: (sectionType, itemIndex, bulletIndex, text) =>
        dispatch({ type: 'UPDATE_BULLET', sectionType, itemIndex, bulletIndex, text }),
      addBullet: (sectionType, itemIndex) => dispatch({ type: 'ADD_BULLET', sectionType, itemIndex }),
      removeBullet: (sectionType, itemIndex, bulletIndex) =>
        dispatch({ type: 'REMOVE_BULLET', sectionType, itemIndex, bulletIndex }),
      setTemplate: (template) => dispatch({ type: 'SET_TEMPLATE', template }),
      spendAICredit: () =>
        setAiUsage((prev) =>
          prev && !prev.subscriptionActive
            ? { ...prev, freeCreditsRemaining: Math.max(0, prev.freeCreditsRemaining - 1) }
            : prev
        ),
    }),
    [isLoaded, resume, aiUsage]
  );

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
}

export function useResume(): ResumeContextValue {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error('useResume must be used within a ResumeProvider');
  return ctx;
}
