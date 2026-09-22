import { useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useResume } from '../context/ResumeContext.tsx';
import { exportPdf, exportWord, validateForExport } from '../lib/export.ts';
import { renderClassicTemplate } from '../lib/templates/classic.ts';
import { renderModernTemplate } from '../lib/templates/modern.ts';
import { colors, fontSize, radius, spacing } from '../theme/tokens.ts';

interface Props {
  onNavigateHome: () => void;
  onNavigateATS: () => void;
}

const TEMPLATES: Record<string, { label: string; render: (resume: Parameters<typeof renderClassicTemplate>[0]) => string }> = {
  classic: { label: 'Classic', render: renderClassicTemplate },
  modern: { label: 'Modern', render: renderModernTemplate },
};
const TEMPLATE_ORDER = ['classic', 'modern'];

export function PreviewScreen({ onNavigateHome, onNavigateATS }: Props) {
  const { resume, isTailoring, setTemplate } = useResume();
  const [isExporting, setIsExporting] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const activeTemplate = TEMPLATES[resume.selectedTemplate] ? resume.selectedTemplate : 'classic';
  const html = useMemo(
    () => TEMPLATES[activeTemplate].render(resume),
    [resume, activeTemplate]
  );

  function handleExportPress() {
    const validation = validateForExport(resume);
    if (!validation.ok) {
      Alert.alert(
        'Missing info',
        validation.missingField === 'name'
          ? 'Add your name before exporting.'
          : 'Add your email before exporting.'
      );
      return;
    }
    setPickerVisible(true);
  }

  async function handleExport(format: 'pdf' | 'word') {
    setPickerVisible(false);
    setIsExporting(true);
    try {
      if (format === 'pdf') {
        await exportPdf(html);
      } else {
        await exportWord(resume);
      }
    } catch {
      Alert.alert('Export failed', 'Something went wrong generating the file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Preview</Text>
        {isTailoring && <Text style={styles.tailoringChip}>Tailored draft</Text>}
      </View>

      <View style={styles.templateSwitcher}>
        {TEMPLATE_ORDER.map((key) => (
          <Pressable
            key={key}
            style={[styles.templateOption, activeTemplate === key && styles.templateOptionActive]}
            onPress={() => setTemplate(key)}
          >
            <Text style={[styles.templateOptionText, activeTemplate === key && styles.templateOptionTextActive]}>
              {TEMPLATES[key].label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.documentContainer}>
        {Platform.OS === 'web' ? (
          // react-native-webview doesn't support the `source={{html}}` API on
          // web; an iframe with a blob URL is the direct web equivalent.
          <WebPreviewFallback html={html} />
        ) : (
          <WebView originWhitelist={['*']} source={{ html }} style={styles.webview} />
        )}
      </View>

      <View style={styles.exportBar}>
        <Pressable style={styles.exportButton} onPress={handleExportPress} disabled={isExporting}>
          <Text style={styles.exportButtonText}>{isExporting ? 'Exporting…' : 'Export'}</Text>
        </Pressable>
      </View>

      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
          <View style={styles.modalSheet}>
            <Pressable style={styles.modalRow} onPress={() => handleExport('pdf')}>
              <Text style={styles.modalRowText}>Export as PDF</Text>
            </Pressable>
            <Pressable style={styles.modalRow} onPress={() => handleExport('word')}>
              <Text style={styles.modalRowText}>Export as Word</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <View style={styles.footerNav}>
        <Pressable style={styles.navButton} onPress={onNavigateHome}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </Pressable>
        <Pressable style={styles.navButton} onPress={onNavigateATS}>
          <Text style={styles.navIcon}>✓</Text>
          <Text style={styles.navLabel}>ATS Check</Text>
        </Pressable>
        <View style={styles.navButton}>
          <View style={styles.navPill}>
            <Text style={styles.navIcon}>◎</Text>
          </View>
          <Text style={[styles.navLabel, { color: colors.accent, fontWeight: '600' }]}>Preview</Text>
        </View>
      </View>
    </View>
  );
}

function WebPreviewFallback({ html }: { html: string }) {
  const IFrame = 'iframe' as unknown as ComponentType<{ srcDoc: string; style: object }>;
  return <IFrame srcDoc={html} style={{ width: '100%', height: '100%', border: 'none' }} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    height: 56,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: fontSize.bodyLg, fontWeight: '700', color: colors.textPrimary },
  tailoringChip: {
    fontSize: fontSize.caption,
    fontWeight: '700',
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  templateSwitcher: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginLeft: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 3,
    gap: 2,
  },
  templateOption: {
    height: 30,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateOptionActive: {
    backgroundColor: colors.bg,
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  templateOptionText: { fontSize: fontSize.caption, fontWeight: '500', color: colors.textSecondary },
  templateOptionTextActive: { fontWeight: '600', color: colors.textPrimary },
  documentContainer: {
    flex: 1,
    margin: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  webview: { flex: 1 },
  exportBar: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  exportButton: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonText: { color: '#fff', fontSize: fontSize.bodyLg, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.md + 8,
    borderTopRightRadius: radius.md + 8,
    padding: spacing.lg,
  },
  modalRow: { paddingVertical: spacing.md },
  modalRowText: { fontSize: fontSize.bodyLg, color: colors.textPrimary },
  footerNav: { height: 64, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row' },
  navButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  navPill: { width: 56, height: 28, borderRadius: radius.pill, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: fontSize.bodyLg, color: colors.textSecondary },
  navLabel: { fontSize: fontSize.caption, color: colors.textSecondary },
});
