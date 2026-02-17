import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/lib/app-context';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import Colors from '@/constants/colors';

const PASTEL_COLORS = [
  '#FFD3B6', '#C7CEEA', '#A8E6CF', '#E0BBE4',
  '#FFF5BA', '#FFDAC1', '#B2D8B2', '#F5C6D0',
];

function ChildSelector() {
  const { children, selectedChildId, selectChild } = useApp();

  if (children.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.selectorContainer}
    >
      {children.map((child, index) => {
        const isSelected = child.id === selectedChildId;
        const cardColor = child.cardColor || PASTEL_COLORS[index % PASTEL_COLORS.length];
        return (
          <Pressable
            key={child.id}
            onPress={() => selectChild(child.id)}
            style={[
              styles.selectorItem,
              isSelected && styles.selectorItemActive,
            ]}
          >
            <View style={[
              styles.selectorAvatar,
              isSelected && [styles.selectorAvatarActive, { borderColor: cardColor }],
            ]}>
              {child.photoUri ? (
                <Image source={{ uri: child.photoUri }} style={styles.selectorAvatarImg} />
              ) : (
                <Text style={styles.selectorAvatarText}>
                  {child.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <Text
              style={[styles.selectorName, isSelected && styles.selectorNameActive]}
              numberOfLines={1}
            >
              {child.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

interface StatCardProps {
  icon: string;
  iconFamily: 'ionicons' | 'material';
  title: string;
  value: string;
  color: string;
  gradientColors: readonly [string, string];
}

function StatCard({ icon, iconFamily, title, value, color, gradientColors }: StatCardProps) {
  const IconComponent = iconFamily === 'ionicons' ? Ionicons : MaterialCommunityIcons;
  return (
    <View style={styles.statCard}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statGradient}
      >
        <View style={styles.statIconWrap}>
          <IconComponent name={icon as any} size={22} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </LinearGradient>
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { children, selectedChildId, cogenitori } = useApp();
  const { user } = useAuth();
  const { t, isRTL } = useI18n();
  const selectedChild = children.find(c => c.id === selectedChildId);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const selectedIndex = children.findIndex(c => c.id === selectedChildId);
  const childCardColor = selectedChild?.cardColor || PASTEL_COLORS[Math.max(0, selectedIndex) % PASTEL_COLORS.length];
  const childCardColorLight = childCardColor + '40';

  let coParentInfos: { name: string; photoUrl: string | null }[] = [];
  if (selectedChild?.cogenitori) {
    try {
      const cogIds: string[] = JSON.parse(selectedChild.cogenitori);
      coParentInfos = cogIds
        .filter(id => id !== user?.id)
        .map(id => {
          const cog = cogenitori.find(c => c.id === id);
          return cog ? { name: cog.name || cog.email, photoUrl: cog.photoUrl } : null;
        })
        .filter(Boolean) as { name: string; photoUrl: string | null }[];
    } catch {}
  }

  return (
    <View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: topPadding + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>{t('dashboard')}</Text>

        <ChildSelector />

        {selectedChild ? (
          <>
            <View style={[styles.selectedChildCard, { borderColor: childCardColor + '60', borderWidth: 2 }]}>
              <LinearGradient
                colors={[childCardColor, childCardColorLight] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.selectedChildGradient}
              >
                {selectedChild.photoUri ? (
                  <Image source={{ uri: selectedChild.photoUri }} style={styles.selectedChildPhoto} />
                ) : (
                  <View style={[styles.selectedChildAvatar, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
                    <Text style={[styles.selectedChildAvatarText, { color: childCardColor }]}>
                      {selectedChild.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.selectedChildInfo}>
                  <Text style={styles.selectedChildName}>{selectedChild.name}</Text>
                  <Text style={styles.selectedChildAge}>
                    {getAge(selectedChild.birthDate, t)}
                  </Text>
                  {coParentInfos.length > 0 && (
                    <View style={styles.coParentRow}>
                      {coParentInfos.map((cp, i) => (
                        <View key={i} style={styles.coParentChip}>
                          {cp.photoUrl ? (
                            <Image source={{ uri: cp.photoUrl }} style={styles.coParentMiniPhoto} />
                          ) : (
                            <View style={styles.coParentMiniFallback}>
                              <Text style={styles.coParentMiniInitial}>{cp.name.charAt(0).toUpperCase()}</Text>
                            </View>
                          )}
                          <Text style={styles.coParentMiniName} numberOfLines={1}>{cp.name}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <Ionicons name="heart" size={20} color={Colors.peachPink} />
              </LinearGradient>
            </View>

            <Text style={styles.sectionTitle}>{t('progress')}</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="book"
                iconFamily="ionicons"
                title="Suwar"
                value="3"
                color={childCardColor}
                gradientColors={[childCardColorLight, '#FFFFFF'] as const}
              />
              <StatCard
                icon="star"
                iconFamily="ionicons"
                title="Du'a"
                value="5"
                color="#F4C430"
                gradientColors={['#FCE588', '#FFFFFF'] as const}
              />
              <StatCard
                icon="mosque"
                iconFamily="material"
                title="Salat"
                value="2"
                color={childCardColor}
                gradientColors={[childCardColorLight, '#FFFFFF'] as const}
              />
              <StatCard
                icon="hand-heart"
                iconFamily="material"
                title="Adab"
                value="7"
                color="#FFD3B6"
                gradientColors={['#FFE8D9', '#FFFFFF'] as const}
              />
            </View>

            <Text style={styles.sectionTitle}>{t('recentActivity')}</Text>
            <View style={styles.activityCard}>
              <View style={styles.activityRow}>
                <View style={[styles.activityDot, { backgroundColor: childCardColor }]} />
                <View style={styles.activityTextWrap}>
                  <Text style={styles.activityText}>{t('memorizedSurah')}</Text>
                  <Text style={styles.activityDate}>{t('example')}</Text>
                </View>
              </View>
              <View style={styles.activityDivider} />
              <View style={styles.activityRow}>
                <View style={[styles.activityDot, { backgroundColor: Colors.peachPink }]} />
                <View style={styles.activityTextWrap}>
                  <Text style={styles.activityText}>{t('completedDua')}</Text>
                  <Text style={styles.activityDate}>{t('example')}</Text>
                </View>
              </View>
              <View style={styles.activityDivider} />
              <View style={styles.activityRow}>
                <View style={[styles.activityDot, { backgroundColor: Colors.skyBlue }]} />
                <View style={styles.activityTextWrap}>
                  <Text style={styles.activityText}>{t('practicedAdab')}</Text>
                  <Text style={styles.activityDate}>{t('example')}</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyText}>{t('addChildFromHome')}</Text>
            <Text style={styles.emptySubtext}>{t('toViewDashboard')}</Text>
          </View>
        )}

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </ScrollView>
    </View>
  );
}

function getAge(birthDate: string, t?: (key: string) => string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    years--;
  }
  if (years < 1) {
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
    const label = t ? t('months') : 'mesi';
    return `${Math.max(0, months)} ${label}`;
  }
  const label = t ? (years === 1 ? t('year') : t('years')) : (years === 1 ? 'anno' : 'anni');
  return `${years} ${label}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  selectorContainer: {
    paddingBottom: 16,
    gap: 12,
  },
  selectorItem: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  selectorItemActive: {},
  selectorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.creamBeige,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  selectorAvatarActive: {
    backgroundColor: Colors.mintGreenLight,
  },
  selectorAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  selectorAvatarText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
  },
  selectorName: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
    maxWidth: 60,
    textAlign: 'center',
  },
  selectorNameActive: {
    color: Colors.mintGreenDark,
    fontFamily: 'Nunito_700Bold',
  },
  selectedChildCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  selectedChildGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  selectedChildPhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  selectedChildAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedChildAvatarText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
  },
  selectedChildInfo: {
    flex: 1,
  },
  selectedChildName: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
  },
  selectedChildAge: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  coParentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  coParentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  coParentMiniPhoto: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  coParentMiniFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coParentMiniInitial: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    color: Colors.textPrimary,
  },
  coParentMiniName: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 11,
    color: Colors.textSecondary,
    maxWidth: 80,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statGradient: {
    padding: 16,
    alignItems: 'flex-start',
    gap: 8,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    color: Colors.textPrimary,
  },
  statTitle: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  activityCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activityTextWrap: {
    flex: 1,
  },
  activityText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  activityDate: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  activityDivider: {
    height: 1,
    backgroundColor: Colors.creamBeige,
    marginLeft: 22,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
});
