import { useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useResume } from '../context/ResumeContext.tsx';
import { exportPdf, validateForExport } from '../lib/export.ts';
import { renderClassicTemplate } from '../lib/templates/classic.ts';
import { colors, fontSize, radius, spacing } from '../theme/tokens.ts';

interface Props {
  onNavigateHome: () => void;
  onNavigateATS: () => void;
}

export function PreviewScreen({ onNavigateHome, onNavigateATS }: Props) {
  const { resume } = useResume();
  const [isExporting, setIsExporting] = useState(false);
  const html = useMemo(() => renderClassicTemplate(resume), [resume]);

  async function handleExportPdf() {
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
    setIsExporting(true);
    try {
      await exportPdf(html);
    } catch {
      Alert.alert('Export failed', 'Something went wrong generating the PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Preview</Text>
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
        <Pressable style={styles.exportButton} onPress={handleExportPdf} disabled={isExporting}>
          <Text style={styles.exportButtonText}>{isExporting ? 'Exporting…' : 'Export PDF'}</Text>
        </Pressable>
      </View>

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
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: fontSize.bodyLg, fontWeight: '700', color: colors.textPrimary },
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
  footerNav: { height: 64, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row' },
  navButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  navPill: { width: 56, height: 28, borderRadius: radius.pill, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: fontSize.bodyLg, color: colors.textSecondary },
  navLabel: { fontSize: fontSize.caption, color: colors.textSecondary },
});
