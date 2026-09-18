// DESIGN_BRIEF.md Section 3 — the fixed lists. Never pick a color, spacing,
// or radius value outside these.
export const colors = {
  accent: '#2563EB',
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  bg: '#FFFFFF',
  surface: '#F8FAFC',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 4, md: 8, pill: 999 } as const;

export const fontSize = { caption: 12, body: 14, bodyLg: 16, h3: 20, h2: 24, h1: 32 } as const;

export const SECTION_LABELS: Record<string, string> = {
  summary: 'Summary',
  education: 'Education',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  certifications: 'Certifications',
};
