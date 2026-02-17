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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeOut, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useApp, Child } from '@/lib/app-context';
import { useAuth } from '@/lib/auth-context';
import Colors from '@/constants/colors';

const PASTEL_COLORS = [
  '#FFD3B6',
  '#C7CEEA',
  '#A8E6CF',
  '#E0BBE4',
  '#FFF5BA',
  '#FFDAC1',
  '#B2D8B2',
  '#F5C6D0',
];

interface ChildCardProps {
  child: Child;
  index: number;
  onDelete: (id: string) => void;
  onEdit: (child: Child) => void;
  onPress: (child: Child) => void;
}

function ChildCard({ child, index, onDelete, onEdit, onPress }: ChildCardProps) {
  const age = getAge(child.birthDate);
  const cardBg = child.cardColor || PASTEL_COLORS[index % PASTEL_COLORS.length];
  const cardBgLight = cardBg + '40';
  const isFemale = child.gender === 'femmina';
  const coParentColor = isFemale ? '#FF6B6B' : '#4A90E2';
  const genderPrefix = isFemale ? 'figlia tua e di' : 'figlio tuo e di';

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      child.name,
      'Cosa vuoi fare?',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Modifica', onPress: () => onEdit(child) },
        { text: 'Elimina', style: 'destructive', onPress: () => onDelete(child.id) },
      ]
    );
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(child);
        }}
        onLongPress={handleLongPress}
        style={({ pressed }) => [
          styles.childCard,
          { transform: [{ scale: pressed ? 0.97 : 1 }] },
        ]}
      >
        <View style={[styles.childGradient, { backgroundColor: cardBg }]}>
          {child.photoUri ? (
            <Image source={{ uri: child.photoUri }} style={styles.childPhoto} />
          ) : (
            <View style={[styles.childAvatar, { backgroundColor: cardBgLight }]}>
              <Text style={styles.childAvatarText}>
                {child.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{child.name}</Text>
            <Text style={styles.childAge}>{age}</Text>
            {child.coParentName && child.gender ? (
              <Text style={styles.coParentLine}>
                <Text style={styles.coParentPrefix}>{genderPrefix} </Text>
                <Text style={[styles.coParentName, { color: coParentColor }]}>
                  {child.coParentName}
                </Text>
              </Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(0,0,0,0.25)" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

interface ChildFormData {
  name: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  gender: string;
  photoUri: string;
  coParentName: string;
  cardColor: string;
}

const EMPTY_FORM: ChildFormData = {
  name: '',
  birthDay: '',
  birthMonth: '',
  birthYear: '',
  gender: '',
  photoUri: '',
  coParentName: '',
  cardColor: PASTEL_COLORS[0],
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { children, selectedChildId, addChild, updateChild, removeChild, selectChild } = useApp();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [form, setForm] = useState<ChildFormData>(EMPTY_FORM);
  const [errorMsg, setErrorMsg] = useState('');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const isPremium = user?.isPremium;
  const ownChildren = children.filter(c => c.userId === user?.id);
  const canAddChild = isPremium || ownChildren.length < 1;

  const openAddModal = () => {
    if (!canAddChild) {
      Alert.alert('Limite raggiunto', 'Con il piano gratuito puoi aggiungere massimo 1 figlio. Passa a Premium per figli illimitati!');
      return;
    }
    setEditingChild(null);
    setForm(EMPTY_FORM);
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (child: Child) => {
    setEditingChild(child);
    const birth = new Date(child.birthDate);
    setForm({
      name: child.name,
      birthDay: String(birth.getDate()),
      birthMonth: String(birth.getMonth() + 1),
      birthYear: String(birth.getFullYear()),
      gender: child.gender || '',
      photoUri: child.photoUri || '',
      coParentName: child.coParentName || '',
      cardColor: child.cardColor || PASTEL_COLORS[0],
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleChildPress = (child: Child) => {
    selectChild(child.id);
    router.push('/(tabs)/dashboard');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setForm(prev => ({ ...prev, photoUri: result.assets[0].uri }));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setErrorMsg('Inserisci il nome del bambino.');
      return;
    }
    const day = parseInt(form.birthDay, 10);
    const month = parseInt(form.birthMonth, 10);
    const year = parseInt(form.birthYear, 10);
    if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || year > 2026) {
      setErrorMsg('Inserisci una data di nascita valida.');
      return;
    }
    if (!form.gender) {
      setErrorMsg('Seleziona il sesso del bambino.');
      return;
    }

    const birthDate = new Date(year, month - 1, day).toISOString();
    const payload = {
      name: form.name.trim(),
      birthDate,
      gender: form.gender,
      photoUri: form.photoUri || undefined,
      coParentName: form.coParentName.trim() || undefined,
      cardColor: form.cardColor,
    };

    let result;
    if (editingChild) {
      result = await updateChild(editingChild.id, payload);
    } else {
      result = await addChild(payload);
    }

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
    } else {
      setErrorMsg(result.message || 'Errore');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.mintGreenLight, Colors.background]}
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
            <Text style={styles.headerSubtitle}>Ciao, {user?.name || 'Genitore'}</Text>
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
                onEdit={openEditModal}
                onPress={handleChildPress}
              />
            ))}
          </View>
        )}

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </ScrollView>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          openAddModal();
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
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>
                {editingChild ? 'Modifica figlio' : 'Aggiungi figlio'}
              </Text>

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <Pressable onPress={pickImage} style={styles.photoPickerWrap}>
                {form.photoUri ? (
                  <Image source={{ uri: form.photoUri }} style={styles.photoPreview} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera" size={28} color={Colors.textMuted} />
                  </View>
                )}
                <Text style={styles.photoLabel}>Foto profilo</Text>
              </Pressable>

              <Text style={styles.inputLabel}>Nome / Soprannome</Text>
              <TextInput
                style={styles.modalInput}
                value={form.name}
                onChangeText={(t) => setForm(p => ({ ...p, name: t }))}
                placeholder="Nome del bambino"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Data di nascita</Text>
              <View style={styles.dateRow}>
                <TextInput
                  style={[styles.modalInput, styles.dateInput]}
                  value={form.birthDay}
                  onChangeText={(t) => { if (t.length <= 2) setForm(p => ({ ...p, birthDay: t })); }}
                  placeholder="GG"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <TextInput
                  style={[styles.modalInput, styles.dateInput]}
                  value={form.birthMonth}
                  onChangeText={(t) => { if (t.length <= 2) setForm(p => ({ ...p, birthMonth: t })); }}
                  placeholder="MM"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <TextInput
                  style={[styles.modalInput, styles.dateInputYear]}
                  value={form.birthYear}
                  onChangeText={(t) => { if (t.length <= 4) setForm(p => ({ ...p, birthYear: t })); }}
                  placeholder="AAAA"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>

              <Text style={styles.inputLabel}>Sesso</Text>
              <View style={styles.genderRow}>
                <Pressable
                  onPress={() => setForm(p => ({ ...p, gender: 'maschio' }))}
                  style={[styles.genderBtn, form.gender === 'maschio' && styles.genderBtnActive]}
                >
                  <Ionicons name="man" size={20} color={form.gender === 'maschio' ? '#4A90E2' : Colors.textMuted} />
                  <Text style={[styles.genderText, form.gender === 'maschio' && { color: '#4A90E2' }]}>Maschio</Text>
                </Pressable>
                <Pressable
                  onPress={() => setForm(p => ({ ...p, gender: 'femmina' }))}
                  style={[styles.genderBtn, form.gender === 'femmina' && styles.genderBtnFemActive]}
                >
                  <Ionicons name="woman" size={20} color={form.gender === 'femmina' ? '#FF6B6B' : Colors.textMuted} />
                  <Text style={[styles.genderText, form.gender === 'femmina' && { color: '#FF6B6B' }]}>Femmina</Text>
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Nome del cogenitore</Text>
              <TextInput
                style={styles.modalInput}
                value={form.coParentName}
                onChangeText={(t) => setForm(p => ({ ...p, coParentName: t }))}
                placeholder="Nome cogenitore (opzionale)"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Colore card</Text>
              <View style={styles.colorRow}>
                {PASTEL_COLORS.map(color => (
                  <Pressable
                    key={color}
                    onPress={() => setForm(p => ({ ...p, cardColor: color }))}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color },
                      form.cardColor === color && styles.colorSwatchSelected,
                    ]}
                  >
                    {form.cardColor === color && (
                      <Ionicons name="checkmark" size={16} color="rgba(0,0,0,0.5)" />
                    )}
                  </Pressable>
                ))}
              </View>

              <View style={styles.modalActions}>
                <Pressable onPress={() => setShowModal(false)} style={styles.modalCancelBtn}>
                  <Text style={styles.modalCancelText}>Annulla</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  style={[styles.modalSaveBtn, !form.name.trim() && styles.modalSaveBtnDisabled]}
                >
                  <Ionicons name="checkmark" size={22} color={Colors.white} />
                </Pressable>
              </View>
            </ScrollView>
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
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { marginBottom: 24 },
  brandName: { fontSize: 32 },
  brandTarbiy: { fontFamily: 'Nunito_800ExtraBold', color: Colors.mintGreen, fontSize: 32 },
  brandApp: { fontFamily: 'Nunito_600SemiBold', color: Colors.textPrimary, fontSize: 32 },
  headerSubtitle: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.textPrimary },
  limitBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.creamBeige, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  limitText: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.goldAccent },
  childrenList: { gap: 12 },
  childCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  childGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    borderRadius: 24,
  },
  childPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  childAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childAvatarText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 24, color: Colors.textPrimary },
  childInfo: { flex: 1 },
  childName: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.textPrimary },
  childAge: { fontFamily: 'Nunito_500Medium', fontSize: 13, color: Colors.textSecondary, marginTop: 1 },
  coParentLine: { marginTop: 4, fontSize: 12 },
  coParentPrefix: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textPrimary },
  coParentName: { fontFamily: 'Nunito_700Bold', fontSize: 12 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.mintGreenLight, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.textSecondary },
  emptySubtext: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
  fab: {
    position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.mintGreen, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.mintGreenDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.textMuted, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'Nunito_700Bold', fontSize: 20, color: Colors.textPrimary, marginBottom: 20 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dangerLight, borderRadius: 12, padding: 12, gap: 8, marginBottom: 16 },
  errorText: { fontFamily: 'Nunito_500Medium', fontSize: 13, color: Colors.danger, flex: 1 },
  photoPickerWrap: { alignItems: 'center', marginBottom: 20 },
  photoPreview: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: Colors.mintGreenLight },
  photoPlaceholder: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.creamBeige,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.textMuted, borderStyle: 'dashed',
  },
  photoLabel: { fontFamily: 'Nunito_500Medium', fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  inputLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  modalInput: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.textPrimary, backgroundColor: Colors.creamBeige, borderRadius: 16, padding: 14, marginBottom: 16 },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateInput: { flex: 1, textAlign: 'center' as const },
  dateInputYear: { flex: 1.5, textAlign: 'center' as const },
  genderRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  genderBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 16, backgroundColor: Colors.creamBeige,
  },
  genderBtnActive: { backgroundColor: '#E3F2FD', borderWidth: 2, borderColor: '#4A90E2' },
  genderBtnFemActive: { backgroundColor: '#FFEBEE', borderWidth: 2, borderColor: '#FF6B6B' },
  genderText: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: Colors.textSecondary },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  colorSwatch: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  colorSwatchSelected: { borderWidth: 3, borderColor: Colors.textPrimary },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  modalCancelBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  modalCancelText: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.textSecondary },
  modalSaveBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.mintGreen, alignItems: 'center', justifyContent: 'center' },
  modalSaveBtnDisabled: { opacity: 0.5 },
});
