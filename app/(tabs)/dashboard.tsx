import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/lib/app-context';
import Colors from '@/constants/colors';

function ChildSelector() {
  const { children, selectedChildId, selectChild } = useApp();

  if (children.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.selectorContainer}
    >
      {children.map((child) => {
        const isSelected = child.id === selectedChildId;
        return (
          <Pressable
            key={child.id}
            onPress={() => selectChild(child.id)}
            style={[
              styles.selectorItem,
              isSelected && styles.selectorItemActive,
            ]}
          >
            <View style={[styles.selectorAvatar, isSelected && styles.selectorAvatarActive]}>
              <Text style={styles.selectorAvatarText}>
                {child.name.charAt(0).toUpperCase()}
              </Text>
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
  const { children, selectedChildId } = useApp();
  const selectedChild = children.find(c => c.id === selectedChildId);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: topPadding + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Dashboard</Text>

        <ChildSelector />

        {selectedChild ? (
          <>
            <View style={styles.selectedChildCard}>
              <LinearGradient
                colors={['#A8E6CF', '#D4F5E5'] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.selectedChildGradient}
              >
                <View style={styles.selectedChildAvatar}>
                  <Text style={styles.selectedChildAvatarText}>
                    {selectedChild.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.selectedChildInfo}>
                  <Text style={styles.selectedChildName}>{selectedChild.name}</Text>
                  <Text style={styles.selectedChildAge}>
                    {getAge(selectedChild.birthDate)}
                  </Text>
                </View>
                <Ionicons name="heart" size={20} color={Colors.peachPink} />
              </LinearGradient>
            </View>

            <Text style={styles.sectionTitle}>Progressi</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="book"
                iconFamily="ionicons"
                title="Suwar"
                value="3"
                color="#A8E6CF"
                gradientColors={['#D4F5E5', '#FFFFFF'] as const}
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
                color="#C7CEEA"
                gradientColors={['#E3E7F5', '#FFFFFF'] as const}
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

            <Text style={styles.sectionTitle}>Attività Recenti</Text>
            <View style={styles.activityCard}>
              <View style={styles.activityRow}>
                <View style={[styles.activityDot, { backgroundColor: Colors.mintGreen }]} />
                <View style={styles.activityTextWrap}>
                  <Text style={styles.activityText}>Ha memorizzato Surat Al-Fatiha</Text>
                  <Text style={styles.activityDate}>Esempio</Text>
                </View>
              </View>
              <View style={styles.activityDivider} />
              <View style={styles.activityRow}>
                <View style={[styles.activityDot, { backgroundColor: Colors.peachPink }]} />
                <View style={styles.activityTextWrap}>
                  <Text style={styles.activityText}>Completata lezione sulle Du'a</Text>
                  <Text style={styles.activityDate}>Esempio</Text>
                </View>
              </View>
              <View style={styles.activityDivider} />
              <View style={styles.activityRow}>
                <View style={[styles.activityDot, { backgroundColor: Colors.skyBlue }]} />
                <View style={styles.activityTextWrap}>
                  <Text style={styles.activityText}>Praticato Adab a tavola</Text>
                  <Text style={styles.activityDate}>Esempio</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aggiungi un figlio dalla Home</Text>
            <Text style={styles.emptySubtext}>per visualizzare la dashboard</Text>
          </View>
        )}

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </ScrollView>
    </View>
  );
}

function getAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    years--;
  }
  if (years < 1) {
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
    return `${Math.max(0, months)} mesi`;
  }
  return `${years} ${years === 1 ? 'anno' : 'anni'}`;
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
  },
  selectorAvatarActive: {
    borderColor: Colors.mintGreen,
    backgroundColor: Colors.mintGreenLight,
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
  selectedChildAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedChildAvatarText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 24,
    color: Colors.mintGreenDark,
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
