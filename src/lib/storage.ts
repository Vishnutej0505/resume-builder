import AsyncStorage from '@react-native-async-storage/async-storage';
import { createEmptyResume, createInitialAIUsage, normalizeSectionOrder } from './resumeModel.ts';
import type { AIUsage, Resume } from '../types/resume.ts';

export { createEmptyResume, createInitialAIUsage, normalizeSectionOrder };

const STORAGE_KEYS = {
  RESUME: 'resume',
  AI_USAGE: 'aiUsage',
} as const;

export async function loadResume(): Promise<Resume> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.RESUME);
  if (!raw) return createEmptyResume();
  // No migration needed yet — schemaVersion exists so one CAN be written
  // later without guessing at unversioned on-device data.
  return JSON.parse(raw) as Resume;
}

export async function saveResume(resume: Resume): Promise<void> {
  const normalized = normalizeSectionOrder({ ...resume, updatedAt: new Date().toISOString() });
  await AsyncStorage.setItem(STORAGE_KEYS.RESUME, JSON.stringify(normalized));
}

export async function loadAIUsage(): Promise<AIUsage> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.AI_USAGE);
  if (!raw) return createInitialAIUsage();
  return JSON.parse(raw) as AIUsage;
}

export async function saveAIUsage(aiUsage: AIUsage): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.AI_USAGE, JSON.stringify(aiUsage));
}
