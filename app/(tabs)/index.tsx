import React, { useState, useRef } from 'react';
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
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Animated as RNAnimated } from 'react-native';
import ReAnimated, { FadeIn, FadeOut, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useApp, Child, CogenitoreInfo } from '@/lib/app-context';
import { useAuth } from '@/lib/auth-context';
import Colors from '@/constants/colors';
import { useI18n } from '@/lib/i18n';

const PASTEL_COLORS = [
  '#FFD3B6', '#C7CEEA', '#A8E6CF', '#E0BBE4',
  '#FFF5BA', '#FFDAC1', '#B2D8B2', '#F5C6D0',
];

interface ChildCardProps {
  child: Child;
  index: number;
  cogenitori: CogenitoreInfo[];
  currentUserId: string;
  onDelete: (id: string) => void;
  onEdit: (child: Child) => void;
  onPress: (child: Child) => void;
}

const SWIPE_THRESHOLD = 70;
const ACTION_WIDTH = 140;

function ChildCard({ child, index, cogenitori, currentUserId, onDelete, onEdit, onPress }: ChildCardProps) {
  const { t } = useI18n();
  const age = getAge(child.birthDate, t);
  const cardBg = child.cardColor || PASTEL_COLORS[index % PASTEL_COLORS.length];
  const cardBgLight = cardBg + '40';
  const isFemale = child.gender === 'femmina';
  const nameColor = isFemale ? '#FF6B6B' : '#4A90E2';

  const translateX = useRef(new RNAnimated.Value(0)).current;
  const isSwipedOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          translateX.setValue(Math.min(gestureState.dx, ACTION_WIDTH));
        } else if (isSwipedOpen.current) {
          translateX.setValue(Math.max(gestureState.dx + ACTION_WIDTH, 0));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          RNAnimated.spring(translateX, { toValue: ACTION_WIDTH, useNativeDriver: true, friction: 8 }).start();
          isSwipedOpen.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
          RNAnimated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
          isSwipedOpen.current = false;
        }
      },
    })
  ).current;

  const closeSwipe = () => {
    RNAnimated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    isSwipedOpen.current = false;
  };

  let coParentNames: string[] = [];
  if (child.cogenitori) {
    try {
      const cogIds: string[] = JSON.parse(child.cogenitori);
      coParentNames = cogIds
        .filter(id => id !== currentUserId)
        .map(id => {
          const cog = cogenitori.find(c => c.id === id);
          return cog?.name || null;
        })
        .filter(Boolean) as string[];
    } catch {}
  }
  if (coParentNames.length === 0 && child.coParentName) {
    coParentNames = [child.coParentName];
  }

  const genderPrefix = isFemale ? t('daughterOf') : t('sonOf');

  let coParentInfos: CogenitoreInfo[] = [];
  if (child.cogenitori) {
    try {
      const cogIds: string[] = JSON.parse(child.cogenitori);
      coParentInfos = cogIds
        .filter(id => id !== currentUserId)
        .map(id => cogenitori.find(c => c.id === id))
        .filter(Boolean) as CogenitoreInfo[];
    } catch {}
  }

  return (
    <ReAnimated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <View style={styles.swipeContainer}>
        <View style={styles.swipeActions}>
          <Pressable
            onPress={() => {
              closeSwipe();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onEdit(child);
            }}
            style={styles.swipeEditBtn}
          >
            <Ionicons name="create" size={22} color={Colors.white} />
          </Pressable>
          <Pressable
            onPress={() => {
              closeSwipe();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert(
                t('delete'),
                `${t('deleteConfirm')} ${child.name}?`,
                [
                  { text: t('cancel'), style: 'cancel' },
                  { text: t('delete'), style: 'destructive', onPress: () => onDelete(child.id) },
                ]
              );
            }}
            style={styles.swipeDeleteBtn}
          >
            <Ionicons name="trash" size={22} color={Colors.white} />
          </Pressable>
        </View>

        <RNAnimated.View
          {...panResponder.panHandlers}
          style={[styles.childCard, { transform: [{ translateX }] }]}
        >
          <Pressable
            onPress={() => {
              if (isSwipedOpen.current) {
                closeSwipe();
                return;
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPress(child);
            }}
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.98 : 1 }] },
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
                <Text style={[styles.childName, { color: nameColor }]}>{child.name}</Text>
                <Text style={styles.childAge}>{age}</Text>
                {coParentNames.length > 0 && child.gender ? (
                  <Text style={styles.coParentLine}>
                    <Text style={styles.coParentPrefix}>{genderPrefix} </Text>
                    <Text style={[styles.coParentNameText, { color: nameColor }]}>
                      {coParentNames.join(', ')}
                    </Text>
                  </Text>
                ) : null}
                {coParentInfos.length > 0 ? (
                  <View style={styles.coParentAvatarRow}>
                    {coParentInfos.map(cog => (
                      cog.photoUrl ? (
                        <Image key={cog.id} source={{ uri: cog.photoUrl }} style={styles.coParentAvatar} />
                      ) : (
                        <View key={cog.id} style={styles.coParentAvatarFallback}>
                          <Text style={styles.coParentAvatarInitial}>
                            {(cog.name || cog.email).charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )
                    ))}
                  </View>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(0,0,0,0.25)" />
            </View>
          </Pressable>
        </RNAnimated.View>
      </View>
    </ReAnimated.View>
  );
}

interface ChildFormData {
  name: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  gender: string;
  photoUri: string;
  selectedCogenitori: string[];
  cardColor: string;
}

const EMPTY_FORM: ChildFormData = {
  name: '',
  birthDay: '',
  birthMonth: '',
  birthYear: '',
  gender: '',
  photoUri: '',
  selectedCogenitori: [],
  cardColor: PASTEL_COLORS[0],
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { children, selectedChildId, addChild, updateChild, removeChild, selectChild, cogenitori, getCogenitoreNameById } = useApp();
  const { user } = useAuth();
  const { t, isRTL } = useI18n();
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
      Alert.alert(t('limitReachedTitle'), t('limitReachedMsg'));
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
    let selectedCogs: string[] = [];
    if (child.cogenitori) {
      try {
        selectedCogs = JSON.parse(child.cogenitori).filter((id: string) => id !== user?.id);
      } catch {}
    }
    setForm({
      name: child.name,
      birthDay: String(birth.getDate()),
      birthMonth: String(birth.getMonth() + 1),
      birthYear: String(birth.getFullYear()),
      gender: child.gender || '',
      photoUri: child.photoUri || '',
      selectedCogenitori: selectedCogs,
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

  const toggleCogenitore = (id: string) => {
    setForm(prev => ({
      ...prev,
      selectedCogenitori: prev.selectedCogenitori.includes(id)
        ? prev.selectedCogenitori.filter(c => c !== id)
        : [...prev.selectedCogenitori, id],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setErrorMsg(t('enterName'));
      return;
    }
    const day = parseInt(form.birthDay, 10);
    const month = parseInt(form.birthMonth, 10);
    const year = parseInt(form.birthYear, 10);
    if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || year > 2026) {
      setErrorMsg(t('invalidDate'));
      return;
    }
    if (!form.gender) {
      setErrorMsg(t('selectGender'));
      return;
    }

    const birthDate = new Date(year, month - 1, day).toISOString();

    if (editingChild) {
      const cogArray = [user!.id, ...form.selectedCogenitori];
      const result = await updateChild(editingChild.id, {
        name: form.name.trim(),
        birthDate,
        gender: form.gender,
        photoUri: form.photoUri || undefined,
        cardColor: form.cardColor,
        cogenitori: JSON.stringify(cogArray),
      });
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowModal(false);
      } else {
        setErrorMsg(result.message || 'Errore');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } else {
      const coParentName = form.selectedCogenitori.length > 0
        ? form.selectedCogenitori.map(id => getCogenitoreNameById(id)).filter(Boolean).join(', ')
        : undefined;
      const result = await addChild({
        name: form.name.trim(),
        birthDate,
        gender: form.gender,
        photoUri: form.photoUri || undefined,
        coParentName,
        cardColor: form.cardColor,
        selectedCogenitori: form.selectedCogenitori,
      });
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowModal(false);
      } else {
        setErrorMsg(result.message || 'Errore');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  return (
    <View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
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
            <Text style={styles.headerSubtitle}>{t('hello')}, {user?.name || t('parent')}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {t('yourChildren')} ({children.length})
          </Text>
          {!canAddChild && (
            <View style={styles.limitBadge}>
              <Ionicons name="lock-closed" size={12} color={Colors.goldAccent} />
              <Text style={styles.limitText}>{t('limit')}</Text>
            </View>
          )}
        </View>

        {children.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="people" size={48} color={Colors.mintGreen} />
            </View>
            <Text style={styles.emptyTitle}>{t('noChildrenTitle')}</Text>
            <Text style={styles.emptySubtext}>
              {t('noChildrenSub')}
            </Text>
          </View>
        ) : (
          <View style={styles.childrenList}>
            {children.map((child, index) => (
              <ChildCard
                key={child.id}
                child={child}
                index={index}
                cogenitori={cogenitori}
                currentUserId={user?.id || ''}
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
          <ReAnimated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}
          >
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>
                {editingChild ? t('editChild') : t('addChild')}
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
                <Text style={styles.photoLabel}>{t('photoOptional')}</Text>
              </Pressable>

              <Text style={styles.inputLabel}>{t('childName')}</Text>
              <TextInput
                style={styles.modalInput}
                value={form.name}
                onChangeText={(v) => setForm(p => ({ ...p, name: v }))}
                placeholder={t('childNamePlaceholder')}
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>{t('birthDate')}</Text>
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

              <Text style={styles.inputLabel}>{t('gender')}</Text>
              <View style={styles.genderRow}>
                <Pressable
                  onPress={() => setForm(p => ({ ...p, gender: 'maschio' }))}
                  style={[styles.genderBtn, form.gender === 'maschio' && styles.genderBtnActive]}
                >
                  <Ionicons name="man" size={20} color={form.gender === 'maschio' ? '#4A90E2' : Colors.textMuted} />
                  <Text style={[styles.genderText, form.gender === 'maschio' && { color: '#4A90E2' }]}>{t('male')}</Text>
                </Pressable>
                <Pressable
                  onPress={() => setForm(p => ({ ...p, gender: 'femmina' }))}
                  style={[styles.genderBtn, form.gender === 'femmina' && styles.genderBtnFemActive]}
                >
                  <Ionicons name="woman" size={20} color={form.gender === 'femmina' ? '#FF6B6B' : Colors.textMuted} />
                  <Text style={[styles.genderText, form.gender === 'femmina' && { color: '#FF6B6B' }]}>{t('female')}</Text>
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>{t('coParent')}</Text>
              {cogenitori.length > 0 ? (
                <View style={styles.cogSelectorWrap}>
                  {cogenitori.map(cog => {
                    const isSelected = form.selectedCogenitori.includes(cog.id);
                    return (
                      <Pressable
                        key={cog.id}
                        onPress={() => toggleCogenitore(cog.id)}
                        style={[styles.cogChip, isSelected && styles.cogChipSelected]}
                      >
                        <View style={styles.cogChipAvatar}>
                          <Text style={styles.cogChipAvatarText}>
                            {(cog.name || cog.email).charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={[styles.cogChipName, isSelected && styles.cogChipNameSelected]}>
                          {cog.name || cog.email}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={18} color={Colors.mintGreen} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.noCogWarn}>
                  <Ionicons name="information-circle" size={16} color={Colors.skyBlue} />
                  <Text style={styles.noCogWarnText}>
                    {t('connectCoParent')}
                  </Text>
                </View>
              )}

              <Text style={styles.inputLabel}>{t('cardColor')}</Text>
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
                  <Text style={styles.modalCancelText}>{t('cancel')}</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  style={[styles.modalSaveBtn, !form.name.trim() && styles.modalSaveBtnDisabled]}
                >
                  <Ionicons name="checkmark" size={22} color={Colors.white} />
                </Pressable>
              </View>
            </ScrollView>
          </ReAnimated.View>
        </View>
      </Modal>
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
    return `${Math.max(0, months)} ${t ? t('months') : 'mesi'}`;
  }
  return `${years} ${years === 1 ? (t ? t('year') : 'anno') : (t ? t('years') : 'anni')}`;
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
  swipeContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  swipeActions: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    flexDirection: 'row' as const,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    overflow: 'hidden' as const,
  },
  swipeEditBtn: {
    flex: 1,
    backgroundColor: '#E8D5A0',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  swipeDeleteBtn: {
    flex: 1,
    backgroundColor: '#E88B8B',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  childCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.cardBackground,
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
  childName: { fontFamily: 'Nunito_700Bold', fontSize: 18 },
  childAge: { fontFamily: 'Nunito_500Medium', fontSize: 13, color: Colors.textPrimary, marginTop: 1 },
  coParentLine: { marginTop: 4, fontSize: 12 },
  coParentPrefix: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textPrimary },
  coParentNameText: { fontFamily: 'Nunito_700Bold', fontSize: 12 },
  coParentAvatarRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  coParentAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
  coParentAvatarFallback: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  coParentAvatarInitial: { fontFamily: 'Nunito_700Bold', fontSize: 10, color: Colors.textPrimary },
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
  cogSelectorWrap: { gap: 8, marginBottom: 16 },
  cogChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16,
    backgroundColor: Colors.creamBeige,
  },
  cogChipSelected: { backgroundColor: Colors.mintGreenLight, borderWidth: 2, borderColor: Colors.mintGreen },
  cogChipAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  cogChipAvatarText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.textPrimary },
  cogChipName: { fontFamily: 'Nunito_500Medium', fontSize: 15, color: Colors.textSecondary, flex: 1 },
  cogChipNameSelected: { fontFamily: 'Nunito_700Bold', color: Colors.textPrimary },
  noCogWarn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.skyBlueLight, borderRadius: 14, padding: 12, marginBottom: 16,
  },
  noCogWarnText: { fontFamily: 'Nunito_500Medium', fontSize: 13, color: Colors.skyBlueDark, flex: 1 },
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
