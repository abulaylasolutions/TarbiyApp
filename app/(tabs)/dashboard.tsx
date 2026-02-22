import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform, Pressable,
  TextInput, Modal, Alert, KeyboardAvoidingView, FlatList,
  PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
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
import { useTheme, getGenderColor, getTextOnColor } from '@/lib/theme-context';
import { useRouter } from 'expo-router';
import { getAvatarSource } from '@/lib/avatar-map';
import { AQIDAH_LEVELS, getAllAqidahLeafItems, getAqidahTotalCount, getLabel, type AqidahLeafItem, type AqidahPillar, type AqidahLevel } from '@/lib/aqidah-data';
import PremiumOverlay from '@/components/PremiumOverlay';
import { gregorianToHijri, getHijriMonthName, getCurrentHijriYear } from '@/lib/hijri';


const TIME_SLOTS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
}

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
type PrayerName = typeof PRAYER_NAMES[number];

const SUBJECTS = [
  { key: 'arabo', icon: 'book-outline' as const, color: '#A8E6CF' },
  { key: 'akhlaq', icon: 'heart-outline' as const, color: '#FFD3B6' },
  { key: 'aqidah', icon: 'star-outline' as const, color: '#C7CEEA' },
  { key: 'quran', icon: 'library-outline' as const, color: '#E0BBE4' },
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

interface AkhlaqItem { key: string; it: string; en: string; ar: string; }
interface AkhlaqCategory { key: string; it: string; en: string; ar: string; icon: string; items: AkhlaqItem[]; }

const AKHLAQ_CATEGORIES: AkhlaqCategory[] = [
  { key: 'eating', it: 'Mangiare', en: 'Eating', ar: 'الأكل', icon: 'restaurant-outline', items: [
    { key: 'eating_bismillah', it: 'Dire Bismillah prima di mangiare', en: 'Say Bismillah before eating', ar: 'قول بسم الله قبل الأكل' },
    { key: 'eating_right_hand', it: 'Mangiare con la mano destra', en: 'Eat with the right hand', ar: 'الأكل باليد اليمنى' },
    { key: 'eating_nearby', it: 'Mangiare dal piatto piu vicino', en: 'Eat from the nearest part', ar: 'الأكل مما يليه' },
    { key: 'eating_alhamdulillah', it: 'Dire Alhamdulillah dopo', en: 'Say Alhamdulillah after', ar: 'قول الحمد لله بعد الأكل' },
    { key: 'eating_no_waste', it: 'Non sprecare il cibo', en: 'Do not waste food', ar: 'عدم تبذير الطعام' },
  ]},
  { key: 'drinking', it: 'Bere', en: 'Drinking', ar: 'الشرب', icon: 'water-outline', items: [
    { key: 'drinking_bismillah', it: 'Dire Bismillah prima di bere', en: 'Say Bismillah before drinking', ar: 'قول بسم الله قبل الشرب' },
    { key: 'drinking_sitting', it: 'Bere da seduti', en: 'Drink while sitting', ar: 'الشرب جالسًا' },
    { key: 'drinking_right', it: 'Bere con la mano destra', en: 'Drink with right hand', ar: 'الشرب باليمنى' },
    { key: 'drinking_three_sips', it: 'Bere in tre sorsi', en: 'Drink in three sips', ar: 'الشرب على ثلاث' },
  ]},
  { key: 'sleeping', it: 'Dormire e svegliarsi', en: 'Sleeping & waking', ar: 'النوم والاستيقاظ', icon: 'moon-outline', items: [
    { key: 'sleep_wudu', it: 'Fare il wudu prima di dormire', en: 'Perform wudu before sleeping', ar: 'الوضوء قبل النوم' },
    { key: 'sleep_right_side', it: 'Dormire sul fianco destro', en: 'Sleep on right side', ar: 'النوم على الجنب الأيمن' },
    { key: 'sleep_dua', it: 'Recitare la dua prima di dormire', en: 'Recite dua before sleeping', ar: 'دعاء النوم' },
    { key: 'wake_dua', it: 'Recitare la dua al risveglio', en: 'Recite dua upon waking', ar: 'دعاء الاستيقاظ' },
  ]},
  { key: 'bathroom', it: 'Usare il bagno', en: 'Using the bathroom', ar: 'دخول الخلاء', icon: 'water', items: [
    { key: 'bathroom_left_foot', it: 'Entrare con il piede sinistro', en: 'Enter with left foot', ar: 'الدخول بالرجل اليسرى' },
    { key: 'bathroom_dua_enter', it: 'Dire la dua entrando', en: 'Say dua upon entering', ar: 'دعاء الدخول' },
    { key: 'bathroom_dua_exit', it: 'Dire la dua uscendo', en: 'Say dua upon exiting', ar: 'دعاء الخروج' },
    { key: 'bathroom_right_exit', it: 'Uscire con il piede destro', en: 'Exit with right foot', ar: 'الخروج بالرجل اليمنى' },
  ]},
  { key: 'greeting', it: 'Saluto (Salam)', en: 'Greeting (Salam)', ar: 'السلام', icon: 'hand-left-outline', items: [
    { key: 'greeting_salam', it: 'Dire Assalamu Alaykum', en: 'Say Assalamu Alaykum', ar: 'قول السلام عليكم' },
    { key: 'greeting_reply', it: 'Rispondere al salam', en: 'Reply to salam', ar: 'رد السلام' },
    { key: 'greeting_smile', it: 'Sorridere incontrando gli altri', en: 'Smile when meeting others', ar: 'الابتسامة عند اللقاء' },
  ]},
  { key: 'parents', it: 'Rispetto dei genitori', en: 'Respecting parents', ar: 'بر الوالدين', icon: 'people-outline', items: [
    { key: 'parents_obey', it: 'Obbedire ai genitori', en: 'Obey parents', ar: 'طاعة الوالدين' },
    { key: 'parents_kind_words', it: 'Parlare con gentilezza', en: 'Speak kindly to them', ar: 'الكلام الطيب لهما' },
    { key: 'parents_help', it: 'Aiutare in casa', en: 'Help at home', ar: 'المساعدة في البيت' },
    { key: 'parents_dua', it: 'Fare dua per i genitori', en: 'Make dua for parents', ar: 'الدعاء للوالدين' },
  ]},
  { key: 'mosque', it: 'Andare in moschea', en: 'Going to the mosque', ar: 'الذهاب للمسجد', icon: 'business-outline', items: [
    { key: 'mosque_right_foot', it: 'Entrare con il piede destro', en: 'Enter with right foot', ar: 'الدخول بالرجل اليمنى' },
    { key: 'mosque_dua', it: 'Dire la dua entrando', en: 'Say dua upon entering', ar: 'دعاء الدخول' },
    { key: 'mosque_quiet', it: 'Stare in silenzio nella moschea', en: 'Be quiet in the mosque', ar: 'الهدوء في المسجد' },
    { key: 'mosque_tahiyya', it: 'Pregare la tahiyyat al-masjid', en: 'Pray tahiyyat al-masjid', ar: 'صلاة تحية المسجد' },
  ]},
  { key: 'honesty', it: 'Onesta e sincerita', en: 'Honesty & sincerity', ar: 'الصدق والإخلاص', icon: 'shield-checkmark-outline', items: [
    { key: 'honesty_truth', it: 'Dire sempre la verita', en: 'Always tell the truth', ar: 'قول الصدق دائمًا' },
    { key: 'honesty_promise', it: 'Mantenere le promesse', en: 'Keep promises', ar: 'الوفاء بالعهد' },
    { key: 'honesty_no_cheat', it: 'Non imbrogliare', en: 'Do not cheat', ar: 'عدم الغش' },
  ]},
  { key: 'kindness', it: 'Gentilezza e generosita', en: 'Kindness & generosity', ar: 'اللطف والكرم', icon: 'heart-outline', items: [
    { key: 'kindness_share', it: 'Condividere con gli altri', en: 'Share with others', ar: 'المشاركة مع الآخرين' },
    { key: 'kindness_help_others', it: 'Aiutare chi ha bisogno', en: 'Help those in need', ar: 'مساعدة المحتاجين' },
    { key: 'kindness_animals', it: 'Essere gentili con gli animali', en: 'Be kind to animals', ar: 'الرفق بالحيوانات' },
  ]},
  { key: 'patience', it: 'Pazienza (Sabr)', en: 'Patience (Sabr)', ar: 'الصبر', icon: 'timer-outline', items: [
    { key: 'patience_anger', it: 'Controllare la rabbia', en: 'Control anger', ar: 'التحكم في الغضب' },
    { key: 'patience_wait', it: 'Aspettare il proprio turno', en: 'Wait for your turn', ar: 'انتظار الدور' },
    { key: 'patience_difficulty', it: 'Avere pazienza nelle difficolta', en: 'Be patient in difficulty', ar: 'الصبر على المصائب' },
  ]},
  { key: 'cleanliness', it: 'Pulizia e igiene', en: 'Cleanliness & hygiene', ar: 'النظافة', icon: 'sparkles-outline', items: [
    { key: 'clean_hands', it: 'Lavarsi le mani spesso', en: 'Wash hands often', ar: 'غسل اليدين كثيرًا' },
    { key: 'clean_clothes', it: 'Vestiti puliti e ordinati', en: 'Clean and tidy clothes', ar: 'الملابس النظيفة' },
    { key: 'clean_room', it: 'Tenere la stanza in ordine', en: 'Keep room tidy', ar: 'ترتيب الغرفة' },
    { key: 'clean_teeth', it: 'Usare il miswak / lavarsi i denti', en: 'Use miswak / brush teeth', ar: 'استخدام السواك' },
  ]},
  { key: 'dua', it: 'Adhkar e dua quotidiane', en: 'Daily adhkar & dua', ar: 'الأذكار والأدعية', icon: 'book-outline', items: [
    { key: 'dua_morning', it: 'Adhkar del mattino', en: 'Morning adhkar', ar: 'أذكار الصباح' },
    { key: 'dua_evening', it: 'Adhkar della sera', en: 'Evening adhkar', ar: 'أذكار المساء' },
    { key: 'dua_travel', it: 'Dua per il viaggio', en: 'Dua for travel', ar: 'دعاء السفر' },
    { key: 'dua_sneezing', it: 'Dire Alhamdulillah dopo starnuto', en: 'Say Alhamdulillah after sneezing', ar: 'الحمد لله عند العطاس' },
  ]},
  { key: 'siblings', it: 'Rapporto con fratelli', en: 'Relations with siblings', ar: 'العلاقة مع الإخوة', icon: 'people-circle-outline', items: [
    { key: 'siblings_share', it: 'Condividere giocattoli e cibo', en: 'Share toys and food', ar: 'مشاركة الألعاب والطعام' },
    { key: 'siblings_no_fight', it: 'Non litigare con fratelli', en: 'Do not fight with siblings', ar: 'عدم المشاجرة مع الإخوة' },
    { key: 'siblings_forgive', it: 'Perdonare e chiedere scusa', en: 'Forgive and apologize', ar: 'التسامح والاعتذار' },
  ]},
  { key: 'elders', it: 'Rispetto per gli anziani', en: 'Respecting elders', ar: 'احترام الكبار', icon: 'accessibility-outline', items: [
    { key: 'elders_stand', it: 'Alzarsi per gli anziani', en: 'Stand up for elders', ar: 'القيام للكبار' },
    { key: 'elders_listen', it: 'Ascoltare con rispetto', en: 'Listen with respect', ar: 'الإنصات باحترام' },
    { key: 'elders_help', it: 'Aiutare gli anziani', en: 'Help the elderly', ar: 'مساعدة كبار السن' },
  ]},
  { key: 'speech', it: 'Parola buona', en: 'Good speech', ar: 'الكلمة الطيبة', icon: 'chatbubble-ellipses-outline', items: [
    { key: 'speech_no_bad', it: 'Non dire parolacce', en: 'No bad language', ar: 'عدم السب والشتم' },
    { key: 'speech_no_lie', it: 'Non mentire', en: 'Do not lie', ar: 'عدم الكذب' },
    { key: 'speech_no_gossip', it: 'Non fare pettegolezzi', en: 'No gossip', ar: 'عدم الغيبة والنميمة' },
    { key: 'speech_kind', it: 'Parlare con dolcezza', en: 'Speak kindly', ar: 'الكلام بلطف' },
  ]},
  { key: 'guests', it: 'Ospitalita', en: 'Hospitality', ar: 'الضيافة', icon: 'home-outline', items: [
    { key: 'guests_welcome', it: 'Accogliere gli ospiti', en: 'Welcome guests', ar: 'استقبال الضيوف' },
    { key: 'guests_serve', it: 'Offrire da bere e mangiare', en: 'Offer food and drink', ar: 'تقديم الطعام والشراب' },
    { key: 'guests_farewell', it: 'Accompagnare alla porta', en: 'See guests to the door', ar: 'توديع الضيف' },
  ]},
  { key: 'clothing', it: 'Vestirsi con modestia', en: 'Modest dressing', ar: 'اللباس بحشمة', icon: 'shirt-outline', items: [
    { key: 'clothing_right_first', it: 'Iniziare con il lato destro', en: 'Start with right side', ar: 'البدء باليمين' },
    { key: 'clothing_dua', it: 'Dire la dua vestendosi', en: 'Say dua when dressing', ar: 'دعاء اللبس' },
    { key: 'clothing_modest', it: 'Vestirsi con modestia', en: 'Dress modestly', ar: 'الاحتشام في اللباس' },
  ]},
  { key: 'gratitude', it: 'Gratitudine (Shukr)', en: 'Gratitude (Shukr)', ar: 'الشكر', icon: 'gift-outline', items: [
    { key: 'gratitude_thank_allah', it: 'Ringraziare Allah sempre', en: 'Thank Allah always', ar: 'شكر الله دائمًا' },
    { key: 'gratitude_thank_people', it: 'Ringraziare le persone', en: 'Thank people', ar: 'شكر الناس' },
    { key: 'gratitude_content', it: 'Essere contenti di cio che si ha', en: 'Be content with what you have', ar: 'الرضا بما عندك' },
  ]},
  { key: 'humility', it: 'Umilta (Tawadu)', en: 'Humility (Tawadu)', ar: 'التواضع', icon: 'trending-down-outline', items: [
    { key: 'humility_no_boast', it: 'Non vantarsi', en: 'Do not boast', ar: 'عدم التفاخر' },
    { key: 'humility_accept_advice', it: 'Accettare i consigli', en: 'Accept advice', ar: 'قبول النصيحة' },
    { key: 'humility_admit_mistake', it: 'Ammettere gli errori', en: 'Admit mistakes', ar: 'الاعتراف بالخطأ' },
  ]},
  { key: 'moderation', it: 'Moderarsi', en: 'Moderation', ar: 'الاعتدال', icon: 'options-outline', items: [
    { key: 'moderation_food', it: 'Non mangiare troppo', en: 'Do not overeat', ar: 'عدم الإسراف في الأكل' },
    { key: 'moderation_play', it: 'Non esagerare nel gioco', en: 'Do not over-play', ar: 'عدم الإسراف في اللعب' },
    { key: 'moderation_screen', it: 'Limitare tempo davanti allo schermo', en: 'Limit screen time', ar: 'تقليل وقت الشاشة' },
  ]},
];

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
  createdAt?: string | null;
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
  const { colors, isDark } = useTheme();
  if (childList.length <= 1) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.selectorRow}>
      {childList.map((child, index) => {
        const isSelected = child.id === selectedChildId;
        const color = getGenderColor(child.gender);
        return (
          <Pressable key={`${child.id}-${child.avatarAsset || 'none'}`} onPress={() => selectChild(child.id)} style={s.selectorItem}>
            <View style={[s.selectorCircle, { backgroundColor: colors.creamBeige }, isSelected && { borderColor: color, borderWidth: 3 }]}>
              {child.avatarAsset && getAvatarSource(child.avatarAsset) ? (
                <Image
                  source={getAvatarSource(child.avatarAsset)}
                  style={s.selectorImg}
                  contentFit="cover"
                  transition={0}
                />
              ) : (
                <Text style={[s.selectorInitial, { color: colors.textPrimary }]}>{child.name.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <Text style={[s.selectorName, { color: colors.textMuted }, isSelected && { color: colors.textPrimary, fontFamily: 'Nunito_700Bold' }]} numberOfLines={1}>
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
  const { children, selectedChildId, selectChild, cogenitori, refreshChildren } = useApp();
  const { user, refreshUser } = useAuth();
  const { t, lang, isRTL } = useI18n();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const premiumRouter = useRouter();
  const isPremium = user?.isPremium;
  const [showEventPremiumOverlay, setShowEventPremiumOverlay] = useState(false);

  const selectedChild = children.find(c => c.id === selectedChildId);
  const selectedIndex = children.findIndex(c => c.id === selectedChildId);
  const cardColor = getGenderColor(selectedChild?.gender);

  const salahEnabled = selectedChild?.salahEnabled !== false;
  const fastingEnabled = selectedChild?.fastingEnabled !== false;
  const trackQuranToday = selectedChild?.trackQuranToday !== false;

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
  const [localArabicLetters, setLocalArabicLetters] = useState<string[]>([]);
  const [localHarakat, setLocalHarakat] = useState(false);
  const [localCanRead, setLocalCanRead] = useState(false);
  const [localCanWrite, setLocalCanWrite] = useState(false);
  const [localAkhlaqChecked, setLocalAkhlaqChecked] = useState<string[]>([]);
  const [expandedAkhlaqCats, setExpandedAkhlaqCats] = useState<string[]>([]);
  const [aqidahItems, setAqidahItems] = useState<Record<string, { checked: boolean; note: string }>>({});
  const [expandedAqidahSections, setExpandedAqidahSections] = useState<string[]>([]);
  const [expandedAqidahPillars, setExpandedAqidahPillars] = useState<string[]>([]);
  const [editingAqidahNote, setEditingAqidahNote] = useState<string | null>(null);
  const [aqidahNoteText, setAqidahNoteText] = useState('');
  const [prophetModal, setProphetModal] = useState<AqidahLeafItem | null>(null);
  const [akhlaqNotesMap, setAkhlaqNotesMap] = useState<Record<string, string>>({});
  const [editingAkhlaqNote, setEditingAkhlaqNote] = useState<string | null>(null);
  const [akhlaqNoteText, setAkhlaqNoteText] = useState('');

  const trackRamadan = (selectedChild as any)?.trackRamadan === true;
  const useHijri = (user as any)?.preferredHijriCalendar === true;
  const currentHijriYear = getCurrentHijriYear();
  const [ramadanYear, setRamadanYear] = useState(() => String(currentHijriYear));
  const [ramadanLogs, setRamadanLogs] = useState<Record<string, boolean>>({});
  const [ramadanLoading, setRamadanLoading] = useState(true);

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskFreq, setNewTaskFreq] = useState('daily');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskEndTime, setNewTaskEndTime] = useState('');
  const [newTaskDays, setNewTaskDays] = useState<number[]>([]);
  const [newTaskDayOfMonth, setNewTaskDayOfMonth] = useState('');

  const [longPressTask, setLongPressTask] = useState<TaskItem | null>(null);
  const [showEditTask, setShowEditTask] = useState(false);
  const [editTaskId, setEditTaskId] = useState('');
  const [editTaskName, setEditTaskName] = useState('');
  const [editTaskFreq, setEditTaskFreq] = useState('daily');
  const [editTaskTime, setEditTaskTime] = useState('');
  const [editTaskEndTime, setEditTaskEndTime] = useState('');
  const [editTaskDays, setEditTaskDays] = useState<number[]>([]);
  const [editTaskDayOfMonth, setEditTaskDayOfMonth] = useState('');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const dateScrollRef = useRef<FlatList>(null);

  const childrenRef = useRef(children);
  const selectedIndexRef = useRef(selectedIndex);
  childrenRef.current = children;
  selectedIndexRef.current = selectedIndex;

  const swipePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 2);
      },
      onPanResponderRelease: (_, gestureState) => {
        const c = childrenRef.current;
        const si = selectedIndexRef.current;
        if (gestureState.dx < -50 && c.length > 1) {
          const nextIdx = si >= c.length - 1 ? 0 : si + 1;
          selectChild(c[nextIdx].id);
        } else if (gestureState.dx > 50 && c.length > 1) {
          const prevIdx = si <= 0 ? c.length - 1 : si - 1;
          selectChild(c[prevIdx].id);
        }
      },
    })
  ).current;

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
      fetches.push(fetch(new URL(`/api/children/${childId}/aqidah`, base).toString(), { credentials: 'include' }));
      fetches.push(fetch(new URL(`/api/children/${childId}/akhlaq-notes`, base).toString(), { credentials: 'include' }));

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
      idx++;
      const aqidahData = await results[idx].json();
      if (Array.isArray(aqidahData)) {
        const aqMap: Record<string, { checked: boolean; note: string }> = {};
        aqidahData.forEach((item: any) => { aqMap[item.itemKey] = { checked: !!item.checked, note: item.note || '' }; });
        setAqidahItems(aqMap);
      }
      idx++;
      const akhlaqNotesData = await results[idx].json();
      if (Array.isArray(akhlaqNotesData)) {
        const anMap: Record<string, string> = {};
        akhlaqNotesData.forEach((item: any) => { if (item.note) anMap[item.itemKey] = item.note; });
        setAkhlaqNotesMap(anMap);
      }
    } catch {}
  }, [childId, dateStr, salahEnabled, fastingEnabled]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const fetchRamadanLogs = useCallback(async () => {
    if (!childId || !trackRamadan) {
      setRamadanLoading(false);
      return;
    }
    setRamadanLoading(true);
    setRamadanLogs({});
    try {
      const base = getBaseUrl();
      const res = await fetch(new URL(`/api/children/${childId}/ramadan/${ramadanYear}`, base).toString(), { credentials: 'include' });
      if (res.ok) {
        const logs = await res.json();
        const map: Record<string, boolean> = {};
        logs.forEach((l: any) => { map[l.day] = l.fasted; });
        setRamadanLogs(map);
      }
    } catch {}
    setRamadanLoading(false);
  }, [childId, ramadanYear, trackRamadan]);

  useEffect(() => { fetchRamadanLogs(); }, [fetchRamadanLogs]);

  const toggleRamadanDay = async (day: number) => {
    if (!childId) return;
    const dayStr = String(day);
    const current = ramadanLogs[dayStr];
    const newVal = !current;
    setRamadanLogs(prev => ({ ...prev, [dayStr]: newVal }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await apiRequest('POST', `/api/children/${childId}/ramadan`, {
        ramadanYear,
        day: dayStr,
        fasted: newVal,
      });
    } catch {
      setRamadanLogs(prev => ({ ...prev, [dayStr]: !newVal }));
    }
    const hijriNow = gregorianToHijri(new Date());
    if (hijriNow.month === 9 && hijriNow.day === day && Number(ramadanYear) === hijriNow.year) {
      const todayDateStr = formatDate(new Date());
      const newFastingStatus = newVal ? 'yes' : 'no';
      setFasting(prev => ({ ...prev, status: newFastingStatus }));
      try {
        await apiRequest('POST', `/api/children/${childId}/fasting`, { date: todayDateStr, status: newFastingStatus, note: fasting.note });
      } catch {}
    }
  };

  const ramadanFastedCount = Object.values(ramadanLogs).filter(v => v === true).length;

  const shouldShowTask = useCallback((task: TaskItem) => {
    if (task.frequency === 'daily') return true;
    if (task.frequency === 'once') {
      if (task.days) {
        try {
          return task.days === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        } catch {}
      }
      const created = task.createdAt ? new Date(task.createdAt) : new Date();
      return created.toDateString() === currentDate.toDateString();
    }
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
    const newStatus = fasting.status === status ? 'no' : status;
    setFasting(prev => ({ ...prev, status: newStatus }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await apiRequest('POST', `/api/children/${childId}/fasting`, { date: dateStr, status: newStatus, note: fasting.note });
    } catch {}
    if (trackRamadan) {
      const hijri = gregorianToHijri(currentDate);
      if (hijri.month === 9 && hijri.day >= 1 && hijri.day <= 30) {
        const dayStr = String(hijri.day);
        const fasted = newStatus === 'yes';
        setRamadanLogs(prev => ({ ...prev, [dayStr]: fasted }));
        try {
          await apiRequest('POST', `/api/children/${childId}/ramadan`, {
            ramadanYear: String(hijri.year),
            day: dayStr,
            fasted,
          });
        } catch {}
      }
    }
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
      } else if (newTaskFreq === 'once') {
        days = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
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

  const [deletedTaskSnackbar, setDeletedTaskSnackbar] = useState<{ id: string; name: string; visible: boolean } | null>(null);
  const deletedTaskBackupRef = useRef<any>(null);

  const handleDeleteTask = async (taskId: string, taskName: string, _frequency?: string) => {
    try {
      deletedTaskBackupRef.current = { id: taskId, name: taskName };
      await apiRequest('DELETE', `/api/tasks/${taskId}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDeletedTaskSnackbar({ id: taskId, name: taskName, visible: true });
      fetchDashboardData();
      setTimeout(() => setDeletedTaskSnackbar(null), 4000);
    } catch {}
  };

  const openEditTask = (task: TaskItem) => {
    setEditTaskId(task.id);
    setEditTaskName(task.name);
    setEditTaskFreq(task.frequency);
    setEditTaskTime(task.time || '');
    setEditTaskEndTime(task.endTime || '');
    if (task.frequency === 'weekly' && task.days) {
      try { setEditTaskDays(JSON.parse(task.days)); } catch { setEditTaskDays([]); }
    } else {
      setEditTaskDays([]);
    }
    if (task.frequency === 'monthly' && task.days) {
      setEditTaskDayOfMonth(task.days);
    } else {
      setEditTaskDayOfMonth('');
    }
    setLongPressTask(null);
    setShowEditTask(true);
  };

  const handleEditTask = async () => {
    if (!editTaskName.trim()) return;
    try {
      let days: string | undefined;
      if (editTaskFreq === 'weekly' && editTaskDays.length > 0) {
        days = JSON.stringify(editTaskDays);
      } else if (editTaskFreq === 'monthly' && editTaskDayOfMonth) {
        days = editTaskDayOfMonth;
      } else if (editTaskFreq === 'once') {
        days = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      }
      const isRecurring = editTaskFreq === 'weekly' || editTaskFreq === 'monthly';
      const doSave = async () => {
        await apiRequest('PUT', `/api/tasks/${editTaskId}`, {
          name: editTaskName.trim(),
          frequency: editTaskFreq,
          time: editTaskTime || null,
          endTime: editTaskEndTime || null,
          days: days || null,
        });
        setShowEditTask(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        fetchDashboardData();
      };
      if (isRecurring) {
        Alert.alert(t('editEvent'), t('applyChangeQuestion'), [
          { text: t('cancel'), style: 'cancel' },
          { text: t('onlyThis'), onPress: doSave },
          { text: t('allFuture'), onPress: doSave },
        ]);
      } else {
        await doSave();
      }
    } catch {}
  };

  const handleLongPressTask = (task: TaskItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLongPressTask(task);
  };

  const toggleDayOfWeek = (day: number) => {
    setNewTaskDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const toggleEditDayOfWeek = (day: number) => {
    setEditTaskDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
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

  useEffect(() => {
    if (selectedChild) {
      try {
        setLocalArabicLetters(selectedChild.arabicLearnedLetters ? JSON.parse(selectedChild.arabicLearnedLetters) : []);
      } catch { setLocalArabicLetters([]); }
      setLocalHarakat(!!selectedChild.hasHarakat);
      setLocalCanRead(!!selectedChild.canReadArabic);
      setLocalCanWrite(!!selectedChild.canWriteArabic);
      try {
        setLocalAkhlaqChecked(selectedChild.akhlaqAdabChecked ? JSON.parse(selectedChild.akhlaqAdabChecked) : []);
      } catch { setLocalAkhlaqChecked([]); }
    }
  }, [selectedChild?.id, selectedChild?.arabicLearnedLetters, selectedChild?.hasHarakat, selectedChild?.canReadArabic, selectedChild?.canWriteArabic, selectedChild?.akhlaqAdabChecked]);

  const [educationFeed, setEducationFeed] = useState<{ icon: string; iconColor: string; text: string; dateTime: string }[]>([]);

  const fetchEducationFeed = useCallback(async () => {
    if (!childId) return;
    try {
      const base = getApiUrl();
      const res = await fetch(new URL(`/api/children/${childId}/education-feed`, base).toString(), { credentials: 'include' });
      const data = await res.json();
      if (!Array.isArray(data)) return;

      const allAkhlaqItems = AKHLAQ_CATEGORIES.flatMap(c => c.items);
      const allAqidahItems = getAllAqidahLeafItems();

      const items = data.map((entry: any) => {
        let icon = 'school-outline';
        let iconColor = '#A8E6CF';
        let text = entry.label || entry.key;
        const ts = entry.timestamp ? new Date(entry.timestamp) : null;
        const dateTime = ts ? `${ts.toLocaleDateString(lang === 'ar' ? 'ar' : lang === 'en' ? 'en' : 'it', { day: '2-digit', month: 'short' })} ${ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '';

        if (entry.type === 'aqidah') {
          icon = 'star';
          iconColor = '#C7CEEA';
          const aqItem = allAqidahItems.find(i => i.key === entry.key);
          text = `Aqidah: ${aqItem ? getLabel(aqItem, lang) : entry.key}`;
        } else if (entry.type === 'quran') {
          icon = 'library-outline';
          iconColor = '#E0BBE4';
          const idx = parseInt(entry.key) - 1;
          const name = SURAH_NAMES[idx] || entry.key;
          text = `${lang === 'it' ? 'Surah' : lang === 'ar' ? 'سورة' : 'Surah'} ${entry.key} - ${name}`;
        } else if (entry.type === 'akhlaq') {
          icon = 'heart';
          iconColor = '#FFD3B6';
          const akItem = allAkhlaqItems.find(i => i.key === entry.key);
          text = `Akhlaq: ${akItem ? getAkhlaqLabel(akItem) : entry.label}`;
        } else if (entry.type === 'arabo') {
          icon = 'text';
          iconColor = '#A8E6CF';
          text = `${lang === 'it' ? 'Arabo' : lang === 'ar' ? 'العربية' : 'Arabic'}: ${entry.label}`;
        }

        return { icon, iconColor, text, dateTime };
      });

      setEducationFeed(items);
    } catch {}
  }, [childId, lang]);

  useEffect(() => { fetchEducationFeed(); }, [fetchEducationFeed]);

  const toggleArabicLetter = async (letter: string) => {
    if (!childId) return;
    const updated = localArabicLetters.includes(letter)
      ? localArabicLetters.filter(l => l !== letter)
      : [...localArabicLetters, letter];
    setLocalArabicLetters(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await apiRequest('PATCH', `/api/children/${childId}/settings`, { arabicLearnedLetters: JSON.stringify(updated) });
      refreshChildren();
      fetchEducationFeed();
    } catch {}
  };

  const toggleArabicSetting = async (field: 'hasHarakat' | 'canReadArabic' | 'canWriteArabic') => {
    if (!childId) return;
    const setters: Record<string, (v: boolean) => void> = { hasHarakat: setLocalHarakat, canReadArabic: setLocalCanRead, canWriteArabic: setLocalCanWrite };
    const currentVals: Record<string, boolean> = { hasHarakat: localHarakat, canReadArabic: localCanRead, canWriteArabic: localCanWrite };
    const newVal = !currentVals[field];
    setters[field](newVal);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await apiRequest('PATCH', `/api/children/${childId}/settings`, { [field]: newVal });
      refreshChildren();
      fetchEducationFeed();
    } catch {}
  };

  const toggleAkhlaqItem = async (itemKey: string) => {
    if (!childId) return;
    const updated = localAkhlaqChecked.includes(itemKey)
      ? localAkhlaqChecked.filter(k => k !== itemKey)
      : [...localAkhlaqChecked, itemKey];
    setLocalAkhlaqChecked(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await apiRequest('PATCH', `/api/children/${childId}/settings`, { akhlaqAdabChecked: JSON.stringify(updated) });
      refreshChildren();
      fetchEducationFeed();
    } catch {}
  };

  const toggleAqidahSection = (sectionKey: string) => {
    setExpandedAqidahSections(prev =>
      prev.includes(sectionKey) ? prev.filter(k => k !== sectionKey) : [...prev, sectionKey]
    );
  };

  const toggleAqidahPillar = (pillarKey: string) => {
    setExpandedAqidahPillars(prev =>
      prev.includes(pillarKey) ? prev.filter(k => k !== pillarKey) : [...prev, pillarKey]
    );
  };

  const toggleAqidahItem = async (itemKey: string) => {
    if (!childId) return;
    const current = aqidahItems[itemKey];
    const newChecked = !(current?.checked);
    setAqidahItems(prev => ({ ...prev, [itemKey]: { checked: newChecked, note: current?.note || '' } }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await apiRequest('POST', `/api/children/${childId}/aqidah`, { itemKey, checked: newChecked, note: current?.note || '' });
      fetchEducationFeed();
    } catch {}
  };

  const saveAqidahNote = async (itemKey: string) => {
    if (!childId) return;
    const current = aqidahItems[itemKey];
    setAqidahItems(prev => ({ ...prev, [itemKey]: { checked: current?.checked || false, note: aqidahNoteText } }));
    setEditingAqidahNote(null);
    try {
      await apiRequest('POST', `/api/children/${childId}/aqidah`, { itemKey, checked: current?.checked || false, note: aqidahNoteText });
    } catch {}
  };

  const saveAkhlaqNote = async (itemKey: string) => {
    if (!childId) return;
    if (akhlaqNoteText.trim()) {
      setAkhlaqNotesMap(prev => ({ ...prev, [itemKey]: akhlaqNoteText.trim() }));
    } else {
      setAkhlaqNotesMap(prev => { const next = { ...prev }; delete next[itemKey]; return next; });
    }
    setEditingAkhlaqNote(null);
    try {
      await apiRequest('POST', `/api/children/${childId}/akhlaq-notes`, { itemKey, note: akhlaqNoteText.trim() });
    } catch {}
  };

  const aqidahCheckedCount = getAllAqidahLeafItems().filter(i => aqidahItems[i.key]?.checked).length;
  const aqidahTotalItems = getAqidahTotalCount();

  const toggleAkhlaqCategory = (catKey: string) => {
    setExpandedAkhlaqCats(prev =>
      prev.includes(catKey) ? prev.filter(k => k !== catKey) : [...prev, catKey]
    );
  };

  const [showQuranPremiumOverlay, setShowQuranPremiumOverlay] = useState(false);

  const cycleSurahStatus = async (surahNumber: number) => {
    if (!childId) return;
    if (!isPremium) {
      setShowQuranPremiumOverlay(true);
      return;
    }
    const key = String(surahNumber);
    const current = quranLogs[key] || 'not_started';
    const next: SurahStatus = current === 'not_started' ? 'in_progress' : current === 'in_progress' ? 'learned' : 'not_started';
    setQuranLogs(prev => ({ ...prev, [key]: next }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await apiRequest('POST', `/api/children/${childId}/quran`, { surahNumber: key, status: next });
      fetchEducationFeed();
    } catch {}
  };

  const getAkhlaqLabel = (item: AkhlaqItem) => {
    return lang === 'ar' ? item.ar : lang === 'en' ? item.en : item.it;
  };

  const getCatLabel = (cat: AkhlaqCategory) => {
    return lang === 'ar' ? cat.ar : lang === 'en' ? cat.en : cat.it;
  };

  const akhlaqCheckedCount = localAkhlaqChecked.length;
  const akhlaqTotalItems = AKHLAQ_CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0);

  if (!selectedChild) {
    return (
      <View style={[s.container, { direction: isRTL ? 'rtl' : 'ltr', backgroundColor: colors.background }]}>
        <View style={[s.emptyState, { paddingTop: topPadding + 80 }]}>
          <Ionicons name="people" size={64} color={colors.textMuted} />
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>{t('addChildFromHome')}</Text>
          <Text style={[s.emptySub, { color: colors.textMuted }]}>{t('toViewDashboard')}</Text>
        </View>
      </View>
    );
  }

  const prayerCount = PRAYER_NAMES.filter(p => prayers[p]).length;

  return (
    <View style={[s.container, { direction: isRTL ? 'rtl' : 'ltr', backgroundColor: colors.background }]}>
      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : 100 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: topPadding + 8 }} />

        <Animated.View entering={FadeIn.duration(300)} style={s.headerCard} {...swipePanResponder.panHandlers}>
          <LinearGradient
            colors={[cardColor, cardColor + '60']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.headerGradient}
          >
            <View style={s.headerRow}>
              {children.length > 1 && (
                <Pressable
                  onPress={() => {
                    const prevIndex = selectedIndex <= 0 ? children.length - 1 : selectedIndex - 1;
                    selectChild(children[prevIndex].id);
                  }}
                  style={s.childNavArrow}
                  hitSlop={12}
                >
                  <Ionicons name="chevron-back" size={22} color="rgba(0,0,0,0.6)" />
                </Pressable>
              )}
              {selectedChild.avatarAsset && getAvatarSource(selectedChild.avatarAsset) ? (
                <Image
                  source={getAvatarSource(selectedChild.avatarAsset)}
                  style={s.headerPhoto}
                  contentFit="cover"
                  transition={0}
                />
              ) : (
                <View style={[s.headerPhotoFallback, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
                  <Text style={[s.headerPhotoInitial, { color: cardColor }]}>{selectedChild.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={s.headerInfo}>
                <Text style={[s.headerName, { color: nameColor }]}>{selectedChild.name}</Text>
                <Text style={[s.headerAge, { color: Colors.white }]}>{getAge(selectedChild.birthDate, t)}</Text>
                {coParentName && (
                  <Text style={[s.headerCoParent, { color: Colors.white }]}>
                    {isFemale ? t('daughterOf') : t('sonOf')}{' '}
                    <Text style={{ color: Colors.white, fontFamily: 'Nunito_700Bold' }}>{coParentName}</Text>
                  </Text>
                )}
              </View>
              {children.length > 1 && (
                <Pressable
                  onPress={() => {
                    const nextIndex = selectedIndex >= children.length - 1 ? 0 : selectedIndex + 1;
                    selectChild(children[nextIndex].id);
                  }}
                  style={s.childNavArrow}
                  hitSlop={12}
                >
                  <Ionicons name="chevron-forward" size={22} color="rgba(0,0,0,0.6)" />
                </Pressable>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={s.dateBarWrap}>
          <View style={s.dateBarHeader}>
            <View style={s.dateBarTitleRow}>
              <Text style={[s.dateBarTitle, { color: colors.mintGreen }]}>{t('calendarTitle')}</Text>
              <Pressable
                onPress={async () => {
                  const newVal = !useHijri;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  try {
                    await apiRequest('PUT', '/api/auth/hijri-calendar', { preferredHijriCalendar: newVal });
                    await refreshUser();
                  } catch {}
                }}
                style={[
                  s.calSwitch,
                  { backgroundColor: useHijri ? cardColor : Colors.textMuted + '40' },
                ]}
              >
                <View style={[s.calSwitchThumb, { alignSelf: useHijri ? 'flex-end' : 'flex-start' }]} />
              </Pressable>
              <Text style={[s.calSwitchLabel, { color: colors.textMuted }]}>{useHijri ? t('hijriOn') : t('hijriOff')}</Text>
            </View>
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
            getItemLayout={(_, i) => ({ length: 80, offset: 80 * i, index: i })}
            keyExtractor={(item) => formatDate(item)}
            renderItem={({ item }) => {
              const ds = formatDate(item);
              const isSelected = ds === dateStr;
              const isToday = ds === todayStr;
              const hijri = gregorianToHijri(item, lang);
              const displayDay = useHijri ? hijri.day : item.getDate();
              const displaySub = useHijri
                ? `${hijri.monthName} ${hijri.year}`
                : `${getMonthName(item, lang)} ${item.getFullYear()}`;
              return (
                <Pressable
                  onPress={() => setCurrentDate(new Date(item))}
                  style={[
                    s.dateItem,
                    { backgroundColor: colors.cardBackground },
                    isSelected && [s.dateItemActive, { backgroundColor: cardColor }],
                    isToday && !isSelected && s.dateItemToday,
                  ]}
                >
                  <Text style={[s.dateDayName, { color: colors.textMuted }, isSelected && s.dateDayNameActive]}>
                    {getDayName(item, lang)}
                  </Text>
                  <Text style={[s.dateNum, { color: colors.textPrimary }, isSelected && s.dateNumActive]}>
                    {displayDay}
                  </Text>
                  <Text style={[s.dateMonthSub, { color: colors.textMuted }, isSelected && s.dateMonthSubActive]} numberOfLines={1}>
                    {displaySub}
                  </Text>
                </Pressable>
              );
            }}
            contentContainerStyle={{ paddingHorizontal: 12 }}
          />
        </Animated.View>

        <View style={s.sectionsWrap}>
          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <View style={s.sectionTitleRow}>
              <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{t('todayEvents')}</Text>
              <Pressable onPress={() => {
                if (!isPremium) {
                  setShowEventPremiumOverlay(true);
                  return;
                }
                setShowAddTask(true);
              }} hitSlop={8}>
                <Ionicons name="add-circle" size={26} color={isPremium ? cardColor : colors.textMuted} />
              </Pressable>
            </View>
            {todayTasks.length > 0 ? (
              <View style={[s.card, { backgroundColor: colors.cardBackground }]}>
                {todayTasks.map((task, i) => {
                  const comp = completions[task.id];
                  const timeDisplay = task.time && task.endTime
                    ? `${task.time} - ${task.endTime}`
                    : task.time || task.endTime || null;
                  return (
                    <Pressable
                      key={task.id}
                      onLongPress={() => handleLongPressTask(task)}
                      delayLongPress={400}
                      style={[s.taskRow, i > 0 && [s.taskRowBorder, { borderTopColor: colors.border }]]}
                    >
                      <Pressable onPress={() => toggleTaskCompletion(task.id)} style={s.taskCheck}>
                        <View style={[s.checkBox, { borderColor: colors.textMuted }, comp?.completed && { backgroundColor: cardColor, borderColor: cardColor }]}>
                          {comp?.completed && <Ionicons name="checkmark" size={14} color="#000000" />}
                        </View>
                      </Pressable>
                      <View style={s.taskInfo}>
                        <Text style={[s.taskName, { color: colors.textPrimary }, comp?.completed && { textDecorationLine: 'line-through', color: colors.textMuted }]}>{task.name}</Text>
                        {timeDisplay && <Text style={[s.taskTime, { color: colors.textMuted }]}>{timeDisplay}</Text>}
                        <Text style={[s.taskFreqLabel, { color: colors.textMuted }]}>{t(task.frequency as any)}</Text>
                      </View>
                      <Pressable onPress={() => handleDeleteTask(task.id, task.name, task.frequency)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                      </Pressable>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={[s.emptyCard, { backgroundColor: colors.cardBackground }]}>
                <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
                <Text style={[s.emptyCardText, { color: colors.textMuted }]}>{t('noEventsToday')}</Text>
                <Text style={[s.emptyCardSub, { color: colors.textMuted }]}>{t('addWithPlus')}</Text>
              </View>
            )}
          </Animated.View>

          {(salahEnabled || fastingEnabled) && (
            <Animated.View entering={FadeInDown.delay(300).duration(300)}>
              <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{t('salahFastingToday')}</Text>
              <View style={[s.dailyCard, { backgroundColor: colors.cardBackground }]}>
                {salahEnabled && (
                  <View style={s.dailySubsection}>
                    <View style={s.dailySubHeader}>
                      <MaterialCommunityIcons name="mosque" size={18} color={cardColor} />
                      <Text style={[s.dailySubTitle, { color: colors.textSecondary }]}>{t('salahSection')}</Text>
                    </View>
                    <View style={s.prayerGrid}>
                      {PRAYER_NAMES.map((prayer) => {
                        const done = prayers[prayer];
                        return (
                          <Pressable key={prayer} onPress={() => togglePrayer(prayer)} style={s.prayerItem}>
                            <View style={[s.prayerCircle, { backgroundColor: colors.creamBeige, borderColor: colors.creamBeige }, done && { backgroundColor: cardColor, borderColor: cardColor }]}>
                              {done ? (
                                <Ionicons name="checkmark" size={20} color="#000000" />
                              ) : (
                                <MaterialCommunityIcons name="mosque" size={18} color={colors.textMuted} />
                              )}
                            </View>
                            <Text style={[s.prayerLabel, { color: colors.textSecondary }, done && { color: colors.mintGreenDark, fontFamily: 'Nunito_700Bold' }]}>{t(prayer)}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <View style={s.prayerSummary}>
                      <View style={[s.prayerBar, { width: '100%', backgroundColor: colors.creamBeige }]}>
                        <View style={[s.prayerBarFill, { width: `${(prayerCount / 5) * 100}%`, backgroundColor: cardColor }]} />
                      </View>
                      <Text style={[s.prayerCountText, { color: colors.textSecondary }]}>{prayerCount}/5</Text>
                    </View>
                  </View>
                )}

                {fastingEnabled && salahEnabled && (
                  <View style={[s.dailyDivider, { backgroundColor: colors.border }]} />
                )}

                {fastingEnabled && (
                  <View style={s.dailySubsection}>
                    <View style={s.dailySubHeader}>
                      <Ionicons name="moon-outline" size={16} color={cardColor} />
                      <Text style={[s.dailySubTitle, { color: colors.textSecondary }]}>{t('fastingSection')}</Text>
                    </View>
                    <View style={s.fastingRow}>
                      <Pressable
                        onPress={() => updateFasting('yes')}
                        style={[s.fastingBtn, { flex: 1, backgroundColor: colors.creamBeige, borderColor: colors.creamBeige }, fasting.status === 'yes' && { backgroundColor: cardColor + '20', borderColor: cardColor }]}
                      >
                        <Ionicons name="checkmark-circle" size={18} color={fasting.status === 'yes' ? cardColor : colors.textMuted} />
                        <Text style={[s.fastingBtnText, { color: colors.textSecondary }, fasting.status === 'yes' && { color: cardColor }]}>{t('yes')}</Text>
                      </Pressable>
                      {!trackRamadan && (
                        <Pressable
                          onPress={() => updateFasting('partial')}
                          style={[s.fastingBtn, { flex: 1, backgroundColor: colors.creamBeige, borderColor: colors.creamBeige }, fasting.status === 'partial' && { backgroundColor: cardColor + '20', borderColor: cardColor }]}
                        >
                          <Ionicons name="remove-circle" size={18} color={fasting.status === 'partial' ? cardColor : colors.textMuted} />
                          <Text style={[s.fastingBtnText, { color: colors.textSecondary }, fasting.status === 'partial' && { color: cardColor }]}>{t('partial')}</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {trackRamadan && (
            <Animated.View entering={FadeInDown.delay(450).duration(300)}>
              <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{t('ramadanTracker')}</Text>
              <View style={[s.subjectCard, { padding: 16, backgroundColor: colors.cardBackground }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ width: 32 }} />
                  <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 16, color: colors.textPrimary }}>
                    {t('ramadanTracker')} {ramadanYear}
                  </Text>
                  <Pressable
                    onPress={() => {
                      const next = Number(ramadanYear) + 1;
                      setRamadanYear(String(next));
                    }}
                    hitSlop={12}
                  >
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
                    const dayStr = String(day);
                    const hasLog = dayStr in ramadanLogs;
                    const fasted = ramadanLogs[dayStr] === true;
                    const hijriNow = gregorianToHijri(new Date());
                    const isCurrentRamadanYear = Number(ramadanYear) === hijriNow.year;
                    const isFutureYear = Number(ramadanYear) > hijriNow.year;
                    const isToday = isCurrentRamadanYear && hijriNow.month === 9 && hijriNow.day === day;
                    const isPastDay = isCurrentRamadanYear && (hijriNow.month > 9 || (hijriNow.month === 9 && day < hijriNow.day));
                    const isFutureDay = isFutureYear || (isCurrentRamadanYear && (hijriNow.month < 9 || (hijriNow.month === 9 && day > hijriNow.day)));
                    const isDay30 = day === 30;

                    let bgColor = Colors.creamBeige + '50';
                    let borderColor = Colors.creamBeige;
                    let textColor = Colors.textMuted;
                    let borderStyle: 'solid' | 'dashed' = 'solid';

                    if (fasted) {
                      bgColor = '#4CAF50' + '20';
                      borderColor = '#4CAF50';
                      textColor = '#2E7D32';
                    } else if (isToday && !fasted) {
                      bgColor = '#B0BEC5' + '18';
                      borderColor = '#B0BEC5';
                      textColor = '#78909C';
                    } else if (isPastDay && !ramadanLoading && !fasted) {
                      bgColor = '#F44336' + '18';
                      borderColor = '#F44336';
                      textColor = '#C62828';
                    } else if (isFutureDay || (isPastDay && ramadanLoading)) {
                      bgColor = '#B0BEC5' + '10';
                      borderColor = '#B0BEC5' + '40';
                      textColor = '#B0BEC5';
                    }

                    if (isDay30) {
                      borderStyle = 'dashed';
                    }

                    return (
                      <Pressable
                        key={day}
                        onPress={() => toggleRamadanDay(day)}
                        style={{
                          width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                          backgroundColor: bgColor,
                          borderWidth: 1.5,
                          borderColor: borderColor,
                          borderStyle: borderStyle,
                        }}
                      >
                        <Text style={{
                          fontFamily: fasted || (isPastDay && !fasted) ? 'Nunito_700Bold' : 'Nunito_600SemiBold',
                          fontSize: 13,
                          color: textColor,
                        }}>
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8 }}>
                  <View style={{ flex: 1, height: 10, backgroundColor: colors.creamBeige, borderRadius: 5, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${(ramadanFastedCount / 30) * 100}%`, backgroundColor: '#4CAF50', borderRadius: 5 }} />
                  </View>
                  <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 13, color: colors.textPrimary }}>
                    {ramadanFastedCount}/30
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#4CAF50' + '20', borderWidth: 1, borderColor: '#4CAF50' }} />
                    <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 11, color: colors.textMuted }}>{t('ramadanFasted')}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#F44336' + '18', borderWidth: 1, borderColor: '#F44336' }} />
                    <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 11, color: colors.textMuted }}>{t('ramadanMissed')}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#B0BEC5' + '10', borderWidth: 1, borderColor: '#B0BEC5' + '40' }} />
                    <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 11, color: colors.textMuted }}>{t('ramadanNotTracked')}</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(500).duration(300)}>
            {(() => {
              const araboTotal = 31;
              const araboChecked = localArabicLetters.length + (localHarakat ? 1 : 0) + (localCanRead ? 1 : 0) + (localCanWrite ? 1 : 0);
              const subjectProgress: Record<string, { done: number; total: number }> = {
                arabo: { done: araboChecked, total: araboTotal },
                akhlaq: { done: akhlaqCheckedCount, total: akhlaqTotalItems },
                aqidah: { done: aqidahCheckedCount, total: aqidahTotalItems },
                quran: { done: learnedCount, total: 114 },
              };
              const eduTotal = Object.values(subjectProgress).reduce((s, v) => s + v.total, 0);
              const eduDone = Object.values(subjectProgress).reduce((s, v) => s + v.done, 0);
              const eduPct = eduTotal > 0 ? Math.round((eduDone / eduTotal) * 100) : 0;
              return (
                <>
                  <View style={s.eduTitleRow}>
                    <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{t('subjects')}</Text>
                    <Text style={[s.eduPctText, { color: colors.textSecondary }]}>{eduPct}%</Text>
                  </View>
                  <View style={[s.eduBarContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                    {SUBJECTS.map((sub) => {
                      const sp = subjectProgress[sub.key];
                      const widthPct = eduTotal > 0 ? (sp.done / eduTotal) * 100 : 0;
                      if (widthPct <= 0) return null;
                      return (
                        <View key={sub.key} style={[s.eduBarSegment, { width: `${widthPct}%`, backgroundColor: sub.color }]} />
                      );
                    })}
                  </View>
                  <View style={s.eduLegendRow}>
                    {SUBJECTS.map((sub) => (
                      <View key={sub.key} style={s.eduLegendItem}>
                        <View style={[s.eduLegendDot, { backgroundColor: sub.color }]} />
                        <Text style={[s.eduLegendLabel, { color: colors.textMuted }]}>{t(sub.key)}</Text>
                      </View>
                    ))}
                  </View>
                </>
              );
            })()}
            <View style={[s.card, { backgroundColor: colors.cardBackground }]}>
              {SUBJECTS.map((subject, i) => {
                const isExpanded = expandedSubjects.includes(subject.key);
                return (
                  <View key={subject.key}>
                    <Pressable
                      onPress={() => toggleSubject(subject.key)}
                      style={[s.subjectRow, i > 0 && [s.taskRowBorder, { borderTopColor: colors.border }]]}
                    >
                      <Ionicons name={subject.icon as any} size={20} color={subject.color} />
                      <Text style={[s.subjectName, { color: colors.textPrimary }]}>{t(subject.key)}</Text>
                      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                    </Pressable>
                    {isExpanded && subject.key === 'arabo' && (
                      <View style={s.subjectContent}>
                        <Text style={[s.aqidahIntro, { color: colors.textSecondary, backgroundColor: isDark ? 'rgba(200,206,234,0.08)' : 'rgba(200,206,234,0.15)' }]}>
                          {lang === 'ar'
                            ? 'تعلم الحروف العربية هو الخطوة الأولى لقراءة القرآن الكريم. يتتبع هذا القسم الحروف الـ 28 والمهارات الأساسية.'
                            : lang === 'en'
                            ? 'Learning the Arabic alphabet is the first step to reading the Holy Quran. This section tracks the 28 letters and basic reading skills.'
                            : "Imparare l'alfabeto arabo e' il primo passo per leggere il Sacro Corano. Questa sezione traccia le 28 lettere e le competenze di base."}
                        </Text>
                        <Text style={[s.arabicCountLabel, { color: colors.textSecondary }]}>{t('learnedLetters')}: {localArabicLetters.length} / 28</Text>
                        <View style={s.arabicLettersGrid}>
                          {ARABIC_LETTERS.map((letter) => {
                            const isSelected = localArabicLetters.includes(letter);
                            return (
                              <Pressable
                                key={letter}
                                onPress={() => toggleArabicLetter(letter)}
                                style={[s.arabicLetterChip, { backgroundColor: colors.creamBeige }, isSelected && { backgroundColor: cardColor }]}
                              >
                                <Text style={[s.arabicLetterText, { color: colors.textPrimary }, isSelected && { color: Colors.white }]}>{letter}</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                        <View style={s.arabicToggleRow}>
                          <Text style={[s.arabicToggleLabel, { color: colors.textSecondary }]}>{t('harakat')}</Text>
                          <Pressable
                            onPress={() => toggleArabicSetting('hasHarakat')}
                            style={[s.arabicPill, { backgroundColor: colors.creamBeige, borderColor: colors.creamBeige }, localHarakat && { backgroundColor: cardColor, borderColor: cardColor }]}
                          >
                            <Text style={[s.arabicPillText, { color: colors.textSecondary }, localHarakat && { color: Colors.white }]}>
                              {localHarakat ? t('yes') : t('no')}
                            </Text>
                          </Pressable>
                        </View>
                        <View style={s.arabicToggleRow}>
                          <Text style={[s.arabicToggleLabel, { color: colors.textSecondary }]}>{t('canReadArabic')}</Text>
                          <Pressable
                            onPress={() => toggleArabicSetting('canReadArabic')}
                            style={[s.arabicPill, { backgroundColor: colors.creamBeige, borderColor: colors.creamBeige }, localCanRead && { backgroundColor: cardColor, borderColor: cardColor }]}
                          >
                            <Text style={[s.arabicPillText, { color: colors.textSecondary }, localCanRead && { color: Colors.white }]}>
                              {localCanRead ? t('yes') : t('no')}
                            </Text>
                          </Pressable>
                        </View>
                        <View style={s.arabicToggleRow}>
                          <Text style={[s.arabicToggleLabel, { color: colors.textSecondary }]}>{t('canWriteArabic')}</Text>
                          <Pressable
                            onPress={() => toggleArabicSetting('canWriteArabic')}
                            style={[s.arabicPill, { backgroundColor: colors.creamBeige, borderColor: colors.creamBeige }, localCanWrite && { backgroundColor: cardColor, borderColor: cardColor }]}
                          >
                            <Text style={[s.arabicPillText, { color: colors.textSecondary }, localCanWrite && { color: Colors.white }]}>
                              {localCanWrite ? t('yes') : t('no')}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                    {isExpanded && subject.key === 'akhlaq' && (
                      <View style={s.subjectContent}>
                        <Text style={[s.aqidahIntro, { color: colors.textSecondary, backgroundColor: isDark ? 'rgba(200,206,234,0.08)' : 'rgba(200,206,234,0.15)' }]}>
                          {lang === 'ar'
                            ? 'الأخلاق هي الآداب والسلوك الحسن. علّم أطفالك حسن الخلق والأدب مع الآخرين كما أمر الإسلام.'
                            : lang === 'en'
                            ? 'Akhlaq means good character and manners. Teach your children beautiful conduct and etiquette as Islam commands.'
                            : "Akhlaq significa buon carattere e buone maniere. Insegna ai tuoi figli la bella condotta e l'etichetta come comanda l'Islam."}
                        </Text>
                        <Text style={[s.arabicCountLabel, { color: colors.textSecondary }]}>{lang === 'it' ? 'Completati' : lang === 'ar' ? 'مكتمل' : 'Completed'}: {akhlaqCheckedCount} / {akhlaqTotalItems}</Text>
                        {AKHLAQ_CATEGORIES.map((cat) => {
                          const isCatExpanded = expandedAkhlaqCats.includes(cat.key);
                          const catChecked = cat.items.filter(i => localAkhlaqChecked.includes(i.key)).length;
                          return (
                            <View key={cat.key}>
                              <Pressable onPress={() => toggleAkhlaqCategory(cat.key)} style={[s.akhlaqCatRow, { borderBottomColor: colors.border }]}>
                                <Ionicons name={cat.icon as any} size={18} color={cardColor} />
                                <Text style={[s.akhlaqCatName, { color: colors.textPrimary }]}>{getCatLabel(cat)}</Text>
                                <Text style={[s.akhlaqCatCount, { color: colors.textMuted }]}>{catChecked}/{cat.items.length}</Text>
                                <Ionicons name={isCatExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
                              </Pressable>
                              {isCatExpanded && cat.items.map((item) => {
                                const isChecked = localAkhlaqChecked.includes(item.key);
                                const akhlaqHasNote = !!akhlaqNotesMap[item.key];
                                const isEditingAkhlaq = editingAkhlaqNote === item.key;
                                return (
                                  <View key={item.key} style={s.aqidahItemContainer}>
                                    <View style={s.aqidahLeafRow}>
                                      <Pressable onPress={() => toggleAkhlaqItem(item.key)} style={s.aqidahLeafCheckArea}>
                                        <View style={[s.akhlaqCheckBox, { borderColor: colors.textMuted }, isChecked && { backgroundColor: cardColor, borderColor: cardColor }]}>
                                          {isChecked && <Ionicons name="checkmark" size={12} color="#000000" />}
                                        </View>
                                        <Text style={[s.akhlaqItemText, { color: colors.textPrimary }, isChecked && { color: colors.textMuted, textDecorationLine: 'line-through' as const }]}>{getAkhlaqLabel(item)}</Text>
                                      </Pressable>
                                      <View style={s.aqidahLeafActions}>
                                        <Pressable
                                          onPress={() => {
                                            if (isEditingAkhlaq) {
                                              setEditingAkhlaqNote(null);
                                            } else {
                                              setEditingAkhlaqNote(item.key);
                                              setAkhlaqNoteText(akhlaqNotesMap[item.key] || '');
                                            }
                                          }}
                                          hitSlop={8}
                                        >
                                          <Ionicons
                                            name={akhlaqHasNote ? 'chatbubble' : 'chatbubble-outline'}
                                            size={15}
                                            color={akhlaqHasNote ? cardColor : colors.textMuted}
                                          />
                                        </Pressable>
                                      </View>
                                    </View>
                                    {isEditingAkhlaq && (
                                      <View style={s.aqidahNoteRow}>
                                        <TextInput
                                          style={[s.aqidahNoteInput, { color: colors.textPrimary, backgroundColor: colors.creamBeige }]}
                                          value={akhlaqNoteText}
                                          onChangeText={setAkhlaqNoteText}
                                          placeholder={lang === 'it' ? 'Nota del genitore...' : lang === 'ar' ? 'ملاحظة الوالد...' : 'Parent note...'}
                                          placeholderTextColor={colors.textMuted}
                                          multiline
                                        />
                                        <Pressable onPress={() => saveAkhlaqNote(item.key)} style={[s.aqidahNoteSaveBtn, { backgroundColor: cardColor }]}>
                                          <Ionicons name="checkmark" size={16} color="#000000" />
                                        </Pressable>
                                      </View>
                                    )}
                                    {!isEditingAkhlaq && akhlaqHasNote && (
                                      <Text style={[s.aqidahNotePreview, { color: colors.textMuted }]}>{akhlaqNotesMap[item.key]}</Text>
                                    )}
                                  </View>
                                );
                              })}
                            </View>
                          );
                        })}
                      </View>
                    )}
                    {isExpanded && subject.key === 'aqidah' && (
                      <View style={s.subjectContent}>
                        <Text style={[s.aqidahIntro, { color: colors.textSecondary, backgroundColor: isDark ? 'rgba(200,206,234,0.08)' : 'rgba(200,206,234,0.15)' }]}>
                          {lang === 'ar'
                            ? 'العقيدة هي ما نؤمن به في قلوبنا. علّمنا النبي ﷺ ثلاثة مستويات: الإسلام، الإيمان، الإحسان (من حديث جبريل).'
                            : lang === 'en'
                            ? "Aqidah is what we believe in our hearts. The Prophet \uFDFA taught us 3 levels: Islam, Iman, Ihsan (from the Hadith of Jibreel)."
                            : "L'Aqidah e' cio' in cui crediamo con il cuore. Il Profeta \uFDFA ci ha insegnato 3 livelli: Islam, Iman, Ihsan (dal Hadith di Gabriele)."}
                        </Text>
                        <Text style={[s.arabicCountLabel, { color: colors.textSecondary }]}>
                          {lang === 'it' ? 'Completati' : lang === 'ar' ? 'مكتمل' : 'Completed'}: {aqidahCheckedCount} / {aqidahTotalItems}
                        </Text>
                        {AQIDAH_LEVELS.map((level) => {
                          const isLevelExpanded = expandedAqidahSections.includes(level.key);
                          const levelTotal = level.pillars.reduce((s, p) => s + p.items.length, 0);
                          const levelChecked = level.pillars.reduce((s, p) => s + p.items.filter(i => aqidahItems[i.key]?.checked).length, 0);
                          return (
                            <View key={level.key}>
                              <Pressable onPress={() => toggleAqidahSection(level.key)} style={[s.akhlaqCatRow, { borderBottomColor: colors.border }]}>
                                <MaterialCommunityIcons name={level.icon as any} size={20} color={level.iconColor} />
                                <Text style={[s.akhlaqCatName, { color: colors.textPrimary }]}>{getLabel(level, lang)}</Text>
                                <Text style={[s.akhlaqCatCount, { color: colors.textMuted }]}>{levelChecked}/{levelTotal}</Text>
                                <Ionicons name={isLevelExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
                              </Pressable>
                              {isLevelExpanded && level.pillars.map((pillar) => {
                                const isPillarExpanded = expandedAqidahPillars.includes(pillar.key);
                                const pillarChecked = pillar.items.filter(i => aqidahItems[i.key]?.checked).length;
                                return (
                                  <View key={pillar.key} style={[s.aqidahPillarContainer, { borderLeftColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                                    <Pressable onPress={() => toggleAqidahPillar(pillar.key)} style={s.aqidahPillarRow}>
                                      {pillar.iconLib === 'ionicons' ? (
                                        <Ionicons name={pillar.icon as any} size={17} color={pillar.iconColor} />
                                      ) : (
                                        <MaterialCommunityIcons name={pillar.icon as any} size={17} color={pillar.iconColor} />
                                      )}
                                      <Text style={[s.aqidahPillarName, { color: colors.textPrimary }]}>{getLabel(pillar, lang)}</Text>
                                      <Text style={[s.aqidahPillarCount, { color: colors.textMuted }]}>{pillarChecked}/{pillar.items.length}</Text>
                                      <Ionicons name={isPillarExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
                                    </Pressable>
                                    {isPillarExpanded && pillar.items.map((item) => {
                                      const progress = aqidahItems[item.key];
                                      const isChecked = !!progress?.checked;
                                      const hasNote = !!progress?.note;
                                      const isEditingThis = editingAqidahNote === item.key;
                                      return (
                                        <View key={item.key} style={s.aqidahItemContainer}>
                                          <View style={s.aqidahLeafRow}>
                                            <Pressable onPress={() => toggleAqidahItem(item.key)} style={s.aqidahLeafCheckArea}>
                                              <View style={[s.akhlaqCheckBox, { borderColor: colors.textMuted }, isChecked && { backgroundColor: pillar.iconColor, borderColor: pillar.iconColor }]}>
                                                {isChecked && <Ionicons name="checkmark" size={12} color="#000000" />}
                                              </View>
                                              <Text style={[s.aqidahLeafText, { color: colors.textPrimary }, isChecked && { color: colors.textMuted, textDecorationLine: 'line-through' as const }]}>
                                                {getLabel(item, lang)}
                                              </Text>
                                            </Pressable>
                                            <View style={s.aqidahLeafActions}>
                                              {item.isProphet && (
                                                <Pressable onPress={() => setProphetModal(item)} hitSlop={8}>
                                                  <Ionicons name="information-circle-outline" size={18} color={pillar.iconColor} />
                                                </Pressable>
                                              )}
                                              <Pressable
                                                onPress={() => {
                                                  if (isEditingThis) {
                                                    setEditingAqidahNote(null);
                                                  } else {
                                                    setEditingAqidahNote(item.key);
                                                    setAqidahNoteText(progress?.note || '');
                                                  }
                                                }}
                                                hitSlop={8}
                                              >
                                                <Ionicons
                                                  name={hasNote ? 'chatbubble' : 'chatbubble-outline'}
                                                  size={15}
                                                  color={hasNote ? pillar.iconColor : colors.textMuted}
                                                />
                                              </Pressable>
                                            </View>
                                          </View>
                                          {isEditingThis && (
                                            <View style={s.aqidahNoteRow}>
                                              <TextInput
                                                style={[s.aqidahNoteInput, { color: colors.textPrimary, backgroundColor: colors.creamBeige }]}
                                                value={aqidahNoteText}
                                                onChangeText={setAqidahNoteText}
                                                placeholder={lang === 'it' ? 'Nota del genitore...' : lang === 'ar' ? 'ملاحظة الوالد...' : 'Parent note...'}
                                                placeholderTextColor={colors.textMuted}
                                                multiline
                                              />
                                              <Pressable onPress={() => saveAqidahNote(item.key)} style={[s.aqidahNoteSaveBtn, { backgroundColor: pillar.iconColor }]}>
                                                <Ionicons name="checkmark" size={16} color="#000000" />
                                              </Pressable>
                                            </View>
                                          )}
                                          {!isEditingThis && hasNote && (
                                            <Text style={[s.aqidahNotePreview, { color: colors.textMuted }]}>{progress?.note}</Text>
                                          )}
                                        </View>
                                      );
                                    })}
                                  </View>
                                );
                              })}
                            </View>
                          );
                        })}
                      </View>
                    )}
                    {isExpanded && subject.key === 'quran' && (
                      <View style={s.subjectContent}>
                        <Text style={[s.aqidahIntro, { color: colors.textSecondary, backgroundColor: isDark ? 'rgba(200,206,234,0.08)' : 'rgba(200,206,234,0.15)' }]}>
                          {lang === 'ar'
                            ? 'حفظ القرآن الكريم من أعظم الأعمال. تتبع تقدم طفلك في حفظ السور الـ 114.'
                            : lang === 'en'
                            ? 'Memorizing the Holy Quran is one of the greatest deeds. Track your child\'s progress through all 114 surahs.'
                            : "Memorizzare il Sacro Corano e' una delle piu' grandi opere. Segui i progressi di tuo figlio attraverso tutte le 114 surah."}
                        </Text>
                        <Pressable onPress={() => setShowQuranModal(true)} style={s.quranInlineRow}>
                          <Ionicons name="library-outline" size={20} color={cardColor} />
                          <Text style={[s.quranTapText, { color: colors.textPrimary }]}>{t('surahLearnedCount')}: {learnedCount} / 114</Text>
                          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(300)}>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{t('recentActivityLog')}</Text>
            {educationFeed.length > 0 ? (
              <View style={[s.card, { backgroundColor: colors.cardBackground }]}>
                {educationFeed.map((item, i) => (
                  <View key={`feed-${i}`} style={[s.activityRow, i > 0 && [s.taskRowBorder, { borderTopColor: colors.border }]]}>
                    <Ionicons name={item.icon as any} size={18} color={item.iconColor} />
                    <View style={s.activityInfo}>
                      <Text style={[s.activityText, { color: colors.textPrimary }]}>{item.text}</Text>
                      {item.dateTime ? (
                        <Text style={[s.activityMeta, { color: colors.textMuted }]}>{item.dateTime}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[s.emptyCard, { backgroundColor: colors.cardBackground }]}>
                <Ionicons name="time-outline" size={32} color={colors.textMuted} />
                <Text style={[s.emptyCardText, { color: colors.textMuted }]}>{t('noActivity')}</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      <Modal visible={!!prophetModal} animationType="fade" transparent onRequestClose={() => setProphetModal(null)}>
        <Pressable style={[s.prophetOverlay, { backgroundColor: colors.modalOverlay }]} onPress={() => setProphetModal(null)}>
          <Pressable style={[s.prophetCard, { backgroundColor: colors.modalBackground }]} onPress={() => {}}>
            <View style={s.prophetHeader}>
              <Ionicons name="person-circle-outline" size={40} color="#FFD3B6" />
              <Text style={[s.prophetName, { color: colors.textPrimary }]}>{prophetModal ? getLabel(prophetModal, lang) : ''}</Text>
            </View>
            {prophetModal?.prophetStory && (
              <Text style={[s.prophetStoryText, { color: colors.textSecondary }]}>
                {getLabel(prophetModal.prophetStory, lang)}
              </Text>
            )}
            <Pressable onPress={() => setProphetModal(null)} style={s.prophetCloseBtn}>
              <Text style={s.prophetCloseBtnText}>{lang === 'it' ? 'Chiudi' : lang === 'ar' ? 'إغلاق' : 'Close'}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showQuranModal} animationType="slide" transparent={false}>
        <View style={[s.quranFullPage, { paddingTop: Platform.OS === 'web' ? 67 : insets.top, backgroundColor: colors.background }]}>
          <View style={[s.quranAppBar, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
            <Pressable testID="quran-back-btn" onPress={() => setShowQuranModal(false)} style={s.quranBackBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={[s.quranAppBarTitle, { color: colors.textPrimary }]}>{t('quranMemorization')}</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={[s.quranLearnedSummary, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
            <Text style={[s.quranLearnedText, { color: colors.textSecondary }]}>{t('surahLearnedCount')}: {learnedCount} / 114</Text>
            <View style={[s.quranLearnedBar, { backgroundColor: colors.creamBeige }]}>
              <View style={[s.quranLearnedBarFill, { width: `${(learnedCount / 114) * 100}%`, backgroundColor: '#4CAF50' }]} />
            </View>
          </View>
          <View style={s.quranFilterRow}>
            {(['all', 'learned', 'in_progress', 'not_started'] as const).map((f) => {
              const isActive = quranFilter === f;
              const filterBg = f === 'learned' ? '#4CAF50' : f === 'in_progress' ? '#FBC02D' : f === 'not_started' ? '#B0BEC5' : cardColor;
              return (
                <Pressable
                  key={f}
                  onPress={() => setQuranFilter(f)}
                  style={[s.quranFilterBtn, { backgroundColor: colors.creamBeige, borderColor: colors.creamBeige }, isActive && { backgroundColor: filterBg + '20', borderColor: filterBg }]}
                >
                  <Text style={[s.quranFilterText, { color: colors.textSecondary }, isActive && { color: colors.textPrimary, fontFamily: 'Nunito_700Bold' }]}>
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
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            renderItem={({ item }) => {
              const statusColor = item.status === 'learned' ? '#4CAF50' : item.status === 'in_progress' ? '#FBC02D' : '#B0BEC5';
              const statusIcon = item.status === 'learned' ? 'checkmark-circle' : item.status === 'in_progress' ? 'time' : 'ellipse-outline';
              const badgeBg = item.status === 'learned' ? '#4CAF50' : item.status === 'in_progress' ? '#FBC02D' : '#B0BEC5';
              return (
                <Pressable onPress={() => cycleSurahStatus(item.number)} style={[s.surahRow, { backgroundColor: colors.cardBackground }]}>
                  <View style={[s.surahNumBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[s.surahNum, badgeBg !== '#B0BEC5' && { color: '#333333' }]}>{item.number}</Text>
                  </View>
                  <View style={s.surahNameCol}>
                    <Text style={[s.surahArabicName, { color: colors.textPrimary }]}>{item.arabicName}</Text>
                    <Text style={[s.surahLatinName, { color: colors.textMuted }]}>{item.number} - {item.name}</Text>
                  </View>
                  <Ionicons name={statusIcon as any} size={24} color={statusColor} />
                </Pressable>
              );
            }}
            ItemSeparatorComponent={() => <View style={[s.taskRowBorder, { borderTopColor: colors.border }]} />}
          />
        </View>
      </Modal>

      <Modal visible={showAddTask} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={[s.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
            <Pressable style={s.modalDismiss} onPress={() => setShowAddTask(false)} />
            <ScrollView style={[s.modalScroll, { backgroundColor: colors.modalBackground }]} contentContainerStyle={[s.modalContent, { paddingBottom: insets.bottom + 16 }]}>
              <View style={s.modalHandle} />
              <Text style={[s.modalTitle, { color: colors.textPrimary }]}>{t('addEvent')}</Text>

              <Text style={[s.inputLabel, { color: colors.textSecondary }]}>{t('eventName')}</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                placeholder={t('eventNamePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={newTaskName}
                onChangeText={setNewTaskName}
              />

              <Text style={[s.inputLabel, { color: colors.textSecondary }]}>{t('frequency')}</Text>
              <View style={s.freqRow}>
                {(['daily', 'weekly', 'monthly', 'once'] as const).map((freq) => (
                  <Pressable
                    key={freq}
                    onPress={() => {
                      setNewTaskFreq(freq);
                      setNewTaskDays([]);
                      setNewTaskDayOfMonth('');
                    }}
                    style={[s.freqBtn, { borderColor: colors.border }, newTaskFreq === freq && { backgroundColor: cardColor, borderColor: cardColor }]}
                  >
                    <Text style={[s.freqBtnText, { color: colors.textSecondary }, newTaskFreq === freq && { color: '#000000', fontFamily: 'Nunito_700Bold' }]}>{t(freq)}</Text>
                  </Pressable>
                ))}
              </View>

              {newTaskFreq === 'weekly' && (
                <>
                  <Text style={[s.inputLabel, { color: colors.textSecondary }]}>{t('selectDay')}</Text>
                  <View style={s.dayPickerRow}>
                    {DAY_KEYS.map((dayKey, i) => {
                      const isActive = newTaskDays.includes(i);
                      return (
                        <Pressable
                          key={dayKey}
                          onPress={() => toggleDayOfWeek(i)}
                          style={[s.dayChip, { borderColor: colors.border }, isActive && { backgroundColor: cardColor, borderColor: cardColor }]}
                        >
                          <Text style={[s.dayChipText, { color: colors.textSecondary }, isActive && { color: '#000000', fontFamily: 'Nunito_700Bold' }]}>{t(dayKey)}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              {newTaskFreq === 'monthly' && (
                <>
                  <Text style={[s.inputLabel, { color: colors.textSecondary }]}>{t('selectDayOfMonth')}</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                    placeholder="1-31"
                    placeholderTextColor={colors.textMuted}
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
                  <Text style={[s.inputLabel, { color: colors.textSecondary }]}>{t('startTime')}</Text>
                  <View style={[s.timeDropdown, { borderColor: cardColor, backgroundColor: colors.inputBackground }]}>  
                    <ScrollView style={s.timeDropdownScroll} nestedScrollEnabled showsVerticalScrollIndicator>
                      {TIME_SLOTS.map((slot) => (
                        <Pressable
                          key={slot}
                          onPress={() => setNewTaskTime(slot)}
                          style={[s.timeSlotItem, newTaskTime === slot && { backgroundColor: cardColor }]}
                        >
                          <Text style={[s.timeSlotText, { color: colors.textSecondary }, newTaskTime === slot && { color: '#000000', fontFamily: 'Nunito_700Bold' }]}>{slot}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </View>
                <View style={s.timeCol}>
                  <Text style={[s.inputLabel, { color: colors.textSecondary }]}>{t('endTimePicker')}</Text>
                  <View style={[s.timeDropdown, { borderColor: cardColor, backgroundColor: colors.inputBackground }]}>
                    <ScrollView style={s.timeDropdownScroll} nestedScrollEnabled showsVerticalScrollIndicator>
                      {TIME_SLOTS.map((slot) => (
                        <Pressable
                          key={slot}
                          onPress={() => setNewTaskEndTime(slot)}
                          style={[s.timeSlotItem, newTaskEndTime === slot && { backgroundColor: cardColor }]}
                        >
                          <Text style={[s.timeSlotText, { color: colors.textSecondary }, newTaskEndTime === slot && { color: '#000000', fontFamily: 'Nunito_700Bold' }]}>{slot}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>

              <Pressable
                onPress={handleAddTask}
                style={[s.saveBtn, { backgroundColor: cardColor }]}
              >
                <Ionicons name="checkmark" size={20} color="#000000" />
                <Text style={[s.saveBtnText, { color: '#000000' }]}>{t('save')}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!longPressTask} animationType="fade" transparent>
        <Pressable style={[s.popupOverlay, { backgroundColor: colors.modalOverlay }]} onPress={() => setLongPressTask(null)}>
          <Animated.View entering={FadeIn.duration(200)} style={[s.popupCard, { backgroundColor: colors.modalBackground }]}>
            <Text style={[s.popupTitle, { color: colors.textPrimary }]}>{longPressTask?.name}</Text>
            <Pressable
              onPress={() => longPressTask && openEditTask(longPressTask)}
              style={({ pressed }) => [s.popupBtn, { borderBottomColor: colors.border }, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="create-outline" size={20} color={colors.textPrimary} />
              <Text style={[s.popupBtnText, { color: colors.textPrimary }]}>{t('editEvent')}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (longPressTask) {
                  setLongPressTask(null);
                  handleDeleteTask(longPressTask.id, longPressTask.name, longPressTask.frequency);
                }
              }}
              style={({ pressed }) => [s.popupBtn, s.popupBtnDanger, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
              <Text style={[s.popupBtnText, { color: colors.danger }]}>{t('delete')}</Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      <Modal visible={showEditTask} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={[s.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
            <Pressable style={s.modalDismiss} onPress={() => setShowEditTask(false)} />
            <ScrollView style={[s.modalScroll, { backgroundColor: colors.modalBackground }]} contentContainerStyle={[s.modalContent, { paddingBottom: insets.bottom + 16 }]}>
              <View style={s.modalHandle} />
              <Text style={[s.modalTitle, { color: colors.textPrimary }]}>{t('editEvent')}</Text>

              <Text style={[s.inputLabel, { color: colors.textSecondary }]}>{t('eventName')}</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                placeholder={t('eventNamePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={editTaskName}
                onChangeText={setEditTaskName}
              />

              <Text style={[s.inputLabel, { color: colors.textSecondary }]}>{t('frequency')}</Text>
              <View style={s.freqRow}>
                {(['daily', 'weekly', 'monthly', 'once'] as const).map((freq) => (
                  <Pressable
                    key={freq}
                    onPress={() => {
                      setEditTaskFreq(freq);
                      setEditTaskDays([]);
                      setEditTaskDayOfMonth('');
                    }}
                    style={[s.freqBtn, { borderColor: colors.border }, editTaskFreq === freq && { backgroundColor: cardColor, borderColor: cardColor }]}
                  >
                    <Text style={[s.freqBtnText, { color: colors.textSecondary }, editTaskFreq === freq && { color: '#000000', fontFamily: 'Nunito_700Bold' }]}>{t(freq)}</Text>
                  </Pressable>
                ))}
              </View>

              {editTaskFreq === 'weekly' && (
                <>
                  <Text style={[s.inputLabel, { color: colors.textSecondary }]}>{t('selectDay')}</Text>
                  <View style={s.dayPickerRow}>
                    {DAY_KEYS.map((dayKey, i) => {
                      const isActive = editTaskDays.includes(i);
                      return (
                        <Pressable
                          key={dayKey}
                          onPress={() => toggleEditDayOfWeek(i)}
                          style={[s.dayChip, { borderColor: colors.border }, isActive && { backgroundColor: cardColor, borderColor: cardColor }]}
                        >
                          <Text style={[s.dayChipText, { color: colors.textSecondary }, isActive && { color: '#000000', fontFamily: 'Nunito_700Bold' }]}>{t(dayKey)}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              {editTaskFreq === 'monthly' && (
                <>
                  <Text style={[s.inputLabel, { color: colors.textSecondary }]}>{t('selectDayOfMonth')}</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                    placeholder="1-31"
                    placeholderTextColor={colors.textMuted}
                    value={editTaskDayOfMonth}
                    onChangeText={(v) => {
                      const num = parseInt(v);
                      if (v === '' || (num >= 1 && num <= 31)) setEditTaskDayOfMonth(v);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </>
              )}

              <View style={s.timeRow}>
                <View style={s.timeCol}>
                  <Text style={[s.inputLabel, { color: colors.textSecondary }]}>{t('startTime')}</Text>
                  <View style={[s.timeDropdown, { borderColor: cardColor, backgroundColor: colors.inputBackground }]}>
                    <ScrollView style={s.timeDropdownScroll} nestedScrollEnabled showsVerticalScrollIndicator>
                      {TIME_SLOTS.map((slot) => (
                        <Pressable
                          key={slot}
                          onPress={() => setEditTaskTime(slot)}
                          style={[s.timeSlotItem, editTaskTime === slot && { backgroundColor: cardColor }]}
                        >
                          <Text style={[s.timeSlotText, { color: colors.textSecondary }, editTaskTime === slot && { color: '#000000', fontFamily: 'Nunito_700Bold' }]}>{slot}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </View>
                <View style={s.timeCol}>
                  <Text style={[s.inputLabel, { color: colors.textSecondary }]}>{t('endTimePicker')}</Text>
                  <View style={[s.timeDropdown, { borderColor: cardColor, backgroundColor: colors.inputBackground }]}>
                    <ScrollView style={s.timeDropdownScroll} nestedScrollEnabled showsVerticalScrollIndicator>
                      {TIME_SLOTS.map((slot) => (
                        <Pressable
                          key={slot}
                          onPress={() => setEditTaskEndTime(slot)}
                          style={[s.timeSlotItem, editTaskEndTime === slot && { backgroundColor: cardColor }]}
                        >
                          <Text style={[s.timeSlotText, { color: colors.textSecondary }, editTaskEndTime === slot && { color: '#000000', fontFamily: 'Nunito_700Bold' }]}>{slot}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>

              <Pressable
                onPress={handleEditTask}
                style={[s.saveBtn, { backgroundColor: cardColor }]}
              >
                <Ionicons name="checkmark" size={20} color="#000000" />
                <Text style={[s.saveBtnText, { color: '#000000' }]}>{t('save')}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showEventPremiumOverlay} animationType="fade" transparent>
        <View style={{ flex: 1 }}>
          <PremiumOverlay
            message={t('premiumBlockEvents')}
            icon="calendar"
            onDiscover={() => {
              setShowEventPremiumOverlay(false);
              premiumRouter.push('/(tabs)/settings');
            }}
          />
          <Pressable
            onPress={() => setShowEventPremiumOverlay(false)}
            style={{ position: 'absolute', top: 60, right: 20, zIndex: 200 }}
          >
            <Ionicons name="close-circle" size={32} color={colors.textMuted} />
          </Pressable>
        </View>
      </Modal>

      <Modal visible={showQuranPremiumOverlay} animationType="fade" transparent>
        <View style={{ flex: 1 }}>
          <PremiumOverlay
            message={t('premiumBlockQuran')}
            icon="book"
            onDiscover={() => {
              setShowQuranPremiumOverlay(false);
              premiumRouter.push('/(tabs)/settings');
            }}
          />
          <Pressable
            onPress={() => setShowQuranPremiumOverlay(false)}
            style={{ position: 'absolute', top: 60, right: 20, zIndex: 200 }}
          >
            <Ionicons name="close-circle" size={32} color={colors.textMuted} />
          </Pressable>
        </View>
      </Modal>

      {deletedTaskSnackbar?.visible && (
        <Animated.View
          entering={FadeIn.duration(250)}
          style={[s.deleteSnackbar, { bottom: Platform.OS === 'web' ? 34 + 16 : insets.bottom + 72 }]}
        >
          <Ionicons name="trash" size={18} color={Colors.white} />
          <Text style={s.deleteSnackbarText}>{t('eventDeleted')}</Text>
        </Animated.View>
      )}
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
    overflow: 'hidden',
  },
  selectorImg: { width: 48, height: 48, borderRadius: 24 },
  selectorInitial: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.textPrimary },
  selectorName: { fontFamily: 'Nunito_500Medium', fontSize: 11, color: Colors.textMuted, maxWidth: 56, textAlign: 'center' },

  headerCard: { marginHorizontal: 16, borderRadius: 24, overflow: 'hidden', marginBottom: 4 },
  headerGradient: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerPhoto: { width: 72, height: 72, borderRadius: 36 },
  childNavArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  childCounter: {
    fontFamily: 'Nunito_500Medium', fontSize: 11, color: 'rgba(0,0,0,0.45)', marginTop: 2,
  },
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
  dateBarTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateBarTitle: { fontFamily: 'Nunito_700Bold', fontSize: 19, color: '#A8E6CF' },
  calSwitch: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center', paddingHorizontal: 3 },
  calSwitchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  calSwitchLabel: { fontFamily: 'Nunito_500Medium', fontSize: 11, color: Colors.textMuted },
  todayBtn: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  todayBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: '#000000' },
  dateItem: {
    width: 72, height: 82, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 4, backgroundColor: Colors.cardBackground, paddingVertical: 5,
  },
  dateItemActive: {},
  dateItemToday: {},
  dateDayName: { fontFamily: 'Nunito_500Medium', fontSize: 10, color: Colors.textMuted, textTransform: 'lowercase' as const },
  dateDayNameActive: { color: '#000000', fontFamily: 'Nunito_700Bold' },
  dateNum: { fontFamily: 'Nunito_700Bold', fontSize: 24, color: Colors.textPrimary, lineHeight: 28 },
  dateNumActive: { color: '#000000' },
  dateMonthSub: { fontFamily: 'Nunito_400Regular', fontSize: 8, color: Colors.textMuted, marginTop: 1, textAlign: 'center' },
  dateMonthSubActive: { color: 'rgba(0,0,0,0.7)' },

  sectionsWrap: { paddingHorizontal: 16, gap: 8 },
  sectionTitle: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: Colors.textPrimary, marginTop: 12, marginBottom: 8, flex: 1 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eduTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 },
  eduPctText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.textSecondary },
  eduBarContainer: {
    flexDirection: 'row', height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden', marginBottom: 6,
  },
  eduBarSegment: { height: '100%' },
  eduLegendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  eduLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eduLegendDot: { width: 8, height: 8, borderRadius: 4 },
  eduLegendLabel: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textMuted },
  card: {
    backgroundColor: Colors.cardBackground, borderRadius: 20, padding: 16,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  dailyCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 24, padding: 20,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  dailySubsection: { paddingVertical: 4 },
  dailySubHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  dailySubTitle: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
  dailyDivider: { height: 1, backgroundColor: Colors.creamBeige, marginVertical: 14 },
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

  fastingQuranRow: { flexDirection: 'row', gap: 12 },
  fastingCol: { flex: 1 },
  fastingColLabel: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: Colors.textMuted, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  quranTodayCol: { alignItems: 'center' as const, justifyContent: 'center' as const },
  quranTodayToggle: { alignItems: 'center' as const, gap: 6 },
  quranTodayCircle: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: Colors.textMuted,
    alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: Colors.creamBeige,
  },
  quranTodayStatus: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.textMuted },

  fastingRow: { flexDirection: 'row', gap: 10 },
  fastingBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 14, borderWidth: 2, borderColor: Colors.creamBeige,
    backgroundColor: Colors.creamBeige,
  },
  fastingBtnPartial: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 14, borderWidth: 2, borderColor: Colors.creamBeige,
    backgroundColor: Colors.creamBeige, marginTop: 8, minWidth: 130,
  },
  fastingBtnText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.textSecondary },

  quranTapRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quranTapText: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: Colors.textPrimary, flex: 1 },
  quranInlineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  quranFullPage: {
    flex: 1, backgroundColor: Colors.background,
  },
  quranAppBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.creamBeige,
    backgroundColor: Colors.cardBackground,
  },
  quranBackBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, zIndex: 10 },
  quranAppBarTitle: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.textPrimary, position: 'absolute', left: 0, right: 0, textAlign: 'center' },
  quranLearnedSummary: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: Colors.cardBackground, borderBottomWidth: 1, borderBottomColor: Colors.creamBeige },
  quranLearnedText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  quranLearnedBar: { height: 6, borderRadius: 3, backgroundColor: Colors.creamBeige },
  quranLearnedBarFill: { height: 6, borderRadius: 3 },
  quranFilterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 12, flexWrap: 'wrap' },
  quranFilterBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.creamBeige, backgroundColor: Colors.creamBeige,
  },
  quranFilterText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.textSecondary },
  quranList: { flex: 1, paddingHorizontal: 20 },
  surahRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  surahNumBadge: {
    width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.mintGreen,
  },
  surahNum: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.white },
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

  akhlaqCatRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.creamBeige,
  },
  akhlaqCatName: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.textPrimary, flex: 1 },
  akhlaqCatCount: { fontFamily: 'Nunito_500Medium', fontSize: 12, color: Colors.textMuted, marginRight: 4 },
  akhlaqItemRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingLeft: 28, gap: 10,
  },
  akhlaqCheckBox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: Colors.textMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  akhlaqItemText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textPrimary, flex: 1 },

  aqidahIntro: {
    fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary,
    lineHeight: 20, marginBottom: 12, fontStyle: 'italic' as const,
    backgroundColor: 'rgba(200,206,234,0.15)', borderRadius: 12, padding: 12,
  },
  aqidahPillarContainer: { marginLeft: 12, borderLeftWidth: 2, borderLeftColor: 'rgba(0,0,0,0.05)' },
  aqidahPillarRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12,
  },
  aqidahPillarName: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.textPrimary, flex: 1 },
  aqidahPillarCount: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textMuted, marginRight: 4 },
  aqidahItemContainer: { marginBottom: 2 },
  aqidahLeafRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, paddingLeft: 20,
  },
  aqidahLeafCheckArea: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  aqidahLeafText: { fontFamily: 'Nunito_400Regular', fontSize: 12.5, color: Colors.textPrimary, flex: 1 },
  aqidahLeafActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aqidahNoteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingLeft: 56, paddingRight: 4, paddingBottom: 8,
  },
  aqidahNoteInput: {
    flex: 1, fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textPrimary,
    backgroundColor: Colors.creamBeige, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    minHeight: 36,
  },
  aqidahNoteSaveBtn: {
    width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  aqidahNotePreview: {
    fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted,
    paddingLeft: 56, paddingRight: 12, paddingBottom: 6, fontStyle: 'italic' as const,
  },
  prophetOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  prophetCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 24, padding: 24, width: '100%', maxWidth: 360,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12,
    elevation: 8,
  },
  prophetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  prophetName: { fontFamily: 'Nunito_700Bold', fontSize: 20, color: Colors.textPrimary, flex: 1 },
  prophetStoryText: {
    fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.textSecondary,
    lineHeight: 24, marginBottom: 20,
  },
  prophetCloseBtn: {
    alignSelf: 'center', backgroundColor: '#FFD3B6', borderRadius: 16, paddingHorizontal: 32, paddingVertical: 12,
  },
  prophetCloseBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.white },

  activityRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: 12 },
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
  timeRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  timeCol: { flex: 1 },
  timeDropdown: {
    borderWidth: 2, borderRadius: 14, backgroundColor: Colors.creamBeige,
    overflow: 'hidden', marginBottom: 8,
  },
  timeDropdownScroll: { maxHeight: 160 },
  timeSlotItem: {
    paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center',
  },
  timeSlotText: {
    fontFamily: 'Nunito_500Medium', fontSize: 15, color: Colors.textPrimary,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 20, marginTop: 8,
  },
  saveBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.white },
  taskFreqLabel: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  popupOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  popupCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 24,
    padding: 20, width: 260, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  popupTitle: {
    fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.textPrimary,
    textAlign: 'center', marginBottom: 12,
  },
  popupBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16,
    backgroundColor: Colors.creamBeige,
  },
  popupBtnDanger: { backgroundColor: '#FFE5E5', marginTop: 4 },
  popupBtnText: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: Colors.textPrimary },
  deleteSnackbar: {
    position: 'absolute', left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.textPrimary, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 8,
  },
  deleteSnackbarText: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: Colors.white },
});
