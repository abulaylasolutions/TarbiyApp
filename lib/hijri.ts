const HIJRI_MONTHS = {
  it: ['Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani', 'Jumada al-Ula', 'Jumada al-Thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'],
  en: ['Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani', 'Jumada al-Ula', 'Jumada al-Thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'],
  ar: ['محرّم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'],
};

const HIJRI_MONTHS_SHORT = {
  it: ['Muh', 'Saf', 'Rb1', 'Rb2', 'Jm1', 'Jm2', 'Raj', 'Sha', 'Ram', 'Shw', 'DhQ', 'DhH'],
  en: ['Muh', 'Saf', 'Rb1', 'Rb2', 'Jm1', 'Jm2', 'Raj', 'Sha', 'Ram', 'Shw', 'DhQ', 'DhH'],
  ar: ['محرم', 'صفر', 'رب1', 'رب2', 'جم1', 'جم2', 'رجب', 'شعب', 'رمض', 'شوا', 'ذقع', 'ذحج'],
};

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
  monthNameShort: string;
}

function parseIntlHijri(gDate: Date): { day: number; month: number; year: number } | null {
  try {
    const calendars = ['islamic-umalqura', 'islamic-civil', 'islamic'];
    for (const cal of calendars) {
      try {
        const locale = `en-US-u-ca-${cal}`;
        const formatter = new Intl.DateTimeFormat(locale, {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
          timeZone: 'Asia/Riyadh',
        });
        const parts = formatter.formatToParts(gDate);
        const dayPart = parts.find(p => p.type === 'day');
        const monthPart = parts.find(p => p.type === 'month');
        const yearPart = parts.find(p => p.type === 'year');
        if (dayPart && monthPart && yearPart) {
          const hd = parseInt(dayPart.value, 10);
          const hm = parseInt(monthPart.value, 10);
          const hy = parseInt(yearPart.value, 10);
          if (!isNaN(hd) && !isNaN(hm) && !isNaN(hy) && hm >= 1 && hm <= 12) {
            return { day: hd, month: hm, year: hy };
          }
        }
      } catch {
        continue;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function fallbackGregorianToHijri(gDate: Date): { day: number; month: number; year: number } {
  const meccaOffset = 3 * 60;
  const utcMs = gDate.getTime() + gDate.getTimezoneOffset() * 60000;
  const meccaMs = utcMs + meccaOffset * 60000;
  const meccaDate = new Date(meccaMs);

  const gy = meccaDate.getFullYear();
  const gm = meccaDate.getMonth();
  const gd = meccaDate.getDate();

  let jd = Math.floor((1461 * (gy + 4800 + Math.floor((gm - 13) / 12))) / 4)
    + Math.floor((367 * (gm - 1 - 12 * Math.floor((gm - 13) / 12))) / 12)
    - Math.floor((3 * Math.floor((gy + 4900 + Math.floor((gm - 13) / 12)) / 100)) / 4)
    + gd - 32075;

  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const remaining = l - 10631 * n + 354;

  const j = Math.floor((10985 - remaining) / 5316) * Math.floor((50 * remaining) / 17719)
    + Math.floor(remaining / 5670) * Math.floor((43 * remaining) / 15238);
  const jd2 = remaining - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;

  const hm = Math.floor((24 * jd2) / 709);
  const hd = jd2 - Math.floor((709 * hm) / 24);
  const hy = 30 * n + j - 30;

  return { day: hd, month: hm, year: hy };
}

export function gregorianToHijri(gDate: Date, lang: string = 'it'): HijriDate {
  let result = parseIntlHijri(gDate);

  if (!result) {
    result = fallbackGregorianToHijri(gDate);
  }

  const { day: hd, month: hm, year: hy } = result;

  const months = HIJRI_MONTHS[lang as keyof typeof HIJRI_MONTHS] || HIJRI_MONTHS.it;
  const monthsShort = HIJRI_MONTHS_SHORT[lang as keyof typeof HIJRI_MONTHS_SHORT] || HIJRI_MONTHS_SHORT.it;

  if (__DEV__) {
    console.log(`[Hijri] Gregorian: ${gDate.toISOString()} | Hijri: ${hd} ${months[hm - 1]} ${hy} (month=${hm})`);
  }

  return {
    day: hd,
    month: hm,
    year: hy,
    monthName: months[hm - 1] || '',
    monthNameShort: monthsShort[hm - 1] || '',
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
