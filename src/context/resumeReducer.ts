import { normalizeSectionOrder } from '../lib/resumeModel.ts';
import type { PersonalInfo, Resume, SectionItem, SectionType } from '../types/resume.ts';

export type ResumeAction =
  | { type: 'HYDRATE'; resume: Resume }
  | { type: 'UPDATE_PERSONAL_INFO'; patch: Partial<PersonalInfo> }
  | { type: 'ADD_SECTION'; sectionType: SectionType }
  | { type: 'REMOVE_SECTION'; sectionType: SectionType }
  | { type: 'REORDER_SECTIONS'; fromIndex: number; toIndex: number }
  | { type: 'ADD_ITEM'; sectionType: SectionType }
  | { type: 'REMOVE_ITEM'; sectionType: SectionType; itemIndex: number }
  | { type: 'UPDATE_ITEM'; sectionType: SectionType; itemIndex: number; patch: Partial<SectionItem> }
  | { type: 'UPDATE_BULLET'; sectionType: SectionType; itemIndex: number; bulletIndex: number; text: string }
  | { type: 'ADD_BULLET'; sectionType: SectionType; itemIndex: number }
  | { type: 'REMOVE_BULLET'; sectionType: SectionType; itemIndex: number; bulletIndex: number }
  | { type: 'SET_TEMPLATE'; template: string };

function emptyItem(): SectionItem {
  return { title: '', subtitle: null, dateRange: '', bullets: [''] };
}

function mapSection(resume: Resume, sectionType: SectionType, fn: (items: SectionItem[]) => SectionItem[]): Resume {
  return {
    ...resume,
    sections: resume.sections.map((section) =>
      section.type === sectionType ? { ...section, items: fn(section.items) } : section
    ),
  };
}

export function resumeReducer(resume: Resume, action: ResumeAction): Resume {
  switch (action.type) {
    case 'HYDRATE':
      return action.resume;

    case 'UPDATE_PERSONAL_INFO':
      return { ...resume, personalInfo: { ...resume.personalInfo, ...action.patch } };

    case 'ADD_SECTION': {
      if (resume.sections.some((s) => s.type === action.sectionType)) return resume;
      return {
        ...resume,
        sections: [
          ...resume.sections,
          { type: action.sectionType, order: resume.sections.length, items: [emptyItem()] },
        ],
      };
    }

    case 'REMOVE_SECTION': {
      const filtered = resume.sections.filter((s) => s.type !== action.sectionType);
      return normalizeSectionOrder({ ...resume, sections: filtered });
    }

    case 'REORDER_SECTIONS': {
      const sections = [...resume.sections].sort((a, b) => a.order - b.order);
      const [moved] = sections.splice(action.fromIndex, 1);
      if (!moved) return resume;
      sections.splice(action.toIndex, 0, moved);
      return normalizeSectionOrder({ ...resume, sections });
    }

    case 'ADD_ITEM':
      return mapSection(resume, action.sectionType, (items) => [...items, emptyItem()]);

    case 'REMOVE_ITEM':
      return mapSection(resume, action.sectionType, (items) =>
        items.filter((_, i) => i !== action.itemIndex)
      );

    case 'UPDATE_ITEM':
      return mapSection(resume, action.sectionType, (items) =>
        items.map((item, i) => (i === action.itemIndex ? { ...item, ...action.patch } : item))
      );

    case 'UPDATE_BULLET':
      return mapSection(resume, action.sectionType, (items) =>
        items.map((item, i) =>
          i === action.itemIndex
            ? {
                ...item,
                bullets: item.bullets.map((b, bi) => (bi === action.bulletIndex ? action.text : b)),
              }
            : item
        )
      );

    case 'ADD_BULLET':
      return mapSection(resume, action.sectionType, (items) =>
        items.map((item, i) => (i === action.itemIndex ? { ...item, bullets: [...item.bullets, ''] } : item))
      );

    case 'REMOVE_BULLET':
      return mapSection(resume, action.sectionType, (items) =>
        items.map((item, i) =>
          i === action.itemIndex
            ? { ...item, bullets: item.bullets.filter((_, bi) => bi !== action.bulletIndex) }
            : item
        )
      );

    case 'SET_TEMPLATE':
      return { ...resume, selectedTemplate: action.template };

    default:
      return resume;
  }
}
