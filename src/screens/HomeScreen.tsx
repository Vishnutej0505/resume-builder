import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PersonalInfoCard } from '../components/PersonalInfoCard.tsx';
import { SectionCard } from '../components/SectionCard.tsx';
import { useResume } from '../context/ResumeContext.tsx';
import { rewriteText } from '../lib/ai.ts';
import { colors, fontSize, radius, spacing, SECTION_LABELS } from '../theme/tokens.ts';
import { ALL_SECTION_TYPES } from '../types/resume.ts';

interface Props {
  onNavigateATS: () => void;
  onNavigatePreview: () => void;
  onNavigateSettings: () => void;
  onAIBlocked: () => void;
}

export function HomeScreen({ onNavigateATS, onNavigatePreview, onNavigateSettings, onAIBlocked }: Props) {
  const {
    resume,
    aiUsage,
    updatePersonalInfo,
    addSection,
    removeSection,
    addItem,
    removeItem,
    updateItem,
    updateBullet,
    addBullet,
    removeBullet,
    spendAICredit,
  } = useResume();
  const [pickerVisible, setPickerVisible] = useState(false);

  const canUseAI = aiUsage.subscriptionActive || aiUsage.freeCreditsRemaining > 0;
  const availableSectionTypes = ALL_SECTION_TYPES.filter(
    (t) => !resume.sections.some((s) => s.type === t)
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Resume Builder</Text>
        <View style={styles.headerRight}>
          <View style={styles.creditsChip}>
            <Text style={styles.creditsText}>
              {aiUsage.subscriptionActive ? 'Subscribed' : `${aiUsage.freeCreditsRemaining} credits left`}
            </Text>
          </View>
          <Pressable onPress={onNavigateSettings} accessibilityLabel="Settings" hitSlop={8}>
            <Text style={styles.gearIcon}>⚙</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <PersonalInfoCard personalInfo={resume.personalInfo} onChange={updatePersonalInfo} />

        {resume.sections.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No sections yet</Text>
            <Text style={styles.emptyBody}>
              Add your first section — Experience, Education, or Projects — and AI will help polish it.
            </Text>
          </View>
        ) : (
          resume.sections
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <SectionCard
                key={section.type}
                section={section}
                onRemoveSection={() => removeSection(section.type)}
                onAddItem={() => addItem(section.type)}
                onUpdateItem={(itemIndex, patch) => updateItem(section.type, itemIndex, patch)}
                onRemoveItem={(itemIndex) => removeItem(section.type, itemIndex)}
                onUpdateBullet={(itemIndex, bulletIndex, text) =>
                  updateBullet(section.type, itemIndex, bulletIndex, text)
                }
                onAddBullet={(itemIndex) => addBullet(section.type, itemIndex)}
                onRemoveBullet={(itemIndex, bulletIndex) => removeBullet(section.type, itemIndex, bulletIndex)}
                canUseAI={canUseAI}
                onBlocked={onAIBlocked}
                rewrite={rewriteText}
                onCreditSpent={spendAICredit}
              />
            ))
        )}

        {availableSectionTypes.length > 0 && (
          <Pressable style={styles.addSectionButton} onPress={() => setPickerVisible(true)}>
            <Text style={styles.addSectionText}>+ Add Section</Text>
          </Pressable>
        )}
      </ScrollView>

      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
          <View style={styles.modalSheet}>
            {availableSectionTypes.map((type) => (
              <Pressable
                key={type}
                style={styles.modalRow}
                onPress={() => {
                  addSection(type);
                  setPickerVisible(false);
                }}
              >
                <Text style={styles.modalRowText}>{SECTION_LABELS[type]}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <View style={styles.footerNav}>
        <View style={styles.navButton}>
          <View style={styles.navPill}>
            <Text style={styles.navIcon}>🏠</Text>
          </View>
          <Text style={[styles.navLabel, { color: colors.accent, fontWeight: '600' }]}>Home</Text>
        </View>
        <Pressable style={styles.navButton} onPress={onNavigateATS}>
          <Text style={styles.navIcon}>✓</Text>
          <Text style={styles.navLabel}>ATS Check</Text>
        </Pressable>
        <Pressable style={styles.navButton} onPress={onNavigatePreview}>
          <Text style={styles.navIcon}>◎</Text>
          <Text style={styles.navLabel}>Preview</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    height: 56,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: fontSize.bodyLg, fontWeight: '700', color: colors.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  creditsChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  creditsText: { fontSize: fontSize.caption, fontWeight: '600', color: colors.textSecondary },
  gearIcon: { fontSize: fontSize.h3, color: colors.textPrimary },
  body: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  emptyState: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  emptyTitle: { fontSize: fontSize.bodyLg, fontWeight: '600', color: colors.textPrimary },
  emptyBody: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', maxWidth: 260 },
  addSectionButton: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSectionText: { color: colors.accent, fontSize: fontSize.body, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bg, borderTopLeftRadius: radius.md + 8, borderTopRightRadius: radius.md + 8, padding: spacing.lg },
  modalRow: { paddingVertical: spacing.md },
  modalRowText: { fontSize: fontSize.bodyLg, color: colors.textPrimary },
  footerNav: {
    height: 64,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
  },
  navButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  navPill: {
    width: 56,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: { fontSize: fontSize.bodyLg, color: colors.textSecondary },
  navLabel: { fontSize: fontSize.caption, color: colors.textSecondary },
});
