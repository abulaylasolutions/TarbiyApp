import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform, Pressable,
  TextInput, Modal, Alert, KeyboardAvoidingView, FlatList,
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

interface AqidahSubItem { key: string; it: string; en: string; ar: string; }
interface AqidahSection { key: string; it: string; en: string; ar: string; icon: string; iconColor: string; items: AqidahSubItem[]; }

const AQIDAH_SECTIONS: AqidahSection[] = [
  {
    key: 'islam', it: 'Islam - I 5 Pilastri', en: 'Islam - The 5 Pillars', ar: 'الإسلام - الأركان الخمسة',
    icon: 'hands-pray' as any, iconColor: '#A8E6CF',
    items: [
      { key: 'islam_shahada', it: 'Shahada: Testimoniare che non c\'e\' dio all\'infuori di Allah e Muhammad e\' il Suo messaggero', en: 'Shahada: Testify there is no god but Allah and Muhammad is His messenger', ar: 'الشهادة: أشهد أن لا إله إلا الله وأن محمداً رسول الله' },
      { key: 'islam_salah', it: 'Salah: Pregare le 5 preghiere', en: 'Salah: Pray the 5 daily prayers', ar: 'الصلاة: أداء الصلوات الخمس' },
      { key: 'islam_zakat', it: 'Zakat: Pagare la Zakat', en: 'Zakat: Pay the Zakat', ar: 'الزكاة: إيتاء الزكاة' },
      { key: 'islam_sawm', it: 'Sawm Ramadan: Digiunare Ramadan', en: 'Sawm Ramadan: Fast during Ramadan', ar: 'صوم رمضان: صيام شهر رمضان' },
      { key: 'islam_hajj', it: 'Hajj: Pellegrinaggio per chi puo\'', en: 'Hajj: Pilgrimage for those who can', ar: 'الحج: حج البيت لمن استطاع إليه سبيلاً' },
    ],
  },
  {
    key: 'iman', it: 'Iman - I 6 Pilastri', en: 'Iman - The 6 Pillars', ar: 'الإيمان - الأركان الستة',
    icon: 'book-open-variant' as any, iconColor: '#C7CEEA',
    items: [
      { key: 'iman_allah', it: 'Credere in Allah', en: 'Belief in Allah', ar: 'الإيمان بالله' },
      { key: 'iman_angels', it: 'Credere negli Angeli', en: 'Belief in Angels', ar: 'الإيمان بالملائكة' },
      { key: 'iman_books', it: 'Credere nei Libri rivelati', en: 'Belief in the Revealed Books', ar: 'الإيمان بالكتب' },
      { key: 'iman_messengers', it: 'Credere nei Messaggeri', en: 'Belief in the Messengers', ar: 'الإيمان بالرسل' },
      { key: 'iman_lastday', it: 'Credere nell\'Ultimo Giorno', en: 'Belief in the Last Day', ar: 'الإيمان باليوم الآخر' },
      { key: 'iman_qadar', it: 'Credere nel Qadar (destino, bene e male)', en: 'Belief in Qadar (destiny, good and bad)', ar: 'الإيمان بالقدر خيره وشره' },
    ],
  },
  {
    key: 'ihsan', it: 'Ihsan - Il livello di eccellenza', en: 'Ihsan - The Level of Excellence', ar: 'الإحسان - مستوى التميز',
    icon: 'heart-outline' as any, iconColor: '#FFD3B6',
    items: [
      { key: 'ihsan_worship', it: 'Adorare Allah come se Lo vedessimo', en: 'Worship Allah as if you see Him', ar: 'أن تعبد الله كأنك تراه' },
      { key: 'ihsan_sees', it: 'Egli ci vede sempre', en: 'He always sees us', ar: 'فإن لم تكن تراه فإنه يراك' },
      { key: 'ihsan_intention', it: 'Azione con intenzione pura', en: 'Acting with pure intention', ar: 'العمل بإخلاص النية' },
    ],
  },
];

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

function ChildSelector({ children: childList, selectedChildId, selectChild, getChildPhoto }: {
  children: any[];
  selectedChildId: string | null;
  selectChild: (id: string) => void;
  getChildPhoto: (childId: string) => string | null;
}) {
  if (childList.length <= 1) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.selectorRow}>
      {childList.map((child, index) => {
        const isSelected = child.id === selectedChildId;
        const color = child.cardColor || PASTEL_COLORS[index % PASTEL_COLORS.length];
        const photoUrl = getChildPhoto(child.id);
        return (
          <Pressable key={child.id} onPress={() => selectChild(child.id)} style={s.selectorItem}>
            <View style={[s.selectorCircle, isSelected && { borderColor: color, borderWidth: 3 }]}>
              {photoUrl ? (
                <Image
                  key={photoUrl}
                  source={{ uri: photoUrl }}
                  style={s.selectorImg}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={300}
                />
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
  const { children, selectedChildId, selectChild, cogenitori, refreshChildren, getChildPhoto } = useApp();
  const { user } = useAuth();
  const { t, lang, isRTL } = useI18n();
  const queryClient = useQueryClient();

  const selectedChild = children.find(c => c.id === selectedChildId);
  const selectedIndex = children.findIndex(c => c.id === selectedChildId);
  const cardColor = selectedChild?.cardColor || PASTEL_COLORS[Math.max(0, selectedIndex) % PASTEL_COLORS.length];

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
  const [editingAqidahNote, setEditingAqidahNote] = useState<string | null>(null);
  const [aqidahNoteText, setAqidahNoteText] = useState('');

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
      fetches.push(fetch(new URL(`/api/children/${childId}/aqidah`, base).toString(), { credentials: 'include' }));

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
    } catch {}
  };

  const toggleAqidahSection = (sectionKey: string) => {
    setExpandedAqidahSections(prev =>
      prev.includes(sectionKey) ? prev.filter(k => k !== sectionKey) : [...prev, sectionKey]
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

  const getAqidahItemLabel = (item: AqidahSubItem) => {
    if (lang === 'ar') return item.ar;
    if (lang === 'en') return item.en;
    return item.it;
  };

  const getAqidahSectionLabel = (section: AqidahSection) => {
    if (lang === 'ar') return section.ar;
    if (lang === 'en') return section.en;
    return section.it;
  };

  const aqidahCheckedCount = AQIDAH_SECTIONS.reduce((sum, sec) => sum + sec.items.filter(i => aqidahItems[i.key]?.checked).length, 0);
  const aqidahTotalItems = AQIDAH_SECTIONS.reduce((sum, sec) => sum + sec.items.length, 0);

  const toggleAkhlaqCategory = (catKey: string) => {
    setExpandedAkhlaqCats(prev =>
      prev.includes(catKey) ? prev.filter(k => k !== catKey) : [...prev, catKey]
    );
  };

  const cycleSurahStatus = async (surahNumber: number) => {
    if (!childId) return;
    const key = String(surahNumber);
    const current = quranLogs[key] || 'not_started';
    const next: SurahStatus = current === 'not_started' ? 'in_progress' : current === 'in_progress' ? 'learned' : 'not_started';
    setQuranLogs(prev => ({ ...prev, [key]: next }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await apiRequest('POST', `/api/children/${childId}/quran`, { surahNumber: key, status: next });
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

  const buildTodayActivityFeed = (): { icon: string; iconColor: string; text: string; time: string; }[] => {
    const feed: { icon: string; iconColor: string; text: string; time: string; sortTime: number }[] = [];

    PRAYER_NAMES.forEach(p => {
      if (prayers[p]) {
        const prayerKey = `prayed${p.charAt(0).toUpperCase() + p.slice(1)}` as string;
        feed.push({ icon: 'checkmark-circle', iconColor: Colors.mintGreen, text: t(prayerKey), time: '', sortTime: Date.now() });
      }
    });

    if (fasting.status === 'yes') {
      feed.push({ icon: 'checkmark-circle', iconColor: Colors.mintGreen, text: lang === 'it' ? 'Digiuno completo' : lang === 'ar' ? 'صيام كامل' : 'Full fasting', time: '', sortTime: Date.now() });
    } else if (fasting.status === 'partial') {
      feed.push({ icon: 'remove-circle', iconColor: '#F4C430', text: lang === 'it' ? 'Digiuno parziale' : lang === 'ar' ? 'صيام جزئي' : 'Partial fasting', time: '', sortTime: Date.now() });
    }

    if (quranToday) {
      feed.push({ icon: 'book', iconColor: Colors.peachPink, text: lang === 'it' ? "Qur'an letto oggi" : lang === 'ar' ? 'قرأ القرآن اليوم' : "Qur'an read today", time: '', sortTime: Date.now() });
    }

    Object.entries(quranLogs).forEach(([num, status]) => {
      if (status === 'learned') {
        const idx = parseInt(num) - 1;
        const name = SURAH_NAMES[idx] || num;
        feed.push({ icon: 'star', iconColor: '#F4C430', text: `${lang === 'it' ? 'Surah' : lang === 'ar' ? 'سورة' : 'Surah'} ${num} - ${name} ${lang === 'it' ? 'imparata' : lang === 'ar' ? 'محفوظة' : 'learned'}`, time: '', sortTime: Date.now() });
      }
    });

    localAkhlaqChecked.forEach(itemKey => {
      const allItems = AKHLAQ_CATEGORIES.flatMap(c => c.items);
      const item = allItems.find(i => i.key === itemKey);
      if (item) {
        feed.push({ icon: 'heart', iconColor: Colors.peachPink, text: `${lang === 'it' ? 'Akhlaq' : lang === 'ar' ? 'أخلاق' : 'Akhlaq'}: ${getAkhlaqLabel(item)}`, time: '', sortTime: Date.now() });
      }
    });

    AQIDAH_SECTIONS.forEach(section => {
      section.items.forEach(item => {
        if (aqidahItems[item.key]?.checked) {
          feed.push({ icon: 'star', iconColor: section.iconColor, text: `${lang === 'it' ? 'Aqidah' : lang === 'ar' ? 'عقيدة' : 'Aqidah'}: ${getAqidahItemLabel(item)}`, time: '', sortTime: Date.now() });
        }
      });
    });

    todayTasks.forEach(task => {
      const comp = completions[task.id];
      if (comp?.completed) {
        feed.push({ icon: 'checkmark-circle', iconColor: Colors.mintGreen, text: `${task.name} ${lang === 'it' ? 'completato' : lang === 'ar' ? 'مكتمل' : 'completed'}`, time: task.time || '', sortTime: Date.now() });
      }
    });

    activities.filter(a => a.date === dateStr).forEach(act => {
      feed.push({ icon: 'time', iconColor: cardColor, text: act.text, time: act.createdAt ? new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '', sortTime: new Date(act.createdAt || 0).getTime() });
    });

    feed.sort((a, b) => b.sortTime - a.sortTime);
    return feed.slice(0, 5).map(({ sortTime, ...rest }) => rest);
  };

  const todayFeed = buildTodayActivityFeed();

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
          <ChildSelector children={children} selectedChildId={selectedChildId} selectChild={selectChild} getChildPhoto={getChildPhoto} />
        </View>

        <Animated.View entering={FadeIn.duration(300)} style={s.headerCard}>
          <LinearGradient
            colors={[cardColor, cardColor + '60']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.headerGradient}
          >
            <View style={s.headerRow}>
              {getChildPhoto(selectedChild.id) ? (
                <Image
                  key={getChildPhoto(selectedChild.id)}
                  source={{ uri: getChildPhoto(selectedChild.id)! }}
                  style={[s.headerPhoto, { borderColor: cardColor }]}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={300}
                />
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

          {(salahEnabled || fastingEnabled || trackQuranToday) && (
            <Animated.View entering={FadeInDown.delay(300).duration(300)}>
              <Text style={s.sectionTitle}>{t('todayActivities')}</Text>
              <View style={s.dailyCard}>
                {salahEnabled && (
                  <View style={s.dailySubsection}>
                    <View style={s.dailySubHeader}>
                      <MaterialCommunityIcons name="mosque" size={18} color={Colors.mintGreenDark} />
                      <Text style={s.dailySubTitle}>{t('salahSection')}</Text>
                    </View>
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
                )}

                {(fastingEnabled || trackQuranToday) && salahEnabled && (
                  <View style={s.dailyDivider} />
                )}

                {(fastingEnabled || trackQuranToday) && (
                  <View style={s.dailySubsection}>
                    <View style={s.fastingQuranRow}>
                      {fastingEnabled && (
                        <View style={[s.fastingCol, trackQuranToday && { flex: 3 }]}>
                          <View style={s.dailySubHeader}>
                            <Ionicons name="moon-outline" size={16} color="#D4A03C" />
                            <Text style={s.dailySubTitle}>{t('fastingSection')}</Text>
                          </View>
                          <View style={s.fastingRow}>
                            {(['yes', 'no'] as const).map((status) => {
                              const isActive = fasting.status === status;
                              const color = status === 'yes' ? Colors.mintGreen : '#E57373';
                              return (
                                <Pressable
                                  key={status}
                                  onPress={() => updateFasting(status)}
                                  style={[s.fastingBtn, isActive && { backgroundColor: color + '20', borderColor: color }]}
                                >
                                  <Ionicons
                                    name={status === 'yes' ? 'checkmark-circle' : 'close-circle'}
                                    size={18}
                                    color={isActive ? color : Colors.textMuted}
                                  />
                                  <Text style={[s.fastingBtnText, isActive && { color }]}>{t(status)}</Text>
                                </Pressable>
                              );
                            })}
                          </View>
                          <Pressable
                            onPress={() => updateFasting('partial')}
                            style={[s.fastingBtnPartial, fasting.status === 'partial' && { backgroundColor: '#F4C430' + '20', borderColor: '#F4C430' }]}
                          >
                            <Ionicons
                              name="remove-circle"
                              size={18}
                              color={fasting.status === 'partial' ? '#F4C430' : Colors.textMuted}
                            />
                            <Text style={[s.fastingBtnText, fasting.status === 'partial' && { color: '#F4C430' }]}>{t('partial')}</Text>
                          </Pressable>
                        </View>
                      )}
                      {trackQuranToday && (
                        <View style={[s.quranTodayCol, fastingEnabled && { flex: 1, borderLeftWidth: 1, borderLeftColor: Colors.creamBeige, paddingLeft: 12 }]}>
                          <View style={[s.dailySubHeader, { justifyContent: 'center' }]}>
                            <Ionicons name="book-outline" size={16} color={Colors.skyBlueDark} />
                            <Text style={[s.dailySubTitle, { fontSize: 11 }]}>{t('quranShort')}</Text>
                          </View>
                          <Pressable onPress={toggleQuranToday} style={s.quranTodayToggle}>
                            <View style={[s.quranTodayCircle, quranToday && { backgroundColor: Colors.mintGreen, borderColor: Colors.mintGreen }]}>
                              {quranToday ? (
                                <Ionicons name="checkmark" size={20} color={Colors.white} />
                              ) : (
                                <Ionicons name="book-outline" size={16} color={Colors.textMuted} />
                              )}
                            </View>
                            <Text style={[s.quranTodayStatus, quranToday && { color: Colors.mintGreen }]}>
                              {quranToday ? t('yes') : t('no')}
                            </Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                )}
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
                        <Text style={s.arabicCountLabel}>{t('learnedLetters')}: {localArabicLetters.length} / 28</Text>
                        <View style={s.arabicLettersGrid}>
                          {ARABIC_LETTERS.map((letter) => {
                            const isSelected = localArabicLetters.includes(letter);
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
                            style={[s.arabicPill, localHarakat && { backgroundColor: Colors.mintGreen, borderColor: Colors.mintGreen }]}
                          >
                            <Text style={[s.arabicPillText, localHarakat && { color: Colors.white }]}>
                              {localHarakat ? t('yes') : t('no')}
                            </Text>
                          </Pressable>
                        </View>
                        <View style={s.arabicToggleRow}>
                          <Text style={s.arabicToggleLabel}>{t('canReadArabic')}</Text>
                          <Pressable
                            onPress={() => toggleArabicSetting('canReadArabic')}
                            style={[s.arabicPill, localCanRead && { backgroundColor: Colors.mintGreen, borderColor: Colors.mintGreen }]}
                          >
                            <Text style={[s.arabicPillText, localCanRead && { color: Colors.white }]}>
                              {localCanRead ? t('yes') : t('no')}
                            </Text>
                          </Pressable>
                        </View>
                        <View style={s.arabicToggleRow}>
                          <Text style={s.arabicToggleLabel}>{t('canWriteArabic')}</Text>
                          <Pressable
                            onPress={() => toggleArabicSetting('canWriteArabic')}
                            style={[s.arabicPill, localCanWrite && { backgroundColor: Colors.mintGreen, borderColor: Colors.mintGreen }]}
                          >
                            <Text style={[s.arabicPillText, localCanWrite && { color: Colors.white }]}>
                              {localCanWrite ? t('yes') : t('no')}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                    {isExpanded && subject.key === 'akhlaq' && (
                      <View style={s.subjectContent}>
                        <Text style={s.arabicCountLabel}>{lang === 'it' ? 'Completati' : lang === 'ar' ? 'مكتمل' : 'Completed'}: {akhlaqCheckedCount} / {akhlaqTotalItems}</Text>
                        {AKHLAQ_CATEGORIES.map((cat) => {
                          const isCatExpanded = expandedAkhlaqCats.includes(cat.key);
                          const catChecked = cat.items.filter(i => localAkhlaqChecked.includes(i.key)).length;
                          return (
                            <View key={cat.key}>
                              <Pressable onPress={() => toggleAkhlaqCategory(cat.key)} style={s.akhlaqCatRow}>
                                <Ionicons name={cat.icon as any} size={18} color={cardColor} />
                                <Text style={s.akhlaqCatName}>{getCatLabel(cat)}</Text>
                                <Text style={s.akhlaqCatCount}>{catChecked}/{cat.items.length}</Text>
                                <Ionicons name={isCatExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
                              </Pressable>
                              {isCatExpanded && cat.items.map((item) => {
                                const isChecked = localAkhlaqChecked.includes(item.key);
                                return (
                                  <Pressable key={item.key} onPress={() => toggleAkhlaqItem(item.key)} style={s.akhlaqItemRow}>
                                    <View style={[s.akhlaqCheckBox, isChecked && { backgroundColor: Colors.mintGreen, borderColor: Colors.mintGreen }]}>
                                      {isChecked && <Ionicons name="checkmark" size={12} color={Colors.white} />}
                                    </View>
                                    <Text style={[s.akhlaqItemText, isChecked && { color: Colors.textMuted, textDecorationLine: 'line-through' as const }]}>{getAkhlaqLabel(item)}</Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                          );
                        })}
                      </View>
                    )}
                    {isExpanded && subject.key === 'aqidah' && (
                      <View style={s.subjectContent}>
                        <Text style={s.aqidahIntro}>
                          {lang === 'ar'
                            ? 'العقيدة هي ما نؤمن به في قلوبنا. علّمنا النبي ﷺ ثلاثة مستويات: الإسلام، الإيمان، الإحسان (من حديث جبريل).'
                            : lang === 'en'
                            ? "Aqidah is what we believe in our hearts. The Prophet \uFDFA taught us 3 levels: Islam, Iman, Ihsan (from the Hadith of Jibreel)."
                            : "L'Aqidah e' cio' in cui crediamo con il cuore. Il Profeta \uFDFA ci ha insegnato 3 livelli: Islam, Iman, Ihsan (dal Hadith di Gabriele)."}
                        </Text>
                        <Text style={s.arabicCountLabel}>
                          {lang === 'it' ? 'Completati' : lang === 'ar' ? 'مكتمل' : 'Completed'}: {aqidahCheckedCount} / {aqidahTotalItems}
                        </Text>
                        {AQIDAH_SECTIONS.map((section) => {
                          const isSectionExpanded = expandedAqidahSections.includes(section.key);
                          const sectionChecked = section.items.filter(i => aqidahItems[i.key]?.checked).length;
                          return (
                            <View key={section.key}>
                              <Pressable onPress={() => toggleAqidahSection(section.key)} style={s.akhlaqCatRow}>
                                <MaterialCommunityIcons name={section.icon as any} size={20} color={section.iconColor} />
                                <Text style={s.akhlaqCatName}>{getAqidahSectionLabel(section)}</Text>
                                <Text style={s.akhlaqCatCount}>{sectionChecked}/{section.items.length}</Text>
                                <Ionicons name={isSectionExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
                              </Pressable>
                              {isSectionExpanded && section.items.map((item) => {
                                const progress = aqidahItems[item.key];
                                const isChecked = !!progress?.checked;
                                const hasNote = !!progress?.note;
                                const isEditingThis = editingAqidahNote === item.key;
                                return (
                                  <View key={item.key} style={s.aqidahItemContainer}>
                                    <Pressable onPress={() => toggleAqidahItem(item.key)} style={s.akhlaqItemRow}>
                                      <View style={[s.akhlaqCheckBox, isChecked && { backgroundColor: section.iconColor, borderColor: section.iconColor }]}>
                                        {isChecked && <Ionicons name="checkmark" size={12} color={Colors.white} />}
                                      </View>
                                      <Text style={[s.akhlaqItemText, isChecked && { color: Colors.textMuted, textDecorationLine: 'line-through' as const }]}>
                                        {getAqidahItemLabel(item)}
                                      </Text>
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
                                          size={16}
                                          color={hasNote ? section.iconColor : Colors.textMuted}
                                        />
                                      </Pressable>
                                    </Pressable>
                                    {isEditingThis && (
                                      <View style={s.aqidahNoteRow}>
                                        <TextInput
                                          style={s.aqidahNoteInput}
                                          value={aqidahNoteText}
                                          onChangeText={setAqidahNoteText}
                                          placeholder={lang === 'it' ? 'Nota del genitore...' : lang === 'ar' ? 'ملاحظة الوالد...' : 'Parent note...'}
                                          placeholderTextColor={Colors.textMuted}
                                          multiline
                                        />
                                        <Pressable onPress={() => saveAqidahNote(item.key)} style={[s.aqidahNoteSaveBtn, { backgroundColor: section.iconColor }]}>
                                          <Ionicons name="checkmark" size={16} color={Colors.white} />
                                        </Pressable>
                                      </View>
                                    )}
                                    {!isEditingThis && hasNote && (
                                      <Text style={s.aqidahNotePreview}>{progress?.note}</Text>
                                    )}
                                  </View>
                                );
                              })}
                            </View>
                          );
                        })}
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
            {todayFeed.length > 0 ? (
              <View style={s.card}>
                {todayFeed.map((item, i) => (
                  <View key={`feed-${i}`} style={[s.activityRow, i > 0 && s.taskRowBorder]}>
                    <Ionicons name={item.icon as any} size={18} color={item.iconColor} />
                    <View style={s.activityInfo}>
                      <Text style={s.activityText}>{item.text}</Text>
                      {item.time ? (
                        <Text style={s.activityMeta}>{item.time}</Text>
                      ) : null}
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

      <Modal visible={showQuranModal} animationType="slide" transparent={false}>
        <View style={[s.quranFullPage, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
          <View style={s.quranAppBar}>
            <Pressable testID="quran-back-btn" onPress={() => setShowQuranModal(false)} style={s.quranBackBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </Pressable>
            <Text style={s.quranAppBarTitle}>{t('quranMemorization')}</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={s.quranLearnedSummary}>
            <Text style={s.quranLearnedText}>{t('surahLearnedCount')}: {learnedCount} / 114</Text>
            <View style={s.quranLearnedBar}>
              <View style={[s.quranLearnedBarFill, { width: `${(learnedCount / 114) * 100}%`, backgroundColor: cardColor }]} />
            </View>
          </View>
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
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            renderItem={({ item }) => {
              const statusColor = item.status === 'learned' ? Colors.mintGreen : item.status === 'in_progress' ? '#F4C430' : Colors.textMuted;
              const statusIcon = item.status === 'learned' ? 'checkmark-circle' : item.status === 'in_progress' ? 'time' : 'ellipse-outline';
              const badgeBg = item.status === 'learned' ? Colors.mintGreen : item.status === 'in_progress' ? '#F4C430' : Colors.textMuted;
              return (
                <Pressable onPress={() => cycleSurahStatus(item.number)} style={s.surahRow}>
                  <View style={[s.surahNumBadge, { backgroundColor: badgeBg }]}>
                    <Text style={s.surahNum}>{item.number}</Text>
                  </View>
                  <View style={s.surahNameCol}>
                    <Text style={s.surahArabicName}>{item.arabicName}</Text>
                    <Text style={s.surahLatinName}>{item.number} - {item.name}</Text>
                  </View>
                  <Ionicons name={statusIcon as any} size={24} color={statusColor} />
                </Pressable>
              );
            }}
            ItemSeparatorComponent={() => <View style={s.taskRowBorder} />}
          />
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
  aqidahItemContainer: { marginBottom: 2 },
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
  timeRow: { flexDirection: 'row', gap: 12 },
  timeCol: { flex: 1 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 20, marginTop: 8,
  },
  saveBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.white },
});
