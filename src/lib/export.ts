import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildResumeDocxBase64 } from './docxExport.ts';
import type { Resume } from '../types/resume.ts';

export { validateForExport } from './resumeModel.ts';
export type { ExportValidation } from './resumeModel.ts';

export async function exportPdf(html: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}

export async function exportWord(resume: Resume): Promise<void> {
  const base64 = await buildResumeDocxBase64(resume);
  const file = new File(Paths.cache, 'resume.docx');
  file.create({ overwrite: true });
  file.write(base64, { encoding: 'base64' });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      UTI: 'org.openxmlformats.wordprocessingml.document',
    });
  }
}
