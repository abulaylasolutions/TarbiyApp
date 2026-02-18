import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform, Pressable, Image,
  TextInput, Modal, Alert, KeyboardAvoidingView, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/lib/app-context';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { apiRequest, getApiUrl } from '@/lib/query-client';
import Colors from '@/constants/colors';

const PASTEL_COLORS = [
  '#FFD3B6', '#C7CEEA', '#A8E6CF', '#E0BBE4',
  '#FFF5BA', '#FFDAC1', '#B2D8B2', '#F5C6D0',
];

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
type PrayerName = typeof PRAYER_NAMES[number];

const SUBJECTS = [
  { key: 'arabo', icon: 'book-outline' as const },
  { key: 'akhlaq', icon: 'heart-outline' as const },
  { key: 'aqidah', icon: 'star-outline' as const },
];

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

const SURAH_NAMES = [
  'Al-Fatiha','Al-Baqarah','Ali \'Imran','An-Nisa','Al-Ma\'idah','Al-An\'am','Al-A\'raf','Al-Anfal','At-Tawbah','Yunus',
  'Hud','Yusuf','Ar-Ra\'d','Ibrahim','Al-Hijr','An-Nahl','Al-Isra','Al-Kahf','Maryam','Taha',
  'Al-Anbiya','Al-Hajj','Al-Mu\'minun','An-Nur','Al-Furqan','Ash-Shu\'ara','An-Naml','Al-Qasas','Al-Ankabut','Ar-Rum',
  'Luqman','As-Sajdah','Al-Ahzab','Saba','Fatir','Ya-Sin','As-Saffat','Sad','Az-Zumar','Ghafir',
  'Fussilat','Ash-Shura','Az-Zukhruf','Ad-Dukhan','Al-Jathiyah','Al-Ahqaf','Muhammad','Al-Fath','Al-Hujurat','Qaf',
  'Adh-Dhariyat','At-Tur','An-Najm','Al-Qamar','Ar-Rahman','Al-Waqi\'ah','Al-Hadid','Al-Mujadila','Al-Hashr','Al-Mumtahanah',
  'As-Saff','Al-Jumu\'ah','Al-Munafiqun','At-Taghabun','At-Talaq','At-Tahrim','Al-Mulk','Al-Qalam','Al-Haqqah','Al-Ma\'arij',
  'Nuh','Al-Jinn','Al-Muzzammil','Al-Muddaththir','Al-Qiyamah','Al-Insan','Al-Mursalat','An-Naba','An-Nazi\'at','Abasa',
  'At-Takwir','Al-Infitar','Al-Mutaffifin','Al-Inshiqaq','Al-Buruj','At-Tariq','Al-A\'la','Al-Ghashiyah','Al-Fajr','Al-Balad',
  'Ash-Shams','Al-Layl','Ad-Duha','Ash-Sharh','At-Tin','Al-Alaq','Al-Qadr','Al-Bayyinah','Az-Zalzalah','Al-Adiyat',
  'Al-Qari\'ah','At-Takathur','Al-Asr','Al-Humazah','Al-Fil','Quraysh','Al-Ma\'un','Al-Kawthar','Al-Kafirun','An-Nasr',
  'Al-Masad','Al-Ikhlas','Al-Falaq','An-Nas',
];

const SURAH_NAMES_AR = [
  'الفاتحة','البقرة','آل عمران','النساء','المائدة','الأنعام','الأعراف','الأنفال','التوبة','يونس',
  'هود','يوسف','الرعد','إبراهيم','الحجر','النحل','الإسراء','الكهف','مريم','طه',
  'الأنبياء','الحج','المؤمنون','النور','الفرقان','الشعراء','النمل','القصص','العنكبوت','الروم',
  'لقمان','السجدة','الأحزاب','سبأ','فاطر','يس','الصافات','ص','الزمر','غافر',
  'فصلت','الشورى','الزخرف','الدخان','الجاثية','الأحقاف','محمد','الفتح','الحجرات','ق',
  'الذاريات','الطور','النجم','القمر','الرحمن','الواقعة','الحديد','المجادلة','الحشر','الممتحنة',
  'الصف','الجمعة','المنافقون','التغابن','الطلاق','التحريم','الملك','القلم','الحاقة','المعارج',
  'نوح','الجن','المزمل','المدثر','القيامة','الإنسان','المرسلات','النبأ','النازعات','عبس',
  'التكوير','الانفطار','المطففين','الانشقاق','البروج','الطارق','الأعلى','الغاشية','الفجر','البلد',
  'الشمس','الليل','الضحى','الشرح','التين','العلق','القدر','البينة','الزلزلة','العاديات',
  'القارعة','التكاثر','العصر','الهمزة','الفيل','قريش','الماعون','الكوثر','الكافرون','النصر',
  'المسد','الإخلاص','الفلق','الناس',
];

const ARABIC_LETTERS = ['ا','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي'];

type SurahStatus = 'not_started' | 'in_progress' | 'learned';

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getAge(birthDate: string, t: (key: string) => string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) years--;
  if (years < 1) {
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
    return `${Math.max(0, months)} ${t('months')}`;
  }
  return `${years} ${years === 1 ? t('year') : t('years')}`;
}

function getDayName(d: Date, lang: string): string {
  const days: Record<string, string[]> = {
    it: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    ar: ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'],
  };
  return (days[lang] || days.it)[d.getDay()];
}

function getMonthName(d: Date, lang: string): string {
  const months: Record<string, string[]> = {
    it: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  };
  return (months[lang] || months.it)[d.getMonth()];
}

interface TaskItem {
  id: string;
  name: string;
  frequency: string;
  time?: string | null;
  endTime?: string | null;
  days?: string | null;
}

interface TaskCompletionItem {
  taskId: string;
  completed: boolean;
  note?: string | null;
}

interface PrayerData {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

interface ActivityItem {
  id: string;
  text: string;
  authorName: string;
  category?: string | null;
  date: string;
  createdAt: string;
}

function ChildSelector({ children: childList, selectedChildId, selectChild }: {
  children: any[];
  selectedChildId: string | null;
  selectChild: (id: string) => void;
}) {
  if (childList.length <= 1) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.selectorRow}>
      {childList.map((child, index) => {
        const isSelected = child.id === selectedChildId;
        const color = child.cardColor || PASTEL_COLORS[index % PASTEL_COLORS.length];
        return (
          <Pressable key={child.id} onPress={() => selectChild(child.id)} style={s.selectorItem}>
            <View style={[s.selectorCircle, isSelected && { borderColor: color, borderWidth: 3 }]}>
              {child.photoUri ? (
                <Image source={{ uri: child.photoUri }} style={s.selectorImg} />
              ) : (
                <Text style={s.selectorInitial}>{child.name.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <Text style={[s.selectorName, isSelected && { color: Colors.textPrimary, fontFamily: 'Nunito_700Bold' }]} numberOfLines={1}>
              {child.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { children, selectedChildId, selectChild, cogenitori } = useApp();
  const { user } = useAuth();
  const { t, lang, isRTL } = useI18n();
  const queryClient = useQueryClient();

  const selectedChild = children.find(c => c.id === selectedChildId);
  const selectedIndex = children.findIndex(c => c.id === selectedChildId);
  const cardColor = selectedChild?.cardColor || PASTEL_COLORS[Math.max(0, selectedIndex) % PASTEL_COLORS.length];

  const salahEnabled = selectedChild?.salahEnabled !== false;
  const fastingEnabled = selectedChild?.fastingEnabled !== false;

  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = formatDate(currentDate);
  const todayStr = formatDate(new Date());

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [completions, setCompletions] = useState<Record<string, TaskCompletionItem>>({});
  const [prayers, setPrayers] = useState<PrayerData>({ fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false });
  const [fasting, setFasting] = useState<{ status: string; note: string }>({ status: 'no', note: '' });
  const [quranToday, setQuranToday] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
  const [quranLogs, setQuranLogs] = useState<Record<string, SurahStatus>>({});
  const [showQuranModal, setShowQuranModal] = useState(false);
  const [quranFilter, setQuranFilter] = useState<'all' | 'learned' | 'in_progress' | 'not_started'>('all');

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskFreq, setNewTaskFreq] = useState('daily');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskEndTime, setNewTaskEndTime] = useState('');
  const [newTaskDays, setNewTaskDays] = useState<number[]>([]);
  const [newTaskDayOfMonth, setNewTaskDayOfMonth] = useState('');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const dateScrollRef = useRef<FlatList>(null);

  const childId = selectedChild?.id;

  const isFemale = selectedChild?.gender?.toLowerCase() === 'femmina' || selectedChild?.gender?.toLowerCase() === 'female';
  const nameColor = isFemale ? '#FF6B6B' : '#4A90E2';

  let coParentName: string | null = null;
  if (selectedChild?.cogenitori) {
    try {
      const cogIds: string[] = JSON.parse(selectedChild.cogenitori);
      const otherCog = cogIds.filter(id => id !== user?.id).map(id => cogenitori.find(c => c.id === id)).filter(Boolean);
      if (otherCog.length > 0) {
        coParentName = otherCog[0]!.name || otherCog[0]!.email;
      }
    } catch {}
  }

  const fetchDashboardData = useCallback(async () => {
    if (!childId) return;
    try {
      const base = getApiUrl();
      const fetches: Promise<Response>[] = [
        fetch(new URL(`/api/children/${childId}/tasks`, base).toString(), { credentials: 'include' }),
        fetch(new URL(`/api/children/${childId}/completions/${dateStr}`, base).toString(), { credentials: 'include' }),
        fetch(new URL(`/api/children/${childId}/activity`, base).toString(), { credentials: 'include' }),
      ];
      if (salahEnabled) {
        fetches.push(fetch(new URL(`/api/children/${childId}/prayers/${dateStr}`, base).toString(), { credentials: 'include' }));
      }
      if (fastingEnabled) {
        fetches.push(fetch(new URL(`/api/children/${childId}/fasting/${dateStr}`, base).toString(), { credentials: 'include' }));
      }
      fetches.push(fetch(new URL(`/api/children/${childId}/quran-daily/${dateStr}`, base).toString(), { credentials: 'include' }));
      fetches.push(fetch(new URL(`/api/children/${childId}/quran`, base).toString(), { credentials: 'include' }));

      const results = await Promise.all(fetches);
      const [tasksData, compData, actData] = await Promise.all(results.slice(0, 3).map(r => r.json()));

      setTasks(Array.isArray(tasksData) ? tasksData : []);
      const compMap: Record<string, TaskCompletionItem> = {};
      if (Array.isArray(compData)) {
        compData.forEach((c: any) => { compMap[c.taskId] = { taskId: c.taskId, completed: c.completed, note: c.note }; });
      }
      setCompletions(compMap);
      setActivities(Array.isArray(actData) ? actData : []);

      let idx = 3;
      if (salahEnabled) {
        const prayerData = await results[idx].json();
        setPrayers({
          fajr: !!prayerData.fajr, dhuhr: !!prayerData.dhuhr, asr: !!prayerData.asr,
          maghrib: !!prayerData.maghrib, isha: !!prayerData.isha,
        });
        idx++;
      }
      if (fastingEnabled) {
        const fastData = await results[idx].json();
        setFasting({ status: fastData.status || 'no', note: fastData.note || '' });
        idx++;
      }
      const quranDailyData = await results[idx].json();
      setQuranToday(!!quranDailyData.completed);
      idx++;
      const quranLogsData = await results[idx].json();
      if (Array.isArray(quranLogsData)) {
        const logsMap: Record<string, SurahStatus> = {};
        quranLogsData.forEach((log: any) => { logsMap[log.surahNumber] = log.status as SurahStatus; });
        setQuranLogs(logsMap);
      }
    } catch {}
  }, [childId, dateStr, salahEnabled, fastingEnabled]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const shouldShowTask = useCallback((task: TaskItem) => {
    if (task.frequency === 'daily') return true;
    if (task.frequency === 'weekly') {
      const dayOfWeek = currentDate.getDay();
      if (task.days) {
        try {
          const daysArr: number[] = JSON.parse(task.days);
          return daysArr.includes(dayOfWeek);
        } catch {}
      }
      return true;
    }
    if (task.frequency === 'monthly') {
      if (task.days) {
        try {
          const dayOfMonth: number = JSON.parse(task.days);
          return currentDate.getDate() === dayOfMonth;
        } catch {}
      }
      return currentDate.getDate() === 1;
    }
    return true;
  }, [currentDate]);

  const todayTasks = tasks.filter(shouldShowTask);

  const toggleTaskCompletion = async (taskId: string) => {
    if (!childId) return;
    const current = completions[taskId];
    const newCompleted = !(current?.completed);
    setCompletions(prev => ({ ...prev, [taskId]: { taskId, completed: newCompleted, note: current?.note || '' } }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await apiRequest('POST', `/api/children/${childId}/completions`, { taskId, date: dateStr, completed: newCompleted, note: current?.note || '' });
    } catch {}
  };

  const togglePrayer = async (prayer: PrayerName) => {
    if (!childId) return;
    const newVal = !prayers[prayer];
    setPrayers(prev => ({ ...prev, [prayer]: newVal }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await apiRequest('POST', `/api/children/${childId}/prayers`, { date: dateStr, [prayer]: newVal });
    } catch {}
  };

  const updateFasting = async (status: string) => {
    if (!childId) return;
    setFasting(prev => ({ ...prev, status }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await apiRequest('POST', `/api/children/${childId}/fasting`, { date: dateStr, status, note: fasting.note });
    } catch {}
  };

  const toggleQuranToday = async () => {
    if (!childId) return;
    const newVal = !quranToday;
    setQuranToday(newVal);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await apiRequest('POST', `/api/children/${childId}/quran-daily`, { date: dateStr, completed: newVal });
    } catch {}
  };

  const updateSurahStatus = async (surahNumber: number, newStatus: SurahStatus) => {
    if (!childId) return;
    const key = String(surahNumber);
    setQuranLogs(prev => ({ ...prev, [key]: newStatus }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await apiRequest('POST', `/api/children/${childId}/quran`, { surahNumber: key, status: newStatus });
    } catch {}
  };

  const learnedCount = Object.values(quranLogs).filter(s => s === 'learned').length;

  const filteredSurahs = SURAH_NAMES.map((name, i) => ({
    name,
    arabicName: SURAH_NAMES_AR[i],
    number: i + 1,
    status: (quranLogs[String(i + 1)] || 'not_started') as SurahStatus,
  }))
    .filter(s => quranFilter === 'all' || s.status === quranFilter)
    .reverse();

  const handleAddTask = async () => {
    if (!childId || !newTaskName.trim()) return;
    try {
      let days: string | undefined;
      if (newTaskFreq === 'weekly' && newTaskDays.length > 0) {
        days = JSON.stringify(newTaskDays);
      } else if (newTaskFreq === 'monthly' && newTaskDayOfMonth) {
        days = newTaskDayOfMonth;
      }
      await apiRequest('POST', `/api/children/${childId}/tasks`, {
        name: newTaskName.trim(),
        frequency: newTaskFreq,
        time: newTaskTime || undefined,
        endTime: newTaskEndTime || undefined,
        days,
      });
      setNewTaskName(''); setNewTaskFreq('daily'); setNewTaskTime(''); setNewTaskEndTime('');
      setNewTaskDays([]); setNewTaskDayOfMonth('');
      setShowAddTask(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchDashboardData();
    } catch {}
  };

  const handleDeleteTask = (taskId: string, taskName: string) => {
    Alert.alert(t('delete'), `${t('deleteConfirm')} "${taskName}"?`, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: async () => {
        try {
          await apiRequest('DELETE', `/api/tasks/${taskId}`);
          fetchDashboardData();
        } catch {}
      }},
    ]);
  };

  const toggleDayOfWeek = (day: number) => {
    setNewTaskDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const dates = Array.from({ length: 61 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i - 30);
    return d;
  });

  const goToToday = () => {
    setCurrentDate(new Date());
    const todayIndex = 30;
    dateScrollRef.current?.scrollToIndex({ index: todayIndex, animated: true, viewPosition: 0.5 });
  };

  const toggleSubject = (key: string) => {
    setExpandedSubjects(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const getArabicLearnedLetters = (): string[] => {
    try {
      if (selectedChild?.arabicLearnedLetters) {
        return JSON.parse(selectedChild.arabicLearnedLetters);
      }
    } catch {}
    return [];
  };

  const toggleArabicLetter = async (letter: string) => {
    if (!childId) return;
    const current = getArabicLearnedLetters();
    const updated = current.includes(letter)
      ? current.filter(l => l !== letter)
      : [...current, letter];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await apiRequest('PATCH', `/api/children/${childId}/settings`, { arabicLearnedLetters: JSON.stringify(updated) });
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
    } catch {}
  };

  const toggleArabicSetting = async (field: 'hasHarakat' | 'canReadArabic' | 'canWriteArabic') => {
    if (!childId) return;
    const currentVal = !!(selectedChild as any)?.[field];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await apiRequest('PATCH', `/api/children/${childId}/settings`, { [field]: !currentVal });
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
    } catch {}
  };

  if (!selectedChild) {
    return (
      <View style={[s.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
        <View style={[s.emptyState, { paddingTop: topPadding + 80 }]}>
          <Ionicons name="people" size={64} color={Colors.textMuted} />
          <Text style={s.emptyText}>{t('addChildFromHome')}</Text>
          <Text style={s.emptySub}>{t('toViewDashboard')}</Text>
        </View>
      </View>
    );
  }

  const prayerCount = PRAYER_NAMES.filter(p => prayers[p]).length;

  return (
    <View style={[s.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : 100 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: topPadding + 8 }}>
          <ChildSelector children={children} selectedChildId={selectedChildId} selectChild={selectChild} />
        </View>

        <Animated.View entering={FadeIn.duration(300)} style={s.headerCard}>
          <LinearGradient
            colors={[cardColor, cardColor + '60']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.headerGradient}
          >
            <View style={s.headerRow}>
              {selectedChild.photoUri ? (
                <Image source={{ uri: selectedChild.photoUri }} style={[s.headerPhoto, { borderColor: cardColor }]} />
              ) : (
                <View style={[s.headerPhotoFallback, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
                  <Text style={[s.headerPhotoInitial, { color: cardColor }]}>{selectedChild.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={s.headerInfo}>
                <Text style={[s.headerName, { color: nameColor }]}>{selectedChild.name}</Text>
                <Text style={s.headerAge}>{getAge(selectedChild.birthDate, t)}</Text>
                {coParentName && (
                  <Text style={s.headerCoParent}>
                    {isFemale ? t('daughterOf') : t('sonOf')}{' '}
                    <Text style={{ color: '#333', fontFamily: 'Nunito_700Bold' }}>{coParentName}</Text>
                  </Text>
                )}
              </View>
              <Pressable onPress={() => setShowAddTask(true)} style={s.addTaskBtn}>
                <Ionicons name="add" size={24} color={Colors.white} />
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={s.dateBarWrap}>
          <View style={s.dateBarHeader}>
            <Text style={s.dateBarMonth}>
              {getMonthName(currentDate, lang)} {currentDate.getFullYear()}
            </Text>
            {dateStr !== todayStr && (
              <Pressable onPress={goToToday} style={[s.todayBtn, { backgroundColor: cardColor }]}>
                <Text style={s.todayBtnText}>{t('today')}</Text>
              </Pressable>
            )}
          </View>
          <FlatList
            ref={dateScrollRef}
            horizontal
            data={dates}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={30}
            getItemLayout={(_, i) => ({ length: 56, offset: 56 * i, index: i })}
            keyExtractor={(item) => formatDate(item)}
            renderItem={({ item }) => {
              const ds = formatDate(item);
              const isSelected = ds === dateStr;
              const isToday = ds === todayStr;
              return (
                <Pressable
                  onPress={() => setCurrentDate(new Date(item))}
                  style={[
                    s.dateItem,
                    isSelected && [s.dateItemActive, { backgroundColor: cardColor }],
                    isToday && !isSelected && s.dateItemToday,
                  ]}
                >
                  <Text style={[s.dateDayName, isSelected && s.dateDayNameActive]}>
                    {getDayName(item, lang)}
                  </Text>
                  <Text style={[s.dateNum, isSelected && s.dateNumActive]}>
                    {item.getDate()}
                  </Text>
                </Pressable>
              );
            }}
            contentContainerStyle={{ paddingHorizontal: 12 }}
          />
        </Animated.View>

        <View style={s.sectionsWrap}>
          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <Text style={s.sectionTitle}>{t('todayEvents')}</Text>
            {todayTasks.length > 0 ? (
              <View style={s.card}>
                {todayTasks.map((task, i) => {
                  const comp = completions[task.id];
                  const timeDisplay = task.time && task.endTime
                    ? `${task.time} - ${task.endTime}`
                    : task.time || task.endTime || null;
                  return (
                    <View key={task.id} style={[s.taskRow, i > 0 && s.taskRowBorder]}>
                      <Pressable onPress={() => toggleTaskCompletion(task.id)} style={s.taskCheck}>
                        <View style={[s.checkBox, comp?.completed && { backgroundColor: Colors.mintGreen, borderColor: Colors.mintGreen }]}>
                          {comp?.completed && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                        </View>
                      </Pressable>
                      <View style={s.taskInfo}>
                        <Text style={[s.taskName, comp?.completed && s.taskNameDone]}>{task.name}</Text>
                        {timeDisplay && <Text style={s.taskTime}>{timeDisplay}</Text>}
                      </View>
                      <Pressable onPress={() => handleDeleteTask(task.id, task.name)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={s.emptyCard}>
                <Ionicons name="calendar-outline" size={32} color={Colors.textMuted} />
                <Text style={s.emptyCardText}>{t('noEventsToday')}</Text>
                <Text style={s.emptyCardSub}>{t('addWithPlus')}</Text>
              </View>
            )}
          </Animated.View>

          {salahEnabled && (
            <Animated.View entering={FadeInDown.delay(300).duration(300)}>
              <Text style={s.sectionTitle}>{t('salahToday')}</Text>
              <View style={s.card}>
                <View style={s.prayerGrid}>
                  {PRAYER_NAMES.map((prayer) => {
                    const done = prayers[prayer];
                    return (
                      <Pressable key={prayer} onPress={() => togglePrayer(prayer)} style={s.prayerItem}>
                        <View style={[s.prayerCircle, done && { backgroundColor: Colors.mintGreen, borderColor: Colors.mintGreen }]}>
                          {done ? (
                            <Ionicons name="checkmark" size={20} color={Colors.white} />
                          ) : (
                            <MaterialCommunityIcons name="mosque" size={18} color={Colors.textMuted} />
                          )}
                        </View>
                        <Text style={[s.prayerLabel, done && s.prayerLabelDone]}>{t(prayer)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={s.prayerSummary}>
                  <View style={[s.prayerBar, { width: '100%' }]}>
                    <View style={[s.prayerBarFill, { width: `${(prayerCount / 5) * 100}%`, backgroundColor: cardColor }]} />
                  </View>
                  <Text style={s.prayerCountText}>{prayerCount}/5</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {fastingEnabled && (
            <Animated.View entering={FadeInDown.delay(400).duration(300)}>
              <View style={s.fastingHeaderRow}>
                <Text style={s.sectionTitle}>{t('fastingToday')}</Text>
                <Pressable onPress={toggleQuranToday} style={s.quranTodayRow}>
                  <View style={[s.quranCheckBox, quranToday && { backgroundColor: Colors.mintGreen, borderColor: Colors.mintGreen }]}>
                    {quranToday && <Ionicons name="checkmark" size={12} color={Colors.white} />}
                  </View>
                  <Text style={s.quranTodayLabel}>{t('quranToday')}</Text>
                </Pressable>
              </View>
              <View style={s.card}>
                <View style={s.fastingRow}>
                  {(['yes', 'no', 'partial'] as const).map((status) => {
                    const isActive = fasting.status === status;
                    const color = status === 'yes' ? Colors.mintGreen : status === 'partial' ? '#F4C430' : Colors.textMuted;
                    return (
                      <Pressable
                        key={status}
                        onPress={() => updateFasting(status)}
                        style={[s.fastingBtn, isActive && { backgroundColor: color + '20', borderColor: color }]}
                      >
                        <Ionicons
                          name={status === 'yes' ? 'checkmark-circle' : status === 'partial' ? 'remove-circle' : 'close-circle'}
                          size={20}
                          color={isActive ? color : Colors.textMuted}
                        />
                        <Text style={[s.fastingBtnText, isActive && { color }]}>{t(status)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </Animated.View>
          )}

          {!fastingEnabled && (
            <Animated.View entering={FadeInDown.delay(400).duration(300)}>
              <View style={s.fastingHeaderRow}>
                <View />
                <Pressable onPress={toggleQuranToday} style={s.quranTodayRow}>
                  <View style={[s.quranCheckBox, quranToday && { backgroundColor: Colors.mintGreen, borderColor: Colors.mintGreen }]}>
                    {quranToday && <Ionicons name="checkmark" size={12} color={Colors.white} />}
                  </View>
                  <Text style={s.quranTodayLabel}>{t('quranToday')}</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(500).duration(300)}>
            <Text style={s.sectionTitle}>{t('subjects')}</Text>
            <View style={s.card}>
              {SUBJECTS.map((subject, i) => {
                const isExpanded = expandedSubjects.includes(subject.key);
                return (
                  <View key={subject.key}>
                    <Pressable
                      onPress={() => toggleSubject(subject.key)}
                      style={[s.subjectRow, i > 0 && s.taskRowBorder]}
                    >
                      <Ionicons name={subject.icon as any} size={20} color={cardColor} />
                      <Text style={s.subjectName}>{t(subject.key)}</Text>
                      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
                    </Pressable>
                    {isExpanded && subject.key === 'arabo' && (
                      <View style={s.subjectContent}>
                        <Text style={s.arabicCountLabel}>{t('learnedLetters')}: {getArabicLearnedLetters().length} / 28</Text>
                        <View style={s.arabicLettersGrid}>
                          {ARABIC_LETTERS.map((letter) => {
                            const isSelected = getArabicLearnedLetters().includes(letter);
                            return (
                              <Pressable
                                key={letter}
                                onPress={() => toggleArabicLetter(letter)}
                                style={[s.arabicLetterChip, isSelected && { backgroundColor: Colors.mintGreen }]}
                              >
                                <Text style={[s.arabicLetterText, isSelected && { color: Colors.white }]}>{letter}</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                        <View style={s.arabicToggleRow}>
                          <Text style={s.arabicToggleLabel}>{t('harakat')}</Text>
                          <Pressable
                            onPress={() => toggleArabicSetting('hasHarakat')}
                            style={[s.arabicPill, selectedChild?.hasHarakat && { backgroundColor: Colors.mintGreen, borderColor: Colors.mintGreen }]}
                          >
                            <Text style={[s.arabicPillText, selectedChild?.hasHarakat && { color: Colors.white }]}>
                              {selectedChild?.hasHarakat ? t('yes') : t('no')}
                            </Text>
                          </Pressable>
                        </View>
                        <View style={s.arabicToggleRow}>
                          <Text style={s.arabicToggleLabel}>{t('canReadArabic')}</Text>
                          <Pressable
                            onPress={() => toggleArabicSetting('canReadArabic')}
                            style={[s.arabicPill, selectedChild?.canReadArabic && { backgroundColor: Colors.mintGreen, borderColor: Colors.mintGreen }]}
                          >
                            <Text style={[s.arabicPillText, selectedChild?.canReadArabic && { color: Colors.white }]}>
                              {selectedChild?.canReadArabic ? t('yes') : t('no')}
                            </Text>
                          </Pressable>
                        </View>
                        <View style={s.arabicToggleRow}>
                          <Text style={s.arabicToggleLabel}>{t('canWriteArabic')}</Text>
                          <Pressable
                            onPress={() => toggleArabicSetting('canWriteArabic')}
                            style={[s.arabicPill, selectedChild?.canWriteArabic && { backgroundColor: Colors.mintGreen, borderColor: Colors.mintGreen }]}
                          >
                            <Text style={[s.arabicPillText, selectedChild?.canWriteArabic && { color: Colors.white }]}>
                              {selectedChild?.canWriteArabic ? t('yes') : t('no')}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                    {isExpanded && subject.key !== 'arabo' && (
                      <View style={s.subjectContent}>
                        <Text style={s.subjectPlaceholder}>{t('noActivity')}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(300)}>
            <Text style={s.sectionTitle}>{t('quranMemorization')}</Text>
            <Pressable onPress={() => setShowQuranModal(true)} style={s.card}>
              <View style={s.quranTapRow}>
                <Ionicons name="book-outline" size={20} color={cardColor} />
                <Text style={s.quranTapText}>{t('surahLearnedCount')}: {learnedCount} / 114</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(700).duration(300)}>
            <Text style={s.sectionTitle}>{t('recentActivityLog')}</Text>
            {activities.length > 0 ? (
              <View style={s.card}>
                {activities.slice(0, 10).map((act, i) => (
                  <View key={act.id} style={[s.activityRow, i > 0 && s.taskRowBorder]}>
                    <View style={[s.activityDot, { backgroundColor: cardColor }]} />
                    <View style={s.activityInfo}>
                      <Text style={s.activityText}>{act.text}</Text>
                      <Text style={s.activityMeta}>
                        {act.authorName} — {act.date}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={s.emptyCard}>
                <Ionicons name="time-outline" size={32} color={Colors.textMuted} />
                <Text style={s.emptyCardText}>{t('noActivity')}</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      <Modal visible={showQuranModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <Pressable style={s.modalDismiss} onPress={() => setShowQuranModal(false)} />
          <View style={[s.quranModalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>{t('quranMemorization')}</Text>
            <View style={s.quranFilterRow}>
              {(['all', 'learned', 'in_progress', 'not_started'] as const).map((f) => {
                const isActive = quranFilter === f;
                const filterColor = f === 'learned' ? Colors.mintGreen : f === 'in_progress' ? '#F4C430' : f === 'not_started' ? Colors.textMuted : cardColor;
                return (
                  <Pressable
                    key={f}
                    onPress={() => setQuranFilter(f)}
                    style={[s.quranFilterBtn, isActive && { backgroundColor: filterColor + '20', borderColor: filterColor }]}
                  >
                    <Text style={[s.quranFilterText, isActive && { color: filterColor }]}>
                      {f === 'all' ? (lang === 'ar' ? 'الكل' : lang === 'en' ? 'All' : 'Tutte') : t(f === 'learned' ? 'surahLearned' : f === 'in_progress' ? 'surahInProgress' : 'surahNotStarted')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <FlatList
              data={filteredSurahs}
              keyExtractor={(item) => String(item.number)}
              showsVerticalScrollIndicator={false}
              style={s.quranList}
              renderItem={({ item }) => (
                <View style={s.surahRow}>
                  <View style={s.surahNumBadge}>
                    <Text style={s.surahNum}>{item.number}</Text>
                  </View>
                  <View style={s.surahNameCol}>
                    <Text style={s.surahArabicName}>{item.arabicName}</Text>
                    <Text style={s.surahLatinName}>{item.name}</Text>
                  </View>
                  <View style={s.surahStatusBtns}>
                    <Pressable
                      onPress={() => updateSurahStatus(item.number, 'not_started')}
                      style={[s.surahStatusBtn, item.status === 'not_started' && { backgroundColor: '#999' + '30' }]}
                    >
                      <Ionicons name="book-outline" size={16} color={item.status === 'not_started' ? '#999' : '#ccc'} />
                    </Pressable>
                    <Pressable
                      onPress={() => updateSurahStatus(item.number, 'in_progress')}
                      style={[s.surahStatusBtn, item.status === 'in_progress' && { backgroundColor: '#F4C430' + '30' }]}
                    >
                      <Ionicons name="book" size={16} color={item.status === 'in_progress' ? '#F4C430' : '#ccc'} />
                    </Pressable>
                    <Pressable
                      onPress={() => updateSurahStatus(item.number, 'learned')}
                      style={[s.surahStatusBtn, item.status === 'learned' && { backgroundColor: Colors.mintGreen + '30' }]}
                    >
                      <Ionicons name="checkmark-circle" size={16} color={item.status === 'learned' ? Colors.mintGreen : '#ccc'} />
                    </Pressable>
                  </View>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={s.taskRowBorder} />}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showAddTask} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={s.modalOverlay}>
            <Pressable style={s.modalDismiss} onPress={() => setShowAddTask(false)} />
            <ScrollView style={s.modalScroll} contentContainerStyle={[s.modalContent, { paddingBottom: insets.bottom + 16 }]}>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>{t('addEvent')}</Text>

              <Text style={s.inputLabel}>{t('eventName')}</Text>
              <TextInput
                style={s.input}
                placeholder={t('eventNamePlaceholder')}
                placeholderTextColor={Colors.textMuted}
                value={newTaskName}
                onChangeText={setNewTaskName}
              />

              <Text style={s.inputLabel}>{t('frequency')}</Text>
              <View style={s.freqRow}>
                {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                  <Pressable
                    key={freq}
                    onPress={() => {
                      setNewTaskFreq(freq);
                      setNewTaskDays([]);
                      setNewTaskDayOfMonth('');
                    }}
                    style={[s.freqBtn, newTaskFreq === freq && { backgroundColor: cardColor + '30', borderColor: cardColor }]}
                  >
                    <Text style={[s.freqBtnText, newTaskFreq === freq && { color: cardColor }]}>{t(freq)}</Text>
                  </Pressable>
                ))}
              </View>

              {newTaskFreq === 'weekly' && (
                <>
                  <Text style={s.inputLabel}>{t('selectDay')}</Text>
                  <View style={s.dayPickerRow}>
                    {DAY_KEYS.map((dayKey, i) => {
                      const isActive = newTaskDays.includes(i);
                      return (
                        <Pressable
                          key={dayKey}
                          onPress={() => toggleDayOfWeek(i)}
                          style={[s.dayChip, isActive && { backgroundColor: cardColor, borderColor: cardColor }]}
                        >
                          <Text style={[s.dayChipText, isActive && { color: Colors.white }]}>{t(dayKey)}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              {newTaskFreq === 'monthly' && (
                <>
                  <Text style={s.inputLabel}>{t('selectDayOfMonth')}</Text>
                  <TextInput
                    style={s.input}
                    placeholder="1-31"
                    placeholderTextColor={Colors.textMuted}
                    value={newTaskDayOfMonth}
                    onChangeText={(v) => {
                      const num = parseInt(v);
                      if (v === '' || (num >= 1 && num <= 31)) setNewTaskDayOfMonth(v);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </>
              )}

              <View style={s.timeRow}>
                <View style={s.timeCol}>
                  <Text style={s.inputLabel}>{t('startTime')}</Text>
                  <TextInput
                    style={s.input}
                    placeholder="HH:MM"
                    placeholderTextColor={Colors.textMuted}
                    value={newTaskTime}
                    onChangeText={setNewTaskTime}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
                <View style={s.timeCol}>
                  <Text style={s.inputLabel}>{t('endTimePicker')}</Text>
                  <TextInput
                    style={s.input}
                    placeholder="HH:MM"
                    placeholderTextColor={Colors.textMuted}
                    value={newTaskEndTime}
                    onChangeText={setNewTaskEndTime}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              </View>

              <Pressable
                onPress={handleAddTask}
                style={[s.saveBtn, { backgroundColor: cardColor }]}
              >
                <Ionicons name="checkmark" size={20} color={Colors.white} />
                <Text style={s.saveBtnText}>{t('save')}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.textSecondary, marginTop: 12 },
  emptySub: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textMuted },

  selectorRow: { paddingHorizontal: 16, gap: 12, paddingBottom: 8 },
  selectorItem: { alignItems: 'center', gap: 4 },
  selectorCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.creamBeige, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent', overflow: 'hidden',
  },
  selectorImg: { width: 44, height: 44, borderRadius: 22 },
  selectorInitial: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.textPrimary },
  selectorName: { fontFamily: 'Nunito_500Medium', fontSize: 11, color: Colors.textMuted, maxWidth: 56, textAlign: 'center' },

  headerCard: { marginHorizontal: 16, borderRadius: 24, overflow: 'hidden', marginBottom: 4 },
  headerGradient: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerPhoto: { width: 72, height: 72, borderRadius: 36, borderWidth: 3 },
  headerPhotoFallback: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  headerPhotoInitial: { fontFamily: 'Nunito_800ExtraBold', fontSize: 28 },
  headerInfo: { flex: 1 },
  headerName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 22 },
  headerAge: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: Colors.textPrimary },
  headerCoParent: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textPrimary, marginTop: 2 },
  addTaskBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.mintGreen,
    alignItems: 'center', justifyContent: 'center',
  },

  dateBarWrap: { marginBottom: 8 },
  dateBarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8 },
  dateBarMonth: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.textPrimary },
  todayBtn: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  todayBtnText: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.white },
  dateItem: {
    width: 48, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 4, backgroundColor: Colors.cardBackground,
  },
  dateItemActive: { borderWidth: 0 },
  dateItemToday: { borderWidth: 2, borderColor: Colors.mintGreen },
  dateDayName: { fontFamily: 'Nunito_500Medium', fontSize: 11, color: Colors.textMuted },
  dateDayNameActive: { color: Colors.white },
  dateNum: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.textPrimary },
  dateNumActive: { color: Colors.white },

  sectionsWrap: { paddingHorizontal: 16, gap: 8 },
  sectionTitle: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: Colors.textPrimary, marginTop: 12, marginBottom: 8 },
  card: {
    backgroundColor: Colors.cardBackground, borderRadius: 20, padding: 16,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  emptyCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 20, padding: 24,
    alignItems: 'center', gap: 8,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  emptyCardText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.textMuted },
  emptyCardSub: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted },

  taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  taskRowBorder: { borderTopWidth: 1, borderTopColor: Colors.creamBeige },
  taskCheck: { padding: 2 },
  checkBox: {
    width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: Colors.textMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  taskInfo: { flex: 1 },
  taskName: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: Colors.textPrimary },
  taskNameDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  taskTime: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted },

  prayerGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  prayerItem: { alignItems: 'center', gap: 6, flex: 1 },
  prayerCircle: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: Colors.creamBeige,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.creamBeige,
  },
  prayerLabel: { fontFamily: 'Nunito_500Medium', fontSize: 11, color: Colors.textSecondary },
  prayerLabelDone: { color: Colors.mintGreenDark, fontFamily: 'Nunito_700Bold' },
  prayerSummary: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  prayerBar: { height: 6, borderRadius: 3, backgroundColor: Colors.creamBeige, flex: 1 },
  prayerBarFill: { height: 6, borderRadius: 3 },
  prayerCountText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.textSecondary, minWidth: 28 },

  fastingHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 8 },
  quranTodayRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  quranCheckBox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: Colors.textMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  quranTodayLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.textSecondary },

  fastingRow: { flexDirection: 'row', gap: 10 },
  fastingBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 14, borderWidth: 2, borderColor: Colors.creamBeige,
    backgroundColor: Colors.creamBeige,
  },
  fastingBtnText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.textSecondary },

  quranTapRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quranTapText: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: Colors.textPrimary, flex: 1 },
  quranModalContent: {
    backgroundColor: Colors.cardBackground, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '85%',
  },
  quranFilterRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  quranFilterBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.creamBeige, backgroundColor: Colors.creamBeige,
  },
  quranFilterText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.textSecondary },
  quranList: { flex: 1 },
  surahRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  surahNumBadge: {
    width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.creamBeige,
  },
  surahNum: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.textSecondary },
  surahNameCol: { flex: 1 },
  surahArabicName: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.textPrimary },
  surahLatinName: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted },
  surahStatusBtns: { flexDirection: 'row', gap: 6 },
  surahStatusBtn: {
    width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.creamBeige,
  },

  subjectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  subjectName: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: Colors.textPrimary, flex: 1 },
  subjectContent: { paddingLeft: 12, paddingBottom: 12 },
  subjectPlaceholder: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textMuted, fontStyle: 'italic' },

  arabicCountLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  arabicLettersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  arabicLetterChip: {
    width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.creamBeige,
  },
  arabicLetterText: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.textPrimary },
  arabicToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  arabicToggleLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.textSecondary },
  arabicPill: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.creamBeige, backgroundColor: Colors.creamBeige,
  },
  arabicPillText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.textSecondary },

  activityRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: 12 },
  activityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  activityInfo: { flex: 1 },
  activityText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  activityMeta: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  modalScroll: {
    maxHeight: '80%',
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalContent: {
    padding: 24,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.textMuted, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'Nunito_700Bold', fontSize: 20, color: Colors.textPrimary, marginBottom: 20 },
  inputLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  input: {
    fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.textPrimary,
    backgroundColor: Colors.creamBeige, borderRadius: 16, padding: 14, marginBottom: 16,
  },
  freqRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  freqBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 2, borderColor: Colors.creamBeige,
    backgroundColor: Colors.creamBeige, alignItems: 'center',
  },
  freqBtnText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.textSecondary },
  dayPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  dayChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 2,
    borderColor: Colors.creamBeige, backgroundColor: Colors.creamBeige,
  },
  dayChipText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.textSecondary },
  timeRow: { flexDirection: 'row', gap: 12 },
  timeCol: { flex: 1 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 20, marginTop: 8,
  },
  saveBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.white },
});
