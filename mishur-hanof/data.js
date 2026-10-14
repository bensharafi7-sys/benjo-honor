// Seed data for the Mishur HaNof app. Dates are relative to today so the demo always looks current.
// In production this would come from the school's backend (Mashov / Smart School / custom API).
(function () {
  const iso = d => d.toISOString().slice(0, 10);
  const day = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return iso(d); };

  const SUBJECTS = {
    math:    { name: 'מתמטיקה',     color: '#3b82f6', teacher: 'דנה כהן' },
    hebrew:  { name: 'לשון',          color: '#ef4444', teacher: 'רונית לוי' },
    english: { name: 'אנגלית',        color: '#8b5cf6', teacher: 'Sarah Miller' },
    science: { name: 'מדע וטכנולוגיה', color: '#10b981', teacher: 'אבי מזרחי' },
    history: { name: 'היסטוריה',      color: '#f59e0b', teacher: 'יוסי פרץ' },
    bible:   { name: 'תנ"ך',          color: '#a16207', teacher: 'מיכל אברהם' },
    lit:     { name: 'ספרות',         color: '#ec4899', teacher: 'רונית לוי' },
    geo:     { name: 'גאוגרפיה',      color: '#14b8a6', teacher: 'יוסי פרץ' },
    pe:      { name: 'חינוך גופני',   color: '#f97316', teacher: 'עומר שלום' },
    art:     { name: 'אמנות',          color: '#d946ef', teacher: 'נועה ברק' },
    civics:  { name: 'חינוך / שעת כיתה', color: '#64748b', teacher: 'מיכל אברהם' },
    cs:      { name: 'מדעי המחשב',    color: '#0ea5e9', teacher: 'אבי מזרחי' }
  };

  const PERIODS = [
    { n: 1, from: '08:00', to: '08:45' },
    { n: 2, from: '08:45', to: '09:30' },
    { n: 3, from: '09:50', to: '10:35' },
    { n: 4, from: '10:35', to: '11:20' },
    { n: 5, from: '11:40', to: '12:25' },
    { n: 6, from: '12:25', to: '13:10' },
    { n: 7, from: '13:20', to: '14:05' },
    { n: 8, from: '14:05', to: '14:50' }
  ];
  const BREAKS = [
    { after: 2, label: 'הפסקה גדולה', from: '09:30', to: '09:50' },
    { after: 4, label: 'הפסקת אוכל', from: '11:20', to: '11:40' },
    { after: 6, label: 'הפסקה', from: '13:10', to: '13:20' }
  ];

  // index 0 = Sunday ... 5 = Friday
  const TIMETABLE = {
    0: ['civics', 'math', 'math', 'hebrew', 'english', 'science', 'history'],
    1: ['english', 'english', 'bible', 'math', 'pe', 'pe', 'lit', 'art'],
    2: ['science', 'science', 'math', 'hebrew', 'geo', 'cs', 'cs'],
    3: ['math', 'bible', 'english', 'history', 'lit', 'hebrew', 'science'],
    4: ['hebrew', 'math', 'geo', 'english', 'art', 'civics', 'pe'],
    5: ['bible', 'math', 'lit', 'civics']
  };

  window.MH_SEED = {
    version: 1,
    school: {
      name: 'מישור הנוף',
      motto: 'רואים רחוק – צומחים יחד',
      phone: '04-0000000',
      email: 'office@mishur-hanof.example',
      address: 'רחוב הנוף 1',
      hours: 'א׳–ה׳ 07:30–15:30 · ו׳ 07:30–12:30'
    },
    user: null,
    classes: ['ז1', 'ז2', 'ח1', 'ח2', 'ט1', 'ט2'],
    subjects: SUBJECTS,
    periods: PERIODS,
    breaks: BREAKS,
    timetable: TIMETABLE,
    children: [
      { id: 'c1', name: 'נועם', classId: 'ח2' },
      { id: 'c2', name: 'מאיה', classId: 'ז1' }
    ],
    students: ['נועם ישראלי', 'מאיה כהן', 'איתי לוי', 'שירה מזרחי', 'אורי פרץ', 'תמר אברהם', 'דניאל ביטון', 'יעל שפירא', 'עידו גולן', 'רוני דהן', 'אלה חדד', 'עומר וקנין', 'ליה אזולאי', 'גיא נחום', 'הילה רוזן', 'יונתן שטרן'],

    changes: [
      { id: 'ch1', date: day(0), period: 5, text: 'אנגלית – השיעור יתקיים בחדר מחשבים 2' },
      { id: 'ch2', date: day(1), period: 7, text: 'ספרות – מבוטל (המורה בהשתלמות)' },
      { id: 'ch3', date: day(2), period: 3, text: 'מתמטיקה – מילוי מקום: מר אבי מזרחי' }
    ],

    homework: [
      { id: 'h1', subject: 'math', title: 'תרגילים 1–15 עמ׳ 42', desc: 'משוואות עם נעלם אחד. להראות את דרך הפתרון.', due: day(1), classId: 'ח2', attach: '' },
      { id: 'h2', subject: 'english', title: 'Reading – Unit 4', desc: 'Read the story "The Lighthouse" and answer questions 1–6.', due: day(2), classId: 'ח2', attach: '' },
      { id: 'h3', subject: 'science', title: 'דו"ח מעבדה – צמיחת שעועית', desc: 'לצרף טבלת מדידות וגרף. הגשה בזוגות.', due: day(4), classId: 'ח2', attach: '' },
      { id: 'h4', subject: 'history', title: 'סיכום פרק 3 – המהפכה התעשייתית', desc: 'עד עמוד אחד, בכתב יד או מודפס.', due: day(6), classId: 'ח2', attach: '' },
      { id: 'h5', subject: 'lit', title: 'שיר "הנה מה טוב" – ניתוח', desc: 'לזהות שלושה אמצעים אמנותיים ולהסביר.', due: day(-1), classId: 'ח2', attach: '' },
      { id: 'h6', subject: 'bible', title: 'שמואל א׳ פרק י"ז', desc: 'לקרוא ולענות על שאלות 1–4 בחוברת.', due: day(3), classId: 'ח2', attach: '' }
    ],
    hwDone: ['h5'],

    events: [
      { id: 'e1', date: day(3), title: 'מבחן במתמטיקה – משוואות', type: 'exam', classId: 'ח2', subject: 'math' },
      { id: 'e2', date: day(8), title: 'בוחן באנגלית – Unit 3–4', type: 'exam', classId: 'ח2', subject: 'english' },
      { id: 'e3', date: day(5), title: 'אסיפת הורים שכבת ח׳', type: 'meeting', classId: 'all', time: '18:00' },
      { id: 'e4', date: day(11), title: 'טיול שנתי – מכתש רמון', type: 'trip', classId: 'all' },
      { id: 'e5', date: day(15), title: 'יום ספורט בית ספרי', type: 'event', classId: 'all' },
      { id: 'e6', date: day(19), title: 'מבחן בהיסטוריה', type: 'exam', classId: 'ח2', subject: 'history' },
      { id: 'e7', date: day(22), title: 'חופשה – אין לימודים', type: 'holiday', classId: 'all' },
      { id: 'e8', date: day(1), title: 'הצגה בכיתה – "הנסיך הקטן"', type: 'event', classId: 'ח2', time: '12:25' }
    ],

    grades: [
      { id: 'g1', subject: 'math', title: 'מבחן – שברים', score: 88, date: day(-40), weight: 2 },
      { id: 'g2', subject: 'math', title: 'בוחן – אחוזים', score: 94, date: day(-20), weight: 1 },
      { id: 'g3', subject: 'english', title: 'Test – Unit 2', score: 91, date: day(-30), weight: 2 },
      { id: 'g4', subject: 'english', title: 'Oral presentation', score: 97, date: day(-12), weight: 1 },
      { id: 'g5', subject: 'hebrew', title: 'מבחן – תחביר', score: 79, date: day(-25), weight: 2 },
      { id: 'g6', subject: 'science', title: 'מבחן – תאים', score: 85, date: day(-35), weight: 2 },
      { id: 'g7', subject: 'science', title: 'פרויקט מעבדה', score: 95, date: day(-9), weight: 1 },
      { id: 'g8', subject: 'history', title: 'עבודה – יוון העתיקה', score: 90, date: day(-18), weight: 1 },
      { id: 'g9', subject: 'bible', title: 'מבחן – ספר יהושע', score: 82, date: day(-22), weight: 2 },
      { id: 'g10', subject: 'lit', title: 'חיבור', score: 87, date: day(-15), weight: 1 },
      { id: 'g11', subject: 'geo', title: 'בוחן מפות', score: 76, date: day(-6), weight: 1 }
    ],

    attendance: [
      { id: 'a1', date: day(-3), period: 1, subject: 'civics', type: 'late', note: '' },
      { id: 'a2', date: day(-10), period: 4, subject: 'hebrew', type: 'absent', note: '' },
      { id: 'a3', date: day(-10), period: 5, subject: 'english', type: 'absent', note: '' },
      { id: 'a4', date: day(-17), period: 0, subject: 'all', type: 'justified', note: 'מחלה – אישור רופא' },
      { id: 'a5', date: day(-24), period: 2, subject: 'math', type: 'late', note: '' }
    ],
    // Positive feedback / discipline notes from teachers
    notes: [
      { id: 'n1', date: day(-2), subject: 'science', type: 'praise', text: 'השתתפות פעילה ועזרה לחברים בניסוי' },
      { id: 'n2', date: day(-8), subject: 'english', type: 'praise', text: 'מצגת מצוינת!' },
      { id: 'n3', date: day(-14), subject: 'math', type: 'missing', text: 'לא הביא ציוד (מחשבון)' }
    ],

    announcements: [
      { id: 'an1', title: 'יום הורים – רישום לשיחות', body: 'הרישום לשיחות אישיות עם המחנכות פתוח עד יום חמישי. ניתן לבחור מועד דרך מסך "אירועים" או לפנות למזכירות.', date: day(0), author: 'הנהלת בית הספר', audience: 'all', pinned: true, cat: 'הנהלה' },
      { id: 'an2', title: 'אישורי השתתפות לטיול השנתי', body: 'יש לחתום על אישור ההשתתפות ולשלם עד ' + day(6) + '. החתימה מתבצעת באפליקציה תחת "אישורים וטפסים".', date: day(-1), author: 'רכזת שכבה', audience: 'parents', pinned: false, cat: 'טיולים' },
      { id: 'an3', title: 'מועדון רובוטיקה נפתח!', body: 'בימי שלישי 14:00–15:30 בחדר המייקרים. מתאים לכיתות ז׳–ט׳. הרשמה במזכירות או באפליקציה (חוגים).', date: day(-2), author: 'אבי מזרחי', audience: 'students', pinned: false, cat: 'חוגים' },
      { id: 'an4', title: 'שבוע הספר העברי', body: 'בשבוע הבא הספרייה תהיה פתוחה בכל ההפסקות, ויתקיים מפגש עם סופרת אורחת ביום רביעי.', date: day(-4), author: 'הספרייה', audience: 'all', pinned: false, cat: 'תרבות' }
    ],
    annRead: [],

    threads: [
      { id: 't1', with: 'מיכל אברהם', role: 'מחנכת ח2', unread: 1, msgs: [
        { from: 'them', text: 'שלום! רציתי לעדכן שנועם הצטיין השבוע בשיעור חינוך 🙂', time: day(-1) + 'T16:20' }
      ] },
      { id: 't2', with: 'דנה כהן', role: 'מתמטיקה', unread: 0, msgs: [
        { from: 'me', text: 'שלום, האם המבחן יכלול גם את פרק השברים?', time: day(-3) + 'T18:02' },
        { from: 'them', text: 'לא, רק משוואות. בהצלחה!', time: day(-3) + 'T19:15' }
      ] },
      { id: 't3', with: 'מזכירות', role: 'משרד בית הספר', unread: 0, msgs: [
        { from: 'them', text: 'אישור הלימודים שביקשתם מוכן לאיסוף.', time: day(-6) + 'T10:00' }
      ] }
    ],

    permits: [
      { id: 'p1', title: 'טיול שנתי – מכתש רמון', desc: 'יציאה 06:30 מחניון בית הספר, חזרה משוערת 19:00. יש להביא 3 ליטר מים, כובע ונעלי הליכה.', due: day(6), cost: 280, signed: false, paid: false },
      { id: 'p2', title: 'הסכמה לצילום לאתר בית הספר', desc: 'אישור לפרסום תמונות מפעילויות בית הספר באתר ובעלון.', due: day(14), cost: 0, signed: true, paid: true },
      { id: 'p3', title: 'הצגה – תיאטרון הקאמרי', desc: 'הסעה ושובר כניסה. יציאה בשעה 09:00.', due: day(9), cost: 65, signed: false, paid: false }
    ],

    polls: [
      { id: 'po1', q: 'איזה חוג תרצו שייפתח בסמסטר הבא?', options: [{ t: 'צילום', v: 34 }, { t: 'שחמט', v: 21 }, { t: 'מוזיקה ולהקה', v: 47 }, { t: 'בישול', v: 29 }], voted: null },
      { id: 'po2', q: 'האם להאריך את הפסקת האוכל ל-25 דקות?', options: [{ t: 'כן', v: 112 }, { t: 'לא', v: 18 }], voted: null }
    ],

    clubs: [
      { id: 'cl1', name: 'רובוטיקה', when: 'ג׳ 14:00–15:30', where: 'חדר מייקרים', seats: 6, joined: false },
      { id: 'cl2', name: 'מקהלה', when: 'ב׳ 14:00–15:00', where: 'אולם', seats: 12, joined: false },
      { id: 'cl3', name: 'כדורסל', when: 'א׳+ד׳ 15:00–16:30', where: 'אולם ספורט', seats: 3, joined: true },
      { id: 'cl4', name: 'עיתון בית הספר', when: 'ה׳ 14:00–15:00', where: 'ספרייה', seats: 8, joined: false },
      { id: 'cl5', name: 'שיעורי עזר במתמטיקה', when: 'ב׳+ד׳ 14:10–14:55', where: 'כיתה 12', seats: 10, joined: false }
    ],

    lostFound: [
      { id: 'l1', type: 'found', item: 'מעיל כחול מידה 14', place: 'אולם ספורט', date: day(-1), contact: 'מזכירות', done: false },
      { id: 'l2', type: 'lost', item: 'קלמר ירוק עם שם "שירה"', place: 'חצר / ספסלים', date: day(-2), contact: 'שירה, ח1', done: false },
      { id: 'l3', type: 'found', item: 'בקבוק מים ורוד', place: 'ספרייה', date: day(-5), contact: 'ספרייה', done: false }
    ],

    buses: [
      { id: 'b1', line: 'קו 1 – שכונת האלונים', stops: ['האלונים/הגפן 07:15', 'מרכז מסחרי 07:25', 'בית הספר 07:40'], back: '13:15 / 14:55', driver: 'משה – 050-0000001', status: 'בזמן' },
      { id: 'b2', line: 'קו 2 – מושב נוף הגליל', stops: ['כניסה למושב 07:05', 'צומת הזיתים 07:20', 'בית הספר 07:42'], back: '13:15 / 14:55', driver: 'חיים – 050-0000002', status: 'עיכוב 10 דק׳' },
      { id: 'b3', line: 'קו 3 – רמת השקד', stops: ['השקד/הרימון 07:20', 'פארק העיר 07:30', 'בית הספר 07:45'], back: '13:15 / 14:55', driver: 'רינה – 050-0000003', status: 'בזמן' }
    ],

    menu: [
      { d: 0, items: ['שניצל עוף', 'אורז', 'סלט ירקות', 'תפוח'] },
      { d: 1, items: ['פסטה ברוטב עגבניות', 'כדורי ירק', 'סלט כרוב', 'בננה'] },
      { d: 2, items: ['קציצות בקר', 'פירה', 'שעועית ירוקה', 'תפוז'] },
      { d: 3, items: ['חזה עוף בגריל', 'בורגול', 'סלט ישראלי', 'אגס'] },
      { d: 4, items: ['מוקפץ טופו וירקות (צמחוני)', 'אטריות', 'מלפפון', 'ענבים'] },
      { d: 5, items: ['כריך + ירקות חתוכים', 'פרי עונה'] }
    ],

    library: [
      { id: 'lb1', title: 'הנסיך הקטן', author: 'אנטואן דה סנט־אכזופרי', due: day(4) },
      { id: 'lb2', title: 'הארי פוטר ואבן החכמים', author: 'ג׳.ק. רולינג', due: day(-1) }
    ],

    contacts: [
      { name: 'מזכירות בית הספר', role: 'משרד', phone: '04-0000000', email: 'office@mishur-hanof.example', group: 'הנהלה' },
      { name: 'ד"ר אורית נווה', role: 'מנהלת בית הספר', phone: '04-0000001', email: 'principal@mishur-hanof.example', group: 'הנהלה' },
      { name: 'שלומית גבאי', role: 'סגנית מנהלת', phone: '04-0000002', email: 'deputy@mishur-hanof.example', group: 'הנהלה' },
      { name: 'הדס רז', role: 'יועצת שכבות ז׳–ח׳', phone: '04-0000003', email: 'counselor@mishur-hanof.example', group: 'רווחה' },
      { name: 'ענת מור', role: 'אחות בית הספר', phone: '04-0000004', email: 'nurse@mishur-hanof.example', group: 'רווחה' },
      { name: 'מיכל אברהם', role: 'מחנכת ח2 · תנ"ך', phone: '050-0000010', email: 'michal.a@mishur-hanof.example', group: 'צוות' },
      { name: 'דנה כהן', role: 'מתמטיקה', phone: '050-0000011', email: 'dana.c@mishur-hanof.example', group: 'צוות' },
      { name: 'רונית לוי', role: 'לשון וספרות', phone: '050-0000012', email: 'ronit.l@mishur-hanof.example', group: 'צוות' },
      { name: 'Sarah Miller', role: 'אנגלית', phone: '050-0000013', email: 'sarah.m@mishur-hanof.example', group: 'צוות' },
      { name: 'אבי מזרחי', role: 'מדעים ומדעי המחשב', phone: '050-0000014', email: 'avi.m@mishur-hanof.example', group: 'צוות' },
      { name: 'יוסי פרץ', role: 'היסטוריה וגאוגרפיה', phone: '050-0000015', email: 'yossi.p@mishur-hanof.example', group: 'צוות' },
      { name: 'עומר שלום', role: 'חינוך גופני', phone: '050-0000016', email: 'omer.s@mishur-hanof.example', group: 'צוות' },
      { name: 'יו"ר ועד ההורים', role: 'ועד הורים', phone: '050-0000020', email: 'parents@mishur-hanof.example', group: 'קהילה' }
    ],

    counsel: [],
    absenceReports: [],
    feed: []
  };
})();
