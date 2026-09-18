import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export { validateForExport } from './resumeModel.ts';
export type { ExportValidation } from './resumeModel.ts';

export async function exportPdf(html: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}
