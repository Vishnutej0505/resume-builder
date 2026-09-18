import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { SECTION_LABELS } from '../theme/tokens.ts';
import type { Resume } from '../types/resume.ts';

// A genuinely separate rendering pipeline from classic.ts (TRD.md Section 3
// — real added work, kept visually consistent by hand, not shared code).
export async function buildResumeDocxBase64(resume: Resume): Promise<string> {
  const { personalInfo, sections } = resume;

  const children: Paragraph[] = [
    new Paragraph({ text: personalInfo.name || 'Your Name', heading: HeadingLevel.TITLE }),
    new Paragraph({
      children: [
        new TextRun(
          [personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedIn]
            .filter(Boolean)
            .join(' | ')
        ),
      ],
    }),
  ];

  for (const section of [...sections].sort((a, b) => a.order - b.order)) {
    children.push(
      new Paragraph({ text: (SECTION_LABELS[section.type] ?? section.type).toUpperCase(), heading: HeadingLevel.HEADING_2 })
    );
    for (const item of section.items) {
      if (section.type !== 'skills') {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: item.title, bold: true }),
              ...(item.dateRange ? [new TextRun({ text: `  ${item.dateRange}`, italics: true })] : []),
            ],
          })
        );
      }
      for (const bullet of item.bullets.filter((b) => b.trim())) {
        children.push(new Paragraph({ text: bullet, bullet: { level: 0 } }));
      }
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBase64String(doc);
}
