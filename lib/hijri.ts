const HIJRI_MONTHS = {
  it: ['Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani', 'Jumada al-Ula', 'Jumada al-Thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'],
  en: ['Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani', 'Jumada al-Ula', 'Jumada al-Thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'],
  ar: ['محرّم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'],
};

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
}

export function gregorianToHijri(gDate: Date, lang: string = 'it'): HijriDate {
  const gy = gDate.getFullYear();
  const gm = gDate.getMonth();
  const gd = gDate.getDate();

  let jd = Math.floor((1461 * (gy + 4800 + Math.floor((gm - 13) / 12))) / 4)
    + Math.floor((367 * (gm - 1 - 12 * Math.floor((gm - 13) / 12))) / 12)
    - Math.floor((3 * Math.floor((gy + 4900 + Math.floor((gm - 13) / 12)) / 100)) / 4)
    + gd - 32075;

  jd = jd - 1948440 + 10632;
  const n = Math.floor((jd - 1) / 10631);
  jd = jd - 10631 * n + 354;

  const j = Math.floor((10985 - jd) / 5316) * Math.floor((50 * jd) / 17719)
    + Math.floor(jd / 5670) * Math.floor((43 * jd) / 15238);
  jd = jd - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;

  const hm = Math.floor((24 * jd) / 709);
  const hd = jd - Math.floor((709 * hm) / 24);
  const hy = 30 * n + j - 30;

  const months = HIJRI_MONTHS[lang as keyof typeof HIJRI_MONTHS] || HIJRI_MONTHS.it;

  return {
    day: hd,
    month: hm,
    year: hy,
    monthName: months[hm - 1] || '',
  };
}

export function getHijriMonthName(month: number, lang: string = 'it'): string {
  const months = HIJRI_MONTHS[lang as keyof typeof HIJRI_MONTHS] || HIJRI_MONTHS.it;
  return months[month - 1] || '';
}

export function getCurrentHijriYear(): number {
  return gregorianToHijri(new Date()).year;
}

export function isRamadanMonth(gDate: Date): boolean {
  const hijri = gregorianToHijri(gDate);
  return hijri.month === 9;
}
