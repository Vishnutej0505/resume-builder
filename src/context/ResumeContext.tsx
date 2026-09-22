import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { loadAIUsage, loadResume, saveAIUsage, saveResume } from '../lib/storage.ts';
import type { AIUsage, PersonalInfo, Resume, ResumeSection, SectionItem, SectionType } from '../types/resume.ts';
import { resumeReducer } from './resumeReducer.ts';
import type { ResumeAction } from './resumeReducer.ts';

const SAVE_DEBOUNCE_MS = 500;

interface ResumeContextValue {
  isLoaded: boolean;
  resume: Resume;
  aiUsage: AIUsage;
  // True while viewing a Full-Rewrite result instead of the persisted master
  // — per PRD.md Section 6 ("Option A"), tailored output is session-only and
  // is never written back into the master resume.
  isTailoring: boolean;
  startTailoring: (tailoredResume: Resume) => void;
  discardTailoring: () => void;
  // Replaces the master resume's personalInfo/sections wholesale (Resume
  // Import). Always targets the master directly, bypassing tailoring mode —
  // importing new content while viewing a stale tailored draft would be
  // confusing, so any active tailoring is dropped first.
  importResume: (personalInfo: PersonalInfo, sections: ResumeSection[]) => void;
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
  spendAICredits: (count: number) => void;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);

function emptyResume(): Resume {
  return {
    schemaVersion: 1,
    personalInfo: { name: '', email: '', phone: '', location: '', linkedIn: null },
    sections: [],
    selectedTemplate: 'classic',
    updatedAt: new Date().toISOString(),
  };
}

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [masterResume, setMasterResume] = useState<Resume>(emptyResume);
  // Non-null only during a Full Rewrite review — never persisted, never
  // merged back into masterResume (ARCHITECTURE.md Section 2, PRD Section 6).
  const [tailoredResume, setTailoredResume] = useState<Resume | null>(null);
  const [aiUsage, setAiUsage] = useState<AIUsage | null>(null);

  const isTailoring = tailoredResume !== null;
  const activeResume = tailoredResume ?? masterResume;

  // Every mutation applies to whichever resume is currently active, so
  // screens never need to know tailoring mode exists.
  const applyAction = useCallback(
    (action: ResumeAction) => {
      if (tailoredResume) {
        setTailoredResume((prev) => (prev ? resumeReducer(prev, action) : prev));
      } else {
        setMasterResume((prev) => resumeReducer(prev, action));
      }
    },
    [tailoredResume]
  );

  // Hydrate from AsyncStorage once on mount.
  useEffect(() => {
    (async () => {
      const [loadedResume, loadedAIUsage] = await Promise.all([loadResume(), loadAIUsage()]);
      setMasterResume(loadedResume);
      setAiUsage(loadedAIUsage);
      setIsLoaded(true);
    })();
  }, []);

  // Debounced persistence — write on pause, not on keystroke (TRD.md Section
  // 4). Only the master resume is ever persisted; a tailored copy in review
  // must never overwrite it on disk.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveResume(masterResume);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [masterResume, isLoaded]);

  useEffect(() => {
    if (!isLoaded || !aiUsage) return;
    saveAIUsage(aiUsage);
  }, [aiUsage, isLoaded]);

  const value = useMemo<ResumeContextValue>(
    () => ({
      isLoaded,
      resume: activeResume,
      aiUsage: aiUsage ?? {
        schemaVersion: 1,
        freeCreditsRemaining: 0,
        subscriptionActive: false,
        subscriptionProductId: null,
        lastSyncedAt: new Date().toISOString(),
      },
      isTailoring,
      startTailoring: (tailored) => setTailoredResume(tailored),
      discardTailoring: () => setTailoredResume(null),
      importResume: (personalInfo, sections) => {
        setTailoredResume(null);
        setMasterResume((prev) => ({ ...prev, personalInfo, sections }));
      },
      updatePersonalInfo: (patch) => applyAction({ type: 'UPDATE_PERSONAL_INFO', patch }),
      addSection: (sectionType) => applyAction({ type: 'ADD_SECTION', sectionType }),
      removeSection: (sectionType) => applyAction({ type: 'REMOVE_SECTION', sectionType }),
      reorderSections: (fromIndex, toIndex) => applyAction({ type: 'REORDER_SECTIONS', fromIndex, toIndex }),
      addItem: (sectionType) => applyAction({ type: 'ADD_ITEM', sectionType }),
      removeItem: (sectionType, itemIndex) => applyAction({ type: 'REMOVE_ITEM', sectionType, itemIndex }),
      updateItem: (sectionType, itemIndex, patch) =>
        applyAction({ type: 'UPDATE_ITEM', sectionType, itemIndex, patch }),
      updateBullet: (sectionType, itemIndex, bulletIndex, text) =>
        applyAction({ type: 'UPDATE_BULLET', sectionType, itemIndex, bulletIndex, text }),
      addBullet: (sectionType, itemIndex) => applyAction({ type: 'ADD_BULLET', sectionType, itemIndex }),
      removeBullet: (sectionType, itemIndex, bulletIndex) =>
        applyAction({ type: 'REMOVE_BULLET', sectionType, itemIndex, bulletIndex }),
      setTemplate: (template) => applyAction({ type: 'SET_TEMPLATE', template }),
      spendAICredit: () =>
        setAiUsage((prev) =>
          prev && !prev.subscriptionActive
            ? { ...prev, freeCreditsRemaining: Math.max(0, prev.freeCreditsRemaining - 1) }
            : prev
        ),
      spendAICredits: (count) =>
        setAiUsage((prev) =>
          prev && !prev.subscriptionActive
            ? { ...prev, freeCreditsRemaining: Math.max(0, prev.freeCreditsRemaining - count) }
            : prev
        ),
    }),
    [isLoaded, activeResume, aiUsage, isTailoring, applyAction]
  );

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
}

export function useResume(): ResumeContextValue {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error('useResume must be used within a ResumeProvider');
  return ctx;
}
