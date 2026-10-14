// Seed data for the Mishur HaNof app (kindergartens + grades 1–6).
// Dates are relative to today so the demo always looks current.
// In production this would come from the school's backend (Mashov / Smart School / custom API).
(function () {
  const iso = d => d.toISOString().slice(0, 10);
  const day = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return iso(d); };

  const SUBJECTS = {
    math:    { name: 'חשבון',           color: '#3b82f6', teacher: 'דנה כהן' },
    hebrew:  { name: 'שפה',             color: '#ef4444', teacher: 'מיכל אברהם' },
    english: { name: 'אנגלית',          color: '#8b5cf6', teacher: 'Sarah Miller' },
    science: { name: 'מדע וטכנולוגיה',  color: '#10b981', teacher: 'אבי מזרחי' },
    moledet: { name: 'מולדת וחברה',     color: '#f59e0b', teacher: 'יוסי פרץ' },
    tora:    { name: 'תורה',            color: '#a16207', teacher: 'רונית לוי' },
    reading: { name: 'ספרייה וקריאה',   color: '#ec4899', teacher: 'רונית לוי' },
    art:     { name: 'אמנות',           color: '#d946ef', teacher: 'נועה ברק' },
    music:   { name: 'מוזיקה',          color: '#0ea5e9', teacher: 'תמר שחר' },
    pe:      { name: 'חינוך גופני',     color: '#f97316', teacher: 'עומר שלום' },
    life:    { name: 'כישורי חיים',     color: '#64748b', teacher: 'מיכל אברהם' }
  };

  const PERIODS = [
    { n: 1, from: '08:00', to: '08:45' },
    { n: 2, from: '08:45', to: '09:30' },
    { n: 3, from: '09:50', to: '10:35' },
    { n: 4, from: '10:35', to: '11:20' },
    { n: 5, from: '11:40', to: '12:25' },
    { n: 6, from: '12:25', to: '13:10' }
  ];
  const BREAKS = [
    { after: 2, label: 'ארוחת עשר והפסקה', from: '09:30', to: '09:50' },
    { after: 4, label: 'הפסקה בחצר', from: '11:20', to: '11:40' }
  ];

  // index 0 = Sunday ... 5 = Friday (class ד2)
  const TIMETABLE = {
    0: ['life', 'math', 'math', 'hebrew', 'english', 'science'],
    1: ['hebrew', 'hebrew', 'tora', 'math', 'pe', 'art'],
    2: ['math', 'science', 'english', 'moledet', 'music', 'reading'],
    3: ['hebrew', 'math', 'moledet', 'tora', 'pe', 'english'],
    4: ['math', 'hebrew', 'science', 'art', 'reading', 'life'],
    5: ['tora', 'hebrew', 'math', 'life']
  };

  // Kindergarten daily routine (same every weekday; Friday ends earlier)
  const GAN_ROUTINE = [
    { from: '07:30', to: '08:00', title: 'קבלת ילדים ומשחק חופשי', ico: '👋' },
    { from: '08:00', to: '08:30', title: 'מפגש בוקר במעגל', ico: '🌞' },
    { from: '08:30', to: '09:00', title: 'ארוחת בוקר', ico: '🥪' },
    { from: '09:00', to: '10:00', title: 'משחק בחצר', ico: '🛝' },
    { from: '10:00', to: '10:45', title: 'פעילות בקבוצות – יצירה, מדע ושפה', ico: '🎨' },
    { from: '10:45', to: '11:15', title: 'ארוחת פרי', ico: '🍎' },
    { from: '11:15', to: '12:15', title: 'משחק במרכזים וסיפור', ico: '📖' },
    { from: '12:15', to: '13:00', title: 'ארוחת צהריים ומפגש סיכום', ico: '🍲' },
    { from: '13:00', to: '14:00', title: 'איסוף הביתה / מעבר לצהרון', ico: '🏠' }
  ];

  window.MH_SEED = {
    version: 3,
    school: {
      name: 'מישור הנוף',
      fullName: 'בית הספר הממלכתי "מישור הנוף"',
      motto: 'להקשיב · להבין · לאהוב',
      grades: 'גני ילדים וכיתות א׳–ו׳',
      phone: '04-0000000',
      email: 'office@mishur-hanof.example',
      address: 'רחוב הנוף 1',
      hours: 'א׳–ה׳ 07:30–16:30 (כולל צהרון) · ו׳ 07:30–12:30'
    },
    user: null,
    gans: ['גן כלנית', 'גן רקפת', 'גן נרקיס'],
    classes: ['גן כלנית', 'גן רקפת', 'גן נרקיס', 'א1', 'א2', 'ב1', 'ב2', 'ג1', 'ג2', 'ד1', 'ד2', 'ה1', 'ה2', 'ו1', 'ו2'],
    subjects: SUBJECTS,
    periods: PERIODS,
    breaks: BREAKS,
    timetable: TIMETABLE,
    ganRoutine: GAN_ROUTINE,
    children: [
      { id: 'c1', name: 'נועם', classId: 'ד2' },
      { id: 'c2', name: 'מאיה', classId: 'גן כלנית' }
    ],
    students: ['נועם ישראלי', 'מאיה כהן', 'איתי לוי', 'שירה מזרחי', 'אורי פרץ', 'תמר אברהם', 'דניאל ביטון', 'יעל שפירא', 'עידו גולן', 'רוני דהן', 'אלה חדד', 'עומר וקנין', 'ליה אזולאי', 'גיא נחום', 'הילה רוזן', 'יונתן שטרן'],

    changes: [
      { id: 'ch1', date: day(0), period: 5, text: 'חינוך גופני – השיעור יתקיים באולם (גשם צפוי)' },
      { id: 'ch2', date: day(1), period: 6, text: 'מוזיקה – מבוטל, הכיתה תצא מוקדם ב-12:25' },
      { id: 'ch3', date: day(2), period: 3, text: 'אנגלית – מילוי מקום: המורה יעל' }
    ],

    homework: [
      { id: 'h1', subject: 'math', title: 'דף עבודה – כפל במאונך', desc: 'לפתור את כל התרגילים בדף שקיבלתם. אפשר להיעזר בלוח הכפל.', due: day(1), classId: 'ד2' },
      { id: 'h2', subject: 'english', title: 'ללמוד 10 מילים – Unit 3', desc: 'Animals: dog, cat, horse... להתאמן בקריאה ובכתיבה. בשבוע הבא בוחן קצר.', due: day(2), classId: 'ד2' },
      { id: 'h3', subject: 'science', title: 'להביא בקבוק פלסטיק ריק', desc: 'לניסוי "מחזור המים" בשיעור מדע. בקבוק של חצי ליטר, שטוף.', due: day(3), classId: 'ד2' },
      { id: 'h4', subject: 'moledet', title: 'עבודת שורשים – שאלון משפחתי', desc: 'לשאול את ההורים או הסבים: מאיפה הגיעה המשפחה? להביא תמונה אחת (העתק).', due: day(6), classId: 'ד2' },
      { id: 'h5', subject: 'hebrew', title: 'לקרוא פרק 3 בספר הקריאה', desc: 'ולכתוב 3 משפטים על מה שאהבתם בפרק.', due: day(-1), classId: 'ד2' },
      { id: 'h6', subject: 'tora', title: 'פרשת השבוע – ציור', desc: 'לצייר את הסיפור שלמדנו ולכתוב כותרת.', due: day(4), classId: 'ד2' }
    ],
    hwDone: ['h5'],

    events: [
      { id: 'e1', date: day(3), title: 'מבחן בחשבון – כפל וחילוק', type: 'exam', classId: 'ד2', subject: 'math' },
      { id: 'e2', date: day(8), title: 'בוחן מילים באנגלית', type: 'exam', classId: 'ד2', subject: 'english' },
      { id: 'e3', date: day(5), title: 'אסיפת הורים – כל הכיתות והגנים', type: 'meeting', classId: 'all', time: '18:30' },
      { id: 'e4', date: day(11), title: 'טיול שנתי – שמורת עין אפק', type: 'trip', classId: 'all' },
      { id: 'e5', date: day(15), title: 'יום ספורט בית ספרי', type: 'event', classId: 'all' },
      { id: 'e6', date: day(22), title: 'חופשה – אין לימודים (גם בגנים)', type: 'holiday', classId: 'all' },
      { id: 'e7', date: day(2), title: 'יום פיג׳מות בגן 🧸', type: 'event', classId: 'גן כלנית' },
      { id: 'e8', date: day(9), title: 'מסיבת סתיו בגן – הורים מוזמנים', type: 'event', classId: 'גן כלנית', time: '12:00' },
      { id: 'e9', date: day(1), title: 'הצגה בכיתה – "החולצה של אבא"', type: 'event', classId: 'ד2', time: '11:40' },
      { id: 'e10', date: day(18), title: 'מבחן בשפה – הבנת הנקרא', type: 'exam', classId: 'ד2', subject: 'hebrew' }
    ],

    grades: [
      { id: 'g1', subject: 'math', title: 'מבחן – חיבור וחיסור במאונך', score: 92, date: day(-40), weight: 2 },
      { id: 'g2', subject: 'math', title: 'בוחן – לוח הכפל', score: 96, date: day(-20), weight: 1 },
      { id: 'g3', subject: 'english', title: 'Test – Colors & Numbers', score: 88, date: day(-30), weight: 2 },
      { id: 'g4', subject: 'english', title: 'הקראה בעל פה', score: 95, date: day(-12), weight: 1 },
      { id: 'g5', subject: 'hebrew', title: 'הבנת הנקרא', score: 84, date: day(-25), weight: 2 },
      { id: 'g6', subject: 'hebrew', title: 'הכתבה', score: 78, date: day(-8), weight: 1 },
      { id: 'g7', subject: 'science', title: 'עבודה – בעלי חיים בחורף', score: 97, date: day(-9), weight: 1 },
      { id: 'g8', subject: 'moledet', title: 'מפת היישוב שלי', score: 90, date: day(-18), weight: 1 },
      { id: 'g9', subject: 'tora', title: 'בוחן – סיפורי בראשית', score: 86, date: day(-22), weight: 1 }
    ],

    attendance: [
      { id: 'a1', date: day(-3), period: 1, subject: 'life', type: 'late', note: '' },
      { id: 'a2', date: day(-10), period: 0, subject: 'all', type: 'justified', note: 'מחלה – דווח על ידי ההורים' },
      { id: 'a3', date: day(-17), period: 4, subject: 'math', type: 'absent', note: '' },
      { id: 'a4', date: day(-24), period: 1, subject: 'hebrew', type: 'late', note: '' }
    ],
    notes: [
      { id: 'n1', date: day(-2), subject: 'science', type: 'praise', text: 'עזר לחברים בניסוי והסביר יפה לכיתה ⭐' },
      { id: 'n2', date: day(-8), subject: 'english', type: 'praise', text: 'קרא באנגלית בקול רם – כל הכבוד!' },
      { id: 'n3', date: day(-14), subject: 'math', type: 'missing', text: 'שכח את המחברת בבית' }
    ],

    // Class / kindergarten diary – what happened today
    diary: [
      { id: 'd1', classId: 'גן כלנית', date: day(0), ico: '🍂', title: 'למדנו על הסתיו', text: 'יצאנו לחצר לאסוף עלים, מיינו אותם לפי צבעים והכנו קולאז׳ משותף. בסיפור שמענו את "הדביבון המשוטט".', author: 'הגננת שירה' },
      { id: 'd2', classId: 'גן כלנית', date: day(-1), ico: '🎵', title: 'מפגש מוזיקה', text: 'הכרנו כלי הקשה וניגנו יחד שיר על הגשם. מחר מביאים כובע לחצר.', author: 'הגננת שירה' },
      { id: 'd3', classId: 'ד2', date: day(0), ico: '🔬', title: 'ניסוי מים במדע', text: 'בדקנו אילו חפצים צפים ואילו שוקעים ורשמנו תחזיות. בחשבון התחלנו כפל במאונך.', author: 'מיכל אברהם' },
      { id: 'd4', classId: 'ד2', date: day(-2), ico: '📚', title: 'פינת קריאה חדשה', text: 'פתחנו פינת קריאה בכיתה! מוזמנים לתרום ספר ילדים שכבר קראתם.', author: 'מיכל אברהם' }
    ],

    // Who picks each child up – set by parents, seen by the teacher
    pickupPeople: {
      c1: ['אמא – רחל', 'אבא – דוד', 'סבתא רותי'],
      c2: ['אמא – רחל', 'אבא – דוד', 'סבתא רותי']
    },
    pickups: {},

    announcements: [
      { id: 'an1', title: 'יום הורים – רישום לשיחות', body: 'הרישום לשיחות אישיות עם המחנכות והגננות פתוח עד יום חמישי. ניתן לפנות למזכירות או לכתוב למחנכת דרך מסך ההודעות.', date: day(0), author: 'הנהלת בית הספר', audience: 'parents', pinned: true, cat: 'הנהלה' },
      { id: 'an2', title: 'אישורים לטיול השנתי', body: 'יש לחתום על אישור ההשתתפות ולשלם עד ' + day(6) + '. החתימה מתבצעת באפליקציה תחת "אישורים וטפסים".', date: day(-1), author: 'רכזת הטיולים', audience: 'parents', pinned: false, cat: 'טיולים' },
      { id: 'an3', title: 'בדיקת כינים – בקשה להורים', body: 'התגלו מקרי כינים בכמה כיתות וגנים. נבקש לבדוק את הילדים בבית ולטפל במידת הצורך. תודה על שיתוף הפעולה!', date: day(-1), author: 'אחות בית הספר', audience: 'parents', pinned: false, cat: 'בריאות' },
      { id: 'an4', title: 'צהרון – הרשמה לחודש הבא', body: 'ההרשמה לצהרון פתוחה עד ה-25 לחודש. הצהרון פועל בימים א׳–ה׳ עד 16:30 וכולל ארוחה חמה וחוגים.', date: day(-2), author: 'רכזת הצהרון', audience: 'parents', pinned: false, cat: 'צהרון' },
      { id: 'an5', title: 'שבוע הספר בבית הספר', body: 'בשבוע הבא הספרייה תהיה פתוחה בכל ההפסקות, ותגיע סופרת ילדים לפגוש את כיתות א׳–ו׳. מוזמנים להגיע בתחפושת של דמות מספר!', date: day(-4), author: 'הספרייה', audience: 'all', pinned: false, cat: 'תרבות' },
      { id: 'an6', title: 'מועדון רובוטיקה לכיתות ג׳–ו׳', body: 'בימי שלישי 13:15–14:30 בחדר המדעים. ההרשמה במסך "חוגים".', date: day(-3), author: 'אבי מזרחי', audience: 'students', pinned: false, cat: 'חוגים' }
    ],
    annRead: [],

    threads: [
      { id: 't1', with: 'מיכל אברהם', role: 'מחנכת ד2', unread: 1, msgs: [
        { from: 'them', text: 'שלום! רציתי לספר שנועם הצטיין השבוע בניסוי במדע 🙂', time: day(-1) + 'T16:20' }
      ] },
      { id: 't2', with: 'שירה גולן', role: 'גננת – גן כלנית', unread: 0, msgs: [
        { from: 'me', text: 'בוקר טוב, מאיה תיאסף היום על ידי סבתא רותי.', time: day(-2) + 'T07:40' },
        { from: 'them', text: 'תודה על העדכון! 🌸', time: day(-2) + 'T07:52' }
      ] },
      { id: 't3', with: 'מזכירות', role: 'משרד בית הספר', unread: 0, msgs: [
        { from: 'them', text: 'אישור הלימודים שביקשתם מוכן לאיסוף.', time: day(-6) + 'T10:00' }
      ] }
    ],

    permits: [
      { id: 'p1', title: 'טיול שנתי – שמורת עין אפק', desc: 'יציאה 08:00 מבית הספר, חזרה משוערת 13:30. יש להביא כובע, בקבוק מים, ארוחת עשר ונעליים סגורות.', due: day(6), cost: 120, signed: false, paid: false },
      { id: 'p2', title: 'הסכמה לצילום לאתר בית הספר', desc: 'אישור לפרסום תמונות מפעילויות בית הספר והגן באתר ובעלון.', due: day(14), cost: 0, signed: true, paid: true },
      { id: 'p3', title: 'הצהרת בריאות שנתית', desc: 'פרטי רגישויות, אלרגיות ותרופות קבועות. המידע מועבר לאחות ולצוות בלבד.', due: day(9), cost: 0, signed: false, paid: false },
      { id: 'p4', title: 'הצגה – תיאטרון לילדים', desc: 'הצגה לכיתות א׳–ג׳ ולגנים בבית הספר. השתתפות בעלות.', due: day(10), cost: 35, signed: false, paid: false }
    ],

    polls: [
      { id: 'po1', q: 'איזה חוג תרצו שייפתח בצהרון?', options: [{ t: 'קרמיקה', v: 34 }, { t: 'שחמט', v: 21 }, { t: 'מחול', v: 47 }, { t: 'בישול לילדים', v: 29 }], voted: null },
      { id: 'po2', q: 'איזה נושא יהיה ליום השיא של בית הספר?', options: [{ t: 'מסע בחלל 🚀', v: 88 }, { t: 'עולם החיות 🦁', v: 64 }, { t: 'ממציאים צעירים 💡', v: 51 }], voted: null }
    ],

    clubs: [
      { id: 'cl0', name: 'צהרון', when: 'א׳–ה׳ 13:10–16:30', where: 'אגף הצהרון', seats: 9, joined: false },
      { id: 'cl1', name: 'רובוטיקה (ג׳–ו׳)', when: 'ג׳ 13:15–14:30', where: 'חדר מדעים', seats: 6, joined: false },
      { id: 'cl2', name: 'מקהלת בית הספר', when: 'ב׳ 13:15–14:00', where: 'אולם', seats: 12, joined: false },
      { id: 'cl3', name: 'כדורגל', when: 'א׳+ד׳ 14:00–15:00', where: 'מגרש', seats: 3, joined: true },
      { id: 'cl4', name: 'שחמט', when: 'ה׳ 13:15–14:00', where: 'ספרייה', seats: 8, joined: false },
      { id: 'cl5', name: 'תגבור בחשבון (ג׳–ו׳)', when: 'ב׳+ד׳ 13:15–14:00', where: 'כיתה 12', seats: 10, joined: false }
    ],

    lostFound: [
      { id: 'l1', type: 'found', item: 'מעיל כחול מידה 10', place: 'חצר', date: day(-1), contact: 'מזכירות', done: false },
      { id: 'l2', type: 'lost', item: 'קופסת אוכל ורודה עם השם "שירה"', place: 'כיתה ב1', date: day(-2), contact: 'אמא של שירה, ב1', done: false },
      { id: 'l3', type: 'found', item: 'בקבוק מים עם מדבקות דינוזאורים', place: 'גן רקפת', date: day(-5), contact: 'הגננת', done: false }
    ],

    buses: [
      { id: 'b1', line: 'קו 1 – שכונת האלונים', stops: ['האלונים/הגפן 07:20', 'מרכז מסחרי 07:30', 'בית הספר 07:45'], back: '13:15 / 16:35 (צהרון)', driver: 'משה – 050-0000001', status: 'בזמן' },
      { id: 'b2', line: 'קו 2 – מושב נוף הגליל', stops: ['כניסה למושב 07:10', 'צומת הזיתים 07:25', 'בית הספר 07:45'], back: '13:15 / 16:35 (צהרון)', driver: 'חיים – 050-0000002', status: 'עיכוב 10 דק׳' }
    ],

    menu: [
      { d: 0, items: ['שניצל עוף', 'אורז', 'סלט ירקות', 'תפוח'] },
      { d: 1, items: ['פסטה ברוטב עגבניות', 'כדורי ירק', 'מלפפון ועגבנייה', 'בננה'] },
      { d: 2, items: ['קציצות עוף', 'פירה', 'שעועית ירוקה', 'תפוז'] },
      { d: 3, items: ['חביתה', 'פתיתים', 'סלט ישראלי', 'אגס'] },
      { d: 4, items: ['מוקפץ ירקות וטופו (צמחוני)', 'אטריות', 'גזר חתוך', 'ענבים'] },
      { d: 5, items: ['כריך גבינה + ירקות חתוכים', 'פרי עונה'] }
    ],

    library: [
      { id: 'lb1', title: 'שמונה ברגל אחת', author: 'אמנון שמוש', due: day(4) },
      { id: 'lb2', title: 'הנסיך הקטן', author: 'אנטואן דה סנט־אכזופרי', due: day(-1) }
    ],

    contacts: [
      { name: 'מזכירות בית הספר', role: 'משרד', phone: '04-0000000', email: 'office@mishur-hanof.example', group: 'הנהלה' },
      { name: 'ד"ר אורית נווה', role: 'מנהלת בית הספר', phone: '04-0000001', email: 'principal@mishur-hanof.example', group: 'הנהלה' },
      { name: 'שלומית גבאי', role: 'סגנית מנהלת', phone: '04-0000002', email: 'deputy@mishur-hanof.example', group: 'הנהלה' },
      { name: 'הדס רז', role: 'יועצת בית הספר והגנים', phone: '04-0000003', email: 'counselor@mishur-hanof.example', group: 'רווחה' },
      { name: 'ענת מור', role: 'אחות בית הספר', phone: '04-0000004', email: 'nurse@mishur-hanof.example', group: 'רווחה' },
      { name: 'לימור אוחיון', role: 'רכזת הצהרון', phone: '050-0000030', email: 'afterschool@mishur-hanof.example', group: 'רווחה' },
      { name: 'שירה גולן', role: 'גננת – גן כלנית', phone: '050-0000021', email: 'gan.kalanit@mishur-hanof.example', group: 'גנים' },
      { name: 'אורנה בן דוד', role: 'גננת – גן רקפת', phone: '050-0000022', email: 'gan.rakefet@mishur-hanof.example', group: 'גנים' },
      { name: 'סיגל עמר', role: 'גננת – גן נרקיס', phone: '050-0000023', email: 'gan.narkis@mishur-hanof.example', group: 'גנים' },
      { name: 'מיכל אברהם', role: 'מחנכת ד2 · שפה', phone: '050-0000010', email: 'michal.a@mishur-hanof.example', group: 'צוות' },
      { name: 'דנה כהן', role: 'חשבון', phone: '050-0000011', email: 'dana.c@mishur-hanof.example', group: 'צוות' },
      { name: 'רונית לוי', role: 'תורה וספרייה', phone: '050-0000012', email: 'ronit.l@mishur-hanof.example', group: 'צוות' },
      { name: 'Sarah Miller', role: 'אנגלית', phone: '050-0000013', email: 'sarah.m@mishur-hanof.example', group: 'צוות' },
      { name: 'אבי מזרחי', role: 'מדע וטכנולוגיה', phone: '050-0000014', email: 'avi.m@mishur-hanof.example', group: 'צוות' },
      { name: 'יוסי פרץ', role: 'מולדת וחברה', phone: '050-0000015', email: 'yossi.p@mishur-hanof.example', group: 'צוות' },
      { name: 'עומר שלום', role: 'חינוך גופני', phone: '050-0000016', email: 'omer.s@mishur-hanof.example', group: 'צוות' },
      { name: 'יו"ר ועד ההורים', role: 'ועד הורים', phone: '050-0000020', email: 'parents@mishur-hanof.example', group: 'קהילה' }
    ],

    counsel: [],
    absenceReports: []
  };
})();
