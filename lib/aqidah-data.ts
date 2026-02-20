export interface AqidahLeafItem {
  key: string;
  it: string;
  en: string;
  ar: string;
  isProphet?: boolean;
  prophetStory?: { it: string; en: string; ar: string };
}

export interface AqidahPillar {
  key: string;
  it: string;
  en: string;
  ar: string;
  icon: string;
  iconLib?: 'ionicons' | 'material';
  iconColor: string;
  items: AqidahLeafItem[];
}

export interface AqidahLevel {
  key: string;
  it: string;
  en: string;
  ar: string;
  icon: string;
  iconColor: string;
  pillars: AqidahPillar[];
}

export const AQIDAH_LEVELS: AqidahLevel[] = [
  {
    key: 'islam',
    it: 'Islam - I 5 Pilastri',
    en: 'Islam - The 5 Pillars',
    ar: 'الإسلام - الأركان الخمسة',
    icon: 'hands-pray',
    iconColor: '#A8E6CF',
    pillars: [
      {
        key: 'shahada',
        it: 'Shahada (Testimonianza di fede)',
        en: 'Shahada (Declaration of Faith)',
        ar: 'الشهادة',
        icon: 'shield-checkmark-outline',
        iconLib: 'ionicons',
        iconColor: '#A8E6CF',
        items: [
          { key: 'shahada_kufr_taghut', it: 'Kufr bit-Taghut: Rinnegare ogni falsa divinita', en: 'Kufr bit-Taghut: Reject all false deities', ar: 'الكفر بالطاغوت: رفض كل ما يُعبد من دون الله' },
          { key: 'shahada_iman_billah', it: 'Iman billah: Credere in Allah come unico Dio', en: 'Iman billah: Believe in Allah as the only God', ar: 'الإيمان بالله: الإيمان بالله إلهاً واحداً' },
          { key: 'shahada_muhammad', it: 'Muhammad e il Suo messaggero e ultimo profeta', en: 'Muhammad is His messenger and final prophet', ar: 'محمد رسول الله وخاتم الأنبياء' },
          { key: 'shahada_meaning', it: 'Conoscere il significato della Shahada', en: 'Know the meaning of the Shahada', ar: 'معرفة معنى الشهادة' },
        ],
      },
      {
        key: 'salah',
        it: 'Salah (Preghiera)',
        en: 'Salah (Prayer)',
        ar: 'الصلاة',
        icon: 'time-outline',
        iconLib: 'ionicons',
        iconColor: '#B2D8B2',
        items: [
          { key: 'salah_pillars', it: 'Pilastri della Salah (Arkan): stare in piedi, ruku, sujud', en: 'Pillars of Salah (Arkan): standing, ruku, sujud', ar: 'أركان الصلاة: القيام والركوع والسجود' },
          { key: 'salah_conditions', it: 'Condizioni: pulizia, wudu, direzione Qibla, orario', en: 'Conditions: cleanliness, wudu, Qibla direction, timing', ar: 'شروط الصلاة: الطهارة والوضوء واستقبال القبلة والوقت' },
          { key: 'salah_five', it: 'Le 5 preghiere: Fajr, Dhuhr, Asr, Maghrib, Isha', en: 'The 5 prayers: Fajr, Dhuhr, Asr, Maghrib, Isha', ar: 'الصلوات الخمس: الفجر والظهر والعصر والمغرب والعشاء' },
          { key: 'salah_khushu', it: 'Khushu: concentrazione e umilta nella preghiera', en: 'Khushu: focus and humility in prayer', ar: 'الخشوع في الصلاة' },
          { key: 'salah_jama', it: 'Preghiera in congregazione (Jama\'a)', en: 'Congregational prayer (Jama\'a)', ar: 'صلاة الجماعة' },
        ],
      },
      {
        key: 'zakat',
        it: 'Zakat (Elemosina obbligatoria)',
        en: 'Zakat (Obligatory Charity)',
        ar: 'الزكاة',
        icon: 'cash-outline',
        iconLib: 'ionicons',
        iconColor: '#FFF5BA',
        items: [
          { key: 'zakat_meaning', it: 'Significato: purificazione della ricchezza', en: 'Meaning: purification of wealth', ar: 'معنى الزكاة: تطهير المال' },
          { key: 'zakat_nisab', it: 'Nisab: soglia minima per l\'obbligo', en: 'Nisab: minimum threshold for obligation', ar: 'النصاب: الحد الأدنى للوجوب' },
          { key: 'zakat_recipients', it: 'I destinatari della Zakat (8 categorie)', en: 'Recipients of Zakat (8 categories)', ar: 'مصارف الزكاة (٨ أصناف)' },
          { key: 'zakat_sadaqah', it: 'Differenza tra Zakat e Sadaqah', en: 'Difference between Zakat and Sadaqah', ar: 'الفرق بين الزكاة والصدقة' },
        ],
      },
      {
        key: 'sawm',
        it: 'Sawm (Digiuno di Ramadan)',
        en: 'Sawm (Fasting in Ramadan)',
        ar: 'صوم رمضان',
        icon: 'moon-outline',
        iconLib: 'ionicons',
        iconColor: '#E0BBE4',
        items: [
          { key: 'sawm_meaning', it: 'Significato spirituale del digiuno', en: 'Spiritual meaning of fasting', ar: 'المعنى الروحي للصيام' },
          { key: 'sawm_rules', it: 'Regole: dall\'alba al tramonto, niente cibo/bevande', en: 'Rules: from dawn to sunset, no food/drink', ar: 'أحكام الصيام: من الفجر إلى المغرب' },
          { key: 'sawm_suhur', it: 'Suhur e Iftar: pasti prima e dopo', en: 'Suhur and Iftar: meals before and after', ar: 'السحور والإفطار' },
          { key: 'sawm_exempt', it: 'Esenzioni: malattia, viaggio, eta', en: 'Exemptions: illness, travel, age', ar: 'الأعذار المبيحة للفطر' },
        ],
      },
      {
        key: 'hajj',
        it: 'Hajj (Pellegrinaggio)',
        en: 'Hajj (Pilgrimage)',
        ar: 'الحج',
        icon: 'navigate-outline',
        iconLib: 'ionicons',
        iconColor: '#FFDAC1',
        items: [
          { key: 'hajj_obligation', it: 'Obbligo per chi puo fisicamente e finanziariamente', en: 'Obligation for those physically and financially able', ar: 'واجب على المستطيع بدنياً ومالياً' },
          { key: 'hajj_rituals', it: 'Rituali: Ihram, Tawaf, Sa\'i, Arafat, Mina', en: 'Rituals: Ihram, Tawaf, Sa\'i, Arafat, Mina', ar: 'المناسك: الإحرام والطواف والسعي وعرفة ومنى' },
          { key: 'hajj_umrah', it: 'Differenza tra Hajj e Umrah', en: 'Difference between Hajj and Umrah', ar: 'الفرق بين الحج والعمرة' },
          { key: 'hajj_kabah', it: 'La Ka\'bah: la Casa di Allah', en: 'The Ka\'bah: the House of Allah', ar: 'الكعبة: بيت الله الحرام' },
        ],
      },
    ],
  },
  {
    key: 'iman',
    it: 'Iman - I 6 Pilastri',
    en: 'Iman - The 6 Pillars',
    ar: 'الإيمان - الأركان الستة',
    icon: 'book-open-variant',
    iconColor: '#C7CEEA',
    pillars: [
      {
        key: 'allah',
        it: 'Credere in Allah',
        en: 'Belief in Allah',
        ar: 'الإيمان بالله',
        icon: 'scale-balance',
        iconLib: 'material',
        iconColor: '#C7CEEA',
        items: [
          { key: 'tawhid_rububiyyah', it: 'Tawhid ar-Rububiyyah: Allah e l\'unico Creatore e Sovrano', en: 'Tawhid ar-Rububiyyah: Allah is the only Creator and Sovereign', ar: 'توحيد الربوبية: الله هو الخالق والمالك والمدبر' },
          { key: 'tawhid_uluhiyyah', it: 'Tawhid al-Uluhiyyah: solo Allah merita l\'adorazione', en: 'Tawhid al-Uluhiyyah: only Allah deserves worship', ar: 'توحيد الألوهية: لا يُعبد بحق إلا الله' },
          { key: 'tawhid_asma', it: 'Tawhid al-Asma wa s-Sifat: nomi e attributi unici di Allah', en: 'Tawhid al-Asma wa s-Sifat: unique names and attributes of Allah', ar: 'توحيد الأسماء والصفات' },
          { key: 'allah_99names', it: 'I 99 Nomi di Allah (Al-Asma al-Husna)', en: 'The 99 Names of Allah (Al-Asma al-Husna)', ar: 'أسماء الله الحسنى (٩٩ اسماً)' },
        ],
      },
      {
        key: 'angels',
        it: 'Credere negli Angeli',
        en: 'Belief in Angels',
        ar: 'الإيمان بالملائكة',
        icon: 'sparkles-outline',
        iconLib: 'ionicons',
        iconColor: '#F5C6D0',
        items: [
          { key: 'angels_nature', it: 'Creati di luce, obbediscono sempre ad Allah', en: 'Created from light, always obey Allah', ar: 'خُلقوا من نور ويطيعون الله دائماً' },
          { key: 'angels_jibril', it: 'Jibril (Gabriele): porta la rivelazione', en: 'Jibril (Gabriel): brings revelation', ar: 'جبريل: ينزل بالوحي' },
          { key: 'angels_mikail', it: 'Mikail: provvede il sostentamento', en: 'Mikail: provides sustenance', ar: 'ميكائيل: موكل بالرزق' },
          { key: 'angels_israfil', it: 'Israfil: suonera la Tromba', en: 'Israfil: will blow the Trumpet', ar: 'إسرافيل: ينفخ في الصور' },
          { key: 'angels_malakulmaut', it: 'Malak al-Maut: angelo della morte', en: 'Malak al-Maut: angel of death', ar: 'ملك الموت' },
          { key: 'angels_kiraman', it: 'Kiraman Katibin: angeli che registrano le azioni', en: 'Kiraman Katibin: angels that record deeds', ar: 'الكرام الكاتبون' },
        ],
      },
      {
        key: 'books',
        it: 'Credere nei Libri rivelati',
        en: 'Belief in the Revealed Books',
        ar: 'الإيمان بالكتب',
        icon: 'book-outline',
        iconLib: 'ionicons',
        iconColor: '#B2D8B2',
        items: [
          { key: 'books_quran', it: 'Il Corano: rivelato a Muhammad (pace su di lui)', en: 'The Quran: revealed to Muhammad (peace be upon him)', ar: 'القرآن: أُنزل على محمد ﷺ' },
          { key: 'books_injil', it: 'L\'Injil (Vangelo): rivelato a Isa', en: 'The Injil (Gospel): revealed to Isa', ar: 'الإنجيل: أُنزل على عيسى' },
          { key: 'books_tawrat', it: 'La Tawrat (Torah): rivelata a Musa', en: 'The Tawrat (Torah): revealed to Musa', ar: 'التوراة: أُنزلت على موسى' },
          { key: 'books_zabur', it: 'Lo Zabur (Salmi): rivelato a Dawud', en: 'The Zabur (Psalms): revealed to Dawud', ar: 'الزبور: أُنزل على داود' },
          { key: 'books_suhuf', it: 'I Suhuf (Pergamene) di Ibrahim e Musa', en: 'The Suhuf (Scrolls) of Ibrahim and Musa', ar: 'صحف إبراهيم وموسى' },
        ],
      },
      {
        key: 'messengers',
        it: 'Credere nei Messaggeri',
        en: 'Belief in the Messengers',
        ar: 'الإيمان بالرسل',
        icon: 'people-outline',
        iconLib: 'ionicons',
        iconColor: '#FFD3B6',
        items: [
          { key: 'prophet_adam', it: 'Adam', en: 'Adam', ar: 'آدم', isProphet: true, prophetStory: { it: 'Il primo uomo e profeta. Allah lo creo dalla terra e gli insegno i nomi di tutte le cose. Visse nel Paradiso con Hawwa (Eva) prima di scendere sulla Terra.', en: 'The first man and prophet. Allah created him from earth and taught him the names of all things. He lived in Paradise with Hawwa (Eve) before descending to Earth.', ar: 'أول إنسان ونبي. خلقه الله من تراب وعلّمه الأسماء كلها. عاش في الجنة مع حواء قبل أن يهبط إلى الأرض.' } },
          { key: 'prophet_idris', it: 'Idris (Enoch)', en: 'Idris (Enoch)', ar: 'إدريس', isProphet: true, prophetStory: { it: 'Profeta molto devoto, fu il primo a scrivere con la penna. Allah lo elevo a un posto alto. Era conosciuto per la sua saggezza e pazienza.', en: 'A very devout prophet, he was the first to write with a pen. Allah raised him to a high station. He was known for his wisdom and patience.', ar: 'نبي شديد العبادة، أول من خطّ بالقلم. رفعه الله مكاناً علياً. عُرف بحكمته وصبره.' } },
          { key: 'prophet_nuh', it: 'Nuh (Noe)', en: 'Nuh (Noah)', ar: 'نوح', isProphet: true, prophetStory: { it: 'Predico ad Allah per 950 anni. Costrui l\'Arca per ordine di Allah per salvarsi dal diluvio. Solo pochi credettero e si salvarono con lui.', en: 'Preached to Allah for 950 years. Built the Ark by Allah\'s command to be saved from the flood. Only a few believed and were saved with him.', ar: 'دعا إلى الله ٩٥٠ سنة. بنى السفينة بأمر الله للنجاة من الطوفان. آمن معه قليل فقط.' } },
          { key: 'prophet_hud', it: 'Hud', en: 'Hud', ar: 'هود', isProphet: true, prophetStory: { it: 'Inviato al popolo di \'Ad, che erano potenti e arroganti. Li chiamo ad adorare Allah solo, ma rifiutarono e furono distrutti da un vento furioso.', en: 'Sent to the people of \'Ad, who were powerful and arrogant. He called them to worship Allah alone, but they refused and were destroyed by a furious wind.', ar: 'أُرسل إلى قوم عاد الأقوياء المتكبرين. دعاهم لعبادة الله وحده فرفضوا فأهلكهم الله بريح صرصر.' } },
          { key: 'prophet_salih', it: 'Salih', en: 'Salih', ar: 'صالح', isProphet: true, prophetStory: { it: 'Inviato al popolo di Thamud. Allah gli diede come segno una cammella miracolosa, ma il popolo la uccise e fu distrutto da un terremoto.', en: 'Sent to the people of Thamud. Allah gave him a miraculous she-camel as a sign, but the people killed it and were destroyed by an earthquake.', ar: 'أُرسل إلى ثمود. أعطاه الله ناقة معجزة آية لهم، لكنهم عقروها فأهلكهم الله بالصيحة.' } },
          { key: 'prophet_ibrahim', it: 'Ibrahim (Abramo)', en: 'Ibrahim (Abraham)', ar: 'إبراهيم', isProphet: true, prophetStory: { it: 'L\'amico intimo di Allah (Khalilullah). Distrusse gli idoli del suo popolo, fu gettato nel fuoco ma Allah lo salvo. Costrui la Ka\'bah con suo figlio Ismail.', en: 'The intimate friend of Allah (Khalilullah). He destroyed his people\'s idols, was thrown into fire but Allah saved him. Built the Ka\'bah with his son Ismail.', ar: 'خليل الله. حطّم أصنام قومه وأُلقي في النار فنجّاه الله. بنى الكعبة مع ابنه إسماعيل.' } },
          { key: 'prophet_lut', it: 'Lut (Lot)', en: 'Lut (Lot)', ar: 'لوط', isProphet: true, prophetStory: { it: 'Nipote di Ibrahim. Inviato al popolo di Sodoma che commetteva gravi peccati. Li ammon\u00ec ma rifiutarono, e Allah li distrusse.', en: 'Nephew of Ibrahim. Sent to the people of Sodom who committed grave sins. He warned them but they refused, and Allah destroyed them.', ar: 'ابن أخي إبراهيم. أُرسل إلى قوم سدوم الذين ارتكبوا الفواحش. حذّرهم فرفضوا فأهلكهم الله.' } },
          { key: 'prophet_ismail', it: 'Ismail (Ismaele)', en: 'Ismail (Ishmael)', ar: 'إسماعيل', isProphet: true, prophetStory: { it: 'Figlio di Ibrahim. Accetto di essere sacrificato per obbedire ad Allah, che lo salvo con un montone. Aiuto a costruire la Ka\'bah. Antenato del Profeta Muhammad.', en: 'Son of Ibrahim. Accepted to be sacrificed to obey Allah, who saved him with a ram. Helped build the Ka\'bah. Ancestor of Prophet Muhammad.', ar: 'ابن إبراهيم. قَبِل الذبح طاعة لله فافتداه الله بكبش. ساعد في بناء الكعبة. جدّ النبي محمد ﷺ.' } },
          { key: 'prophet_ishaq', it: 'Ishaq (Isacco)', en: 'Ishaq (Isaac)', ar: 'إسحاق', isProphet: true, prophetStory: { it: 'Figlio di Ibrahim e Sarah. Allah lo benedisse con la profezia. Fu padre di Yaqub e nonno di Yusuf. Continuo la linea profetica.', en: 'Son of Ibrahim and Sarah. Allah blessed him with prophethood. He was the father of Yaqub and grandfather of Yusuf. Continued the prophetic line.', ar: 'ابن إبراهيم وسارة. باركه الله بالنبوة. أبو يعقوب وجدّ يوسف. استمرت به سلسلة الأنبياء.' } },
          { key: 'prophet_yaqub', it: 'Yaqub (Giacobbe)', en: 'Yaqub (Jacob)', ar: 'يعقوب', isProphet: true, prophetStory: { it: 'Figlio di Ishaq, anche chiamato Israil. Ebbe 12 figli, tra cui Yusuf. Fu molto paziente durante la separazione dal figlio amato Yusuf.', en: 'Son of Ishaq, also called Israil. Had 12 sons, including Yusuf. Was very patient during separation from his beloved son Yusuf.', ar: 'ابن إسحاق ويُسمى إسرائيل. له ١٢ ابناً منهم يوسف. صبر على فراق ابنه يوسف الحبيب.' } },
          { key: 'prophet_yusuf', it: 'Yusuf (Giuseppe)', en: 'Yusuf (Joseph)', ar: 'يوسف', isProphet: true, prophetStory: { it: 'Famoso per la sua bellezza e pazienza. I fratelli lo gettarono in un pozzo per gelosia. Divenne ministro d\'Egitto e perdono i suoi fratelli.', en: 'Known for his beauty and patience. His brothers threw him in a well out of jealousy. Became minister of Egypt and forgave his brothers.', ar: 'عُرف بجماله وصبره. ألقاه إخوته في البئر حسداً. أصبح عزيز مصر وسامح إخوته.' } },
          { key: 'prophet_ayyub', it: 'Ayyub (Giobbe)', en: 'Ayyub (Job)', ar: 'أيوب', isProphet: true, prophetStory: { it: 'Simbolo di pazienza estrema. Perse ricchezza, figli e salute ma non smise mai di lodare Allah. Allah lo guari e gli restitui tutto moltiplicato.', en: 'Symbol of extreme patience. Lost wealth, children, and health but never stopped praising Allah. Allah healed him and restored everything multiplied.', ar: 'رمز الصبر. فقد ماله وأولاده وصحته لكنه لم يتوقف عن حمد الله. شفاه الله وردّ عليه أضعافاً.' } },
          { key: 'prophet_shuayb', it: 'Shu\'ayb', en: 'Shu\'ayb', ar: 'شعيب', isProphet: true, prophetStory: { it: 'Inviato al popolo di Madyan. Li ammon\u00ec contro l\'inganno nel commercio e l\'ingiustizia nelle misure. Rifiutarono e furono distrutti.', en: 'Sent to the people of Madyan. He warned them against cheating in trade and injustice in measures. They refused and were destroyed.', ar: 'أُرسل إلى أهل مدين. نهاهم عن الغش في التجارة ونقص المكيال. رفضوا فأهلكهم الله.' } },
          { key: 'prophet_musa', it: 'Musa (Mose)', en: 'Musa (Moses)', ar: 'موسى', isProphet: true, prophetStory: { it: 'Libero i Bani Israil dal Faraone. Allah gli parlo direttamente e gli diede la Torah. Apri il mare con il suo bastone per miracolo di Allah.', en: 'Freed the Bani Israil from Pharaoh. Allah spoke to him directly and gave him the Torah. Parted the sea with his staff by Allah\'s miracle.', ar: 'أنقذ بني إسرائيل من فرعون. كلّمه الله تكليماً وأنزل عليه التوراة. شقّ البحر بعصاه بمعجزة من الله.' } },
          { key: 'prophet_harun', it: 'Harun (Aronne)', en: 'Harun (Aaron)', ar: 'هارون', isProphet: true, prophetStory: { it: 'Fratello di Musa e suo assistente nella missione. Era eloquente e gentile. Aiuto Musa a trasmettere il messaggio al Faraone e al popolo.', en: 'Brother of Musa and his assistant in the mission. He was eloquent and gentle. Helped Musa convey the message to Pharaoh and the people.', ar: 'أخو موسى ووزيره في الرسالة. كان فصيحاً ليّناً. ساعد موسى في تبليغ الرسالة لفرعون والناس.' } },
          { key: 'prophet_dhulkifl', it: 'Dhul-Kifl', en: 'Dhul-Kifl', ar: 'ذو الكفل', isProphet: true, prophetStory: { it: 'Menzionato nel Corano tra i pazienti e i virtuosi. Si ritiene fosse molto devoto e giusto. Il suo nome significa "colui che garantisce".', en: 'Mentioned in the Quran among the patient and virtuous. Believed to have been very devout and just. His name means "the guarantor".', ar: 'ذُكر في القرآن من الصابرين والأخيار. كان عابداً صالحاً. اسمه يعني "صاحب الكفالة".' } },
          { key: 'prophet_dawud', it: 'Dawud (Davide)', en: 'Dawud (David)', ar: 'داود', isProphet: true, prophetStory: { it: 'Re e profeta. Allah gli diede lo Zabur (Salmi) e una voce bellissima. Sconfisse Jalut (Golia) da giovane. Era noto per il digiuno alterno.', en: 'King and prophet. Allah gave him the Zabur (Psalms) and a beautiful voice. Defeated Jalut (Goliath) as a youth. Known for fasting on alternate days.', ar: 'ملك ونبي. أنزل الله عليه الزبور وأعطاه صوتاً جميلاً. قتل جالوت شاباً. عُرف بصيام يوم وإفطار يوم.' } },
          { key: 'prophet_sulayman', it: 'Sulayman (Salomone)', en: 'Sulayman (Solomon)', ar: 'سليمان', isProphet: true, prophetStory: { it: 'Figlio di Dawud. Allah gli diede un regno immenso: controllava il vento, parlava agli animali e comandava i jinn. Era grato ad Allah.', en: 'Son of Dawud. Allah gave him a vast kingdom: he controlled wind, spoke to animals and commanded jinn. He was grateful to Allah.', ar: 'ابن داود. أعطاه الله ملكاً عظيماً: سخّر له الريح وكلّم الحيوانات وأمر الجن. كان شاكراً لله.' } },
          { key: 'prophet_ilyas', it: 'Ilyas (Elia)', en: 'Ilyas (Elijah)', ar: 'إلياس', isProphet: true, prophetStory: { it: 'Invito il suo popolo ad abbandonare l\'idolo Ba\'al e ad adorare solo Allah. Il suo popolo lo rifiuto, ma lui rimase fermo nella fede.', en: 'Called his people to abandon the idol Ba\'al and worship Allah alone. His people rejected him, but he remained firm in faith.', ar: 'دعا قومه إلى ترك عبادة بعل وعبادة الله وحده. رفضه قومه لكنه ثبت على إيمانه.' } },
          { key: 'prophet_alyasa', it: 'Al-Yasa\' (Eliseo)', en: 'Al-Yasa\' (Elisha)', ar: 'اليسع', isProphet: true, prophetStory: { it: 'Successe a Ilyas nella sua missione. Menzionato nel Corano come uno dei prescelti e dei virtuosi. Continuo a guidare il suo popolo.', en: 'Succeeded Ilyas in his mission. Mentioned in the Quran as one of the chosen and virtuous. Continued to guide his people.', ar: 'خلف إلياس في رسالته. ذُكر في القرآن من المصطفين الأخيار. استمر في هداية قومه.' } },
          { key: 'prophet_yunus', it: 'Yunus (Giona)', en: 'Yunus (Jonah)', ar: 'يونس', isProphet: true, prophetStory: { it: 'Lascio il suo popolo frustrato e fu inghiottito da un grande pesce. Prego Allah nel buio e fu salvato. Il suo popolo poi credette.', en: 'Left his people in frustration and was swallowed by a great fish. He prayed to Allah in darkness and was saved. His people then believed.', ar: 'ترك قومه محبطاً فابتلعه حوت عظيم. دعا الله في الظلمات فنجّاه. ثم آمن قومه.' } },
          { key: 'prophet_zakariya', it: 'Zakariya (Zaccaria)', en: 'Zakariya (Zechariah)', ar: 'زكريا', isProphet: true, prophetStory: { it: 'Custode di Maryam (Maria). Prego Allah per un figlio in vecchiaia e Allah gli dono Yahya. Fu un servo devoto e paziente.', en: 'Guardian of Maryam (Mary). Prayed to Allah for a son in old age and Allah gave him Yahya. He was a devout and patient servant.', ar: 'كفيل مريم. دعا الله أن يرزقه ولداً في شيخوخته فوهبه الله يحيى. كان عبداً تقياً صابراً.' } },
          { key: 'prophet_yahya', it: 'Yahya (Giovanni)', en: 'Yahya (John)', ar: 'يحيى', isProphet: true, prophetStory: { it: 'Figlio di Zakariya, nato miracolosamente. Fu il primo a portare questo nome. Era pio, gentile, puro e devoto ad Allah fin da bambino.', en: 'Son of Zakariya, born miraculously. He was the first to bear this name. He was pious, kind, pure and devoted to Allah from childhood.', ar: 'ابن زكريا وُلد بمعجزة. أول من سُمي بهذا الاسم. كان تقياً وبراً وطاهراً منذ صغره.' } },
          { key: 'prophet_isa', it: 'Isa (Gesu)', en: 'Isa (Jesus)', ar: 'عيسى', isProphet: true, prophetStory: { it: 'Nato miracolosamente dalla Vergine Maryam. Parlo dalla culla, guari malati e risuscito morti per permesso di Allah. Fu elevato al cielo e tornera alla fine dei tempi.', en: 'Born miraculously to Virgin Maryam. Spoke from the cradle, healed the sick and raised the dead by Allah\'s permission. Was raised to heaven and will return at the end of times.', ar: 'وُلد معجزة من مريم العذراء. تكلم في المهد وشفى المرضى وأحيا الموتى بإذن الله. رُفع إلى السماء وسيعود آخر الزمان.' } },
          { key: 'prophet_muhammad', it: 'Muhammad (pace e benedizioni su di lui)', en: 'Muhammad (peace and blessings upon him)', ar: 'محمد ﷺ', isProphet: true, prophetStory: { it: 'L\'ultimo e il sigillo dei profeti. Nacque alla Mecca e ricevette la rivelazione del Corano. Insegno l\'Islam completo e perfetto. La sua vita e l\'esempio per tutta l\'umanita.', en: 'The last and seal of the prophets. Born in Makkah and received the revelation of the Quran. Taught the complete and perfect Islam. His life is the example for all humanity.', ar: 'خاتم الأنبياء والمرسلين. وُلد في مكة ونزل عليه القرآن. علّم الإسلام الكامل. حياته قدوة للبشرية جمعاء.' } },
        ],
      },
      {
        key: 'lastday',
        it: 'Credere nell\'Ultimo Giorno',
        en: 'Belief in the Last Day',
        ar: 'الإيمان باليوم الآخر',
        icon: 'hourglass-outline',
        iconLib: 'ionicons',
        iconColor: '#E0BBE4',
        items: [
          { key: 'lastday_signs', it: 'Segni minori e maggiori dell\'Ora', en: 'Minor and major signs of the Hour', ar: 'علامات الساعة الصغرى والكبرى' },
          { key: 'lastday_resurrection', it: 'La Resurrezione (Al-Ba\'th)', en: 'The Resurrection (Al-Ba\'th)', ar: 'البعث' },
          { key: 'lastday_judgment', it: 'Il Giudizio (Al-Hisab)', en: 'The Judgment (Al-Hisab)', ar: 'الحساب' },
          { key: 'lastday_jannah', it: 'Il Paradiso (Jannah) e le sue delizie', en: 'Paradise (Jannah) and its delights', ar: 'الجنة ونعيمها' },
          { key: 'lastday_nar', it: 'L\'Inferno (An-Nar) e il suo tormento', en: 'Hellfire (An-Nar) and its torment', ar: 'النار وعذابها' },
        ],
      },
      {
        key: 'qadar',
        it: 'Credere nel Qadar (Destino)',
        en: 'Belief in Qadar (Destiny)',
        ar: 'الإيمان بالقدر',
        icon: 'infinite-outline',
        iconLib: 'ionicons',
        iconColor: '#FFF5BA',
        items: [
          { key: 'qadar_knowledge', it: 'La Scienza di Allah: Egli sa tutto dall\'eternita', en: 'Allah\'s Knowledge: He knows everything from eternity', ar: 'علم الله: يعلم كل شيء من الأزل' },
          { key: 'qadar_writing', it: 'La Scrittura: tutto e registrato nella Tavola Preservata', en: 'The Writing: everything is recorded in the Preserved Tablet', ar: 'الكتابة: كل شيء مكتوب في اللوح المحفوظ' },
          { key: 'qadar_will', it: 'La Volonta di Allah: nulla accade senza il Suo volere', en: 'Allah\'s Will: nothing happens without His will', ar: 'مشيئة الله: لا يقع شيء إلا بإرادته' },
          { key: 'qadar_creation', it: 'La Creazione: Allah e il Creatore di tutto', en: 'Creation: Allah is the Creator of everything', ar: 'الخلق: الله خالق كل شيء' },
          { key: 'qadar_good_bad', it: 'Accettare il bene e il male come decreto di Allah', en: 'Accept good and bad as Allah\'s decree', ar: 'الرضا بالقدر خيره وشره' },
        ],
      },
    ],
  },
  {
    key: 'ihsan',
    it: 'Ihsan - Il livello di eccellenza',
    en: 'Ihsan - The Level of Excellence',
    ar: 'الإحسان - مستوى التميز',
    icon: 'heart-outline',
    iconColor: '#FFD3B6',
    pillars: [
      {
        key: 'worship_awareness',
        it: 'Adorazione consapevole',
        en: 'Conscious Worship',
        ar: 'العبادة الواعية',
        icon: 'eye-outline',
        iconLib: 'ionicons',
        iconColor: '#FFD3B6',
        items: [
          { key: 'ihsan_as_if_see', it: 'Adorare Allah come se Lo vedessimo', en: 'Worship Allah as if you see Him', ar: 'أن تعبد الله كأنك تراه' },
          { key: 'ihsan_he_sees', it: 'Se non Lo vediamo, Egli ci vede sempre', en: 'If we cannot see Him, He always sees us', ar: 'فإن لم تكن تراه فإنه يراك' },
          { key: 'ihsan_muraqaba', it: 'Muraqaba: la consapevolezza costante di Allah', en: 'Muraqaba: constant awareness of Allah', ar: 'المراقبة: استشعار رقابة الله دائماً' },
        ],
      },
      {
        key: 'pure_intention',
        it: 'Intenzione pura (Ikhlas)',
        en: 'Pure Intention (Ikhlas)',
        ar: 'الإخلاص',
        icon: 'diamond-outline',
        iconLib: 'ionicons',
        iconColor: '#F5C6D0',
        items: [
          { key: 'ihsan_ikhlas', it: 'Ogni azione solo per compiacere Allah', en: 'Every action only to please Allah', ar: 'كل عمل ابتغاء وجه الله' },
          { key: 'ihsan_niyyah', it: 'Niyyah: l\'intenzione prima di ogni azione', en: 'Niyyah: the intention before every action', ar: 'النية قبل كل عمل' },
          { key: 'ihsan_avoid_riya', it: 'Evitare Riya\' (ostentazione)', en: 'Avoid Riya\' (showing off)', ar: 'اجتناب الرياء' },
        ],
      },
      {
        key: 'heart_improvement',
        it: 'Miglioramento del cuore',
        en: 'Heart Improvement',
        ar: 'تزكية القلب',
        icon: 'pulse-outline',
        iconLib: 'ionicons',
        iconColor: '#A8E6CF',
        items: [
          { key: 'ihsan_tawbah', it: 'Tawbah: pentimento sincero ad Allah', en: 'Tawbah: sincere repentance to Allah', ar: 'التوبة النصوح إلى الله' },
          { key: 'ihsan_tawakkul', it: 'Tawakkul: fidarsi completamente di Allah', en: 'Tawakkul: complete trust in Allah', ar: 'التوكل على الله' },
          { key: 'ihsan_shukr', it: 'Shukr: gratitudine verso Allah', en: 'Shukr: gratitude towards Allah', ar: 'الشكر لله' },
          { key: 'ihsan_sabr', it: 'Sabr: pazienza nelle difficolta', en: 'Sabr: patience in difficulties', ar: 'الصبر على البلاء' },
          { key: 'ihsan_dhikr', it: 'Dhikr: ricordo frequente di Allah', en: 'Dhikr: frequent remembrance of Allah', ar: 'ذكر الله كثيراً' },
        ],
      },
    ],
  },
];

export function getAllAqidahLeafItems(): AqidahLeafItem[] {
  return AQIDAH_LEVELS.flatMap(level => level.pillars.flatMap(pillar => pillar.items));
}

export function getAqidahTotalCount(): number {
  return getAllAqidahLeafItems().length;
}

export function getLabel(item: { it: string; en: string; ar: string }, lang: string): string {
  if (lang === 'ar') return item.ar;
  if (lang === 'en') return item.en;
  return item.it;
}
