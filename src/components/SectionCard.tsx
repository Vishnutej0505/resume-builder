import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontSize, radius, spacing, SECTION_LABELS } from '../theme/tokens.ts';
import type { ResumeSection, SectionItem } from '../types/resume.ts';
import { BulletRow } from './BulletRow.tsx';
import type { rewriteText } from '../lib/ai.ts';

interface Props {
  section: ResumeSection;
  onRemoveSection: () => void;
  onAddItem: () => void;
  onUpdateItem: (itemIndex: number, patch: Partial<SectionItem>) => void;
  onRemoveItem: (itemIndex: number) => void;
  onUpdateBullet: (itemIndex: number, bulletIndex: number, text: string) => void;
  onAddBullet: (itemIndex: number) => void;
  onRemoveBullet: (itemIndex: number, bulletIndex: number) => void;
  canUseAI: boolean;
  onBlocked: () => void;
  rewrite: typeof rewriteText;
  onCreditSpent: () => void;
}

export function SectionCard({
  section,
  onRemoveSection,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onUpdateBullet,
  onAddBullet,
  onRemoveBullet,
  canUseAI,
  onBlocked,
  rewrite,
  onCreditSpent,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{SECTION_LABELS[section.type] ?? section.type}</Text>
        <Pressable onPress={onRemoveSection} accessibilityLabel={`Delete ${SECTION_LABELS[section.type]} section`} hitSlop={8}>
          <Text style={styles.deleteText}>Remove</Text>
        </Pressable>
      </View>

      {section.items.map((item, itemIndex) => (
        <View key={itemIndex} style={styles.item}>
          {section.type !== 'skills' && (
            <>
              <TextInput
                style={styles.itemTitleInput}
                value={item.title}
                onChangeText={(title) => onUpdateItem(itemIndex, { title })}
                placeholder="Title (e.g. Frontend Intern, Company)"
                placeholderTextColor={colors.textSecondary}
              />
              <TextInput
                style={styles.itemDateInput}
                value={item.dateRange}
                onChangeText={(dateRange) => onUpdateItem(itemIndex, { dateRange })}
                placeholder="Jun 2025 – Present"
                placeholderTextColor={colors.textSecondary}
              />
            </>
          )}

          {item.bullets.map((bullet, bulletIndex) => (
            <BulletRow
              key={bulletIndex}
              sectionType={section.type}
              text={bullet}
              onChangeText={(text) => onUpdateBullet(itemIndex, bulletIndex, text)}
              onRemove={() => onRemoveBullet(itemIndex, bulletIndex)}
              canUseAI={canUseAI}
              onBlocked={onBlocked}
              rewrite={rewrite}
              onCreditSpent={onCreditSpent}
            />
          ))}

          <Pressable onPress={() => onAddBullet(itemIndex)} style={styles.addBulletButton}>
            <Text style={styles.addBulletText}>+ Add bullet</Text>
          </Pressable>

          {section.items.length > 1 && (
            <Pressable onPress={() => onRemoveItem(itemIndex)}>
              <Text style={styles.removeItemText}>Remove this entry</Text>
            </Pressable>
          )}
        </View>
      ))}

      <Pressable onPress={onAddItem} style={styles.addItemButton}>
        <Text style={styles.addItemText}>+ Add {SECTION_LABELS[section.type]?.toLowerCase() ?? 'entry'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md + 4,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  deleteText: { fontSize: fontSize.caption, color: colors.textSecondary },
  item: { gap: spacing.xs, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemTitleInput: {
    height: 40,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    fontSize: fontSize.bodyLg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemDateInput: {
    height: 36,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
  addBulletButton: {
    alignSelf: 'flex-start',
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    justifyContent: 'center',
  },
  addBulletText: { fontSize: fontSize.body, color: colors.textSecondary, fontWeight: '600' },
  removeItemText: { fontSize: fontSize.caption, color: colors.error },
  addItemButton: { alignSelf: 'flex-start' },
  addItemText: { fontSize: fontSize.body, color: colors.accent, fontWeight: '600' },
});
