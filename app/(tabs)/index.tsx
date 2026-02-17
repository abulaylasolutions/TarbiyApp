import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, FadeInDown } from 'react-native-reanimated';
import { useApp } from '@/lib/app-context';
import Colors from '@/constants/colors';

const CHILD_COLORS = [
  ['#A8E6CF', '#D4F5E5'],
  ['#FFD3B6', '#FFE8D9'],
  ['#C7CEEA', '#E3E7F5'],
  ['#FFF5E1', '#FFE8C1'],
  ['#FCE588', '#FFF9E6'],
] as const;

interface ChildCardProps {
  child: {
    id: string;
    name: string;
    birthDate: string;
    photoUri?: string;
  };
  index: number;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function ChildCard({ child, index, onDelete, isSelected, onSelect }: ChildCardProps) {
  const colors = CHILD_COLORS[index % CHILD_COLORS.length];
  const age = getAge(child.birthDate);

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      child.name,
      'Cosa vuoi fare?',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: () => onDelete(child.id) },
      ]
    );
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelect(child.id);
        }}
        onLongPress={handleLongPress}
        style={({ pressed }) => [
          styles.childCard,
          isSelected && styles.childCardSelected,
          { transform: [{ scale: pressed ? 0.97 : 1 }] },
        ]}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.childGradient}
        >
          <View style={styles.childAvatar}>
            <Text style={styles.childAvatarText}>
              {child.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{child.name}</Text>
            <Text style={styles.childAge}>{age}</Text>
          </View>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Ionicons name="checkmark" size={14} color={Colors.white} />
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { children, selectedChildId, addChild, removeChild, selectChild, isPremium } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [childName, setChildName] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const canAddChild = isPremium || children.length < 1;

  const handleAdd = () => {
    if (!canAddChild) {
      Alert.alert(
        'Limite raggiunto',
        'Con il piano gratuito puoi aggiungere massimo 1 figlio. Passa a Premium per figli illimitati!',
      );
      return;
    }
    setChildName('');
    setBirthDay('');
    setBirthMonth('');
    setBirthYear('');
    setShowModal(true);
  };

  const handleSaveChild = async () => {
    if (!childName.trim()) {
      Alert.alert('Nome richiesto', 'Inserisci il nome del bambino.');
      return;
    }

    const day = parseInt(birthDay, 10);
    const month = parseInt(birthMonth, 10);
    const year = parseInt(birthYear, 10);

    if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || year > 2026) {
      Alert.alert('Data non valida', 'Inserisci una data di nascita valida.');
      return;
    }

    const birthDate = new Date(year, month - 1, day).toISOString();

    await addChild({ name: childName.trim(), birthDate });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowModal(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.mintGreenLight, Colors.background] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: topPadding + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>
              <Text style={styles.brandTarbiy}>Tarbiy</Text>
              <Text style={styles.brandApp}>App</Text>
            </Text>
            <Text style={styles.headerSubtitle}>Educazione islamica dei tuoi figli</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            I tuoi figli ({children.length})
          </Text>
          {!canAddChild && (
            <View style={styles.limitBadge}>
              <Ionicons name="lock-closed" size={12} color={Colors.goldAccent} />
              <Text style={styles.limitText}>Limite</Text>
            </View>
          )}
        </View>

        {children.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="people" size={48} color={Colors.mintGreen} />
            </View>
            <Text style={styles.emptyTitle}>Nessun figlio aggiunto</Text>
            <Text style={styles.emptySubtext}>
              Tocca il pulsante + per aggiungere il tuo primo figlio
            </Text>
          </View>
        ) : (
          <View style={styles.childrenList}>
            {children.map((child, index) => (
              <ChildCard
                key={child.id}
                child={child}
                index={index}
                onDelete={removeChild}
                isSelected={child.id === selectedChildId}
                onSelect={selectChild}
              />
            ))}
          </View>
        )}

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </ScrollView>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          handleAdd();
        }}
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: Platform.OS === 'web' ? 34 + 24 : insets.bottom + 80,
            transform: [{ scale: pressed ? 0.9 : 1 }],
          },
        ]}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </Pressable>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={() => setShowModal(false)} />
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Aggiungi figlio</Text>

            <Text style={styles.inputLabel}>Nome</Text>
            <TextInput
              style={styles.modalInput}
              value={childName}
              onChangeText={setChildName}
              placeholder="Nome del bambino"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />

            <Text style={styles.inputLabel}>Data di nascita</Text>
            <View style={styles.dateRow}>
              <TextInput
                style={[styles.modalInput, styles.dateInput]}
                value={birthDay}
                onChangeText={(t) => {
                  if (t.length <= 2) setBirthDay(t);
                }}
                placeholder="GG"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={2}
              />
              <TextInput
                style={[styles.modalInput, styles.dateInput]}
                value={birthMonth}
                onChangeText={(t) => {
                  if (t.length <= 2) setBirthMonth(t);
                }}
                placeholder="MM"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={2}
              />
              <TextInput
                style={[styles.modalInput, styles.dateInputYear]}
                value={birthYear}
                onChangeText={(t) => {
                  if (t.length <= 4) setBirthYear(t);
                }}
                placeholder="AAAA"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowModal(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Annulla</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveChild}
                style={[
                  styles.modalSaveBtn,
                  !childName.trim() && styles.modalSaveBtnDisabled,
                ]}
              >
                <Ionicons name="checkmark" size={22} color={Colors.white} />
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
  header: {
    marginBottom: 24,
  },
  brandName: {
    fontSize: 32,
  },
  brandTarbiy: {
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.mintGreen,
    fontSize: 32,
  },
  brandApp: {
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.textPrimary,
    fontSize: 32,
  },
  headerSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  limitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.creamBeige,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  limitText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    color: Colors.goldAccent,
  },
  childrenList: {
    gap: 12,
  },
  childCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  childCardSelected: {
    shadowOpacity: 0.15,
    shadowRadius: 14,
  },
  childGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  childAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childAvatarText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 26,
    color: Colors.textPrimary,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
  },
  childAge: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.mintGreenDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.mintGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.mintGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.mintGreenDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  modalInput: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.creamBeige,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateInput: {
    flex: 1,
    textAlign: 'center',
  },
  dateInputYear: {
    flex: 1.5,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  modalCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalCancelText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalSaveBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.mintGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnDisabled: {
    opacity: 0.5,
  },
});
