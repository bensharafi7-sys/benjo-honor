/* מישור הנוף – School app
 * Single-page PWA, vanilla JS. State lives in localStorage (demo mode);
 * every mutation goes through save() so a real backend can be wired in one place. */
(function () {
  'use strict';

  const KEY = 'mh_state_v1';
  const PREFS_KEY = 'mh_prefs_v1';

  // ---------- State ----------
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.version === MH_SEED.version) return s;
      }
    } catch (e) { /* storage unavailable – fall back to seed */ }
    return JSON.parse(JSON.stringify(MH_SEED));
  }
  let S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }

  let P = { theme: 'auto', bigText: false, notifyHw: true, notifyExams: true, notifyMsgs: true, childId: 'c1' };
  try { Object.assign(P, JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')); } catch (e) { /* ignore */ }
  function savePrefs() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(P)); } catch (e) { /* ignore */ } applyPrefs(); }
  function applyPrefs() {
    const r = document.documentElement;
    if (P.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', P.theme);
    r.classList.toggle('big-text', !!P.bigText);
  }

  // ---------- Helpers ----------
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const todayISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const parseISO = s => { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const daysFrom = s => Math.round((parseISO(s) - parseISO(todayISO())) / 864e5);
  const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const DAYS_S = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const fmtDate = s => { const d = parseISO(s); return `${DAYS[d.getDay()]}, ${d.getDate()} ב${MONTHS[d.getMonth()]}`; };
  const fmtShort = s => { const d = parseISO(s); return `${d.getDate()}.${d.getMonth() + 1}`; };
  function rel(s) {
    const n = daysFrom(s);
    if (n === 0) return 'היום';
    if (n === 1) return 'מחר';
    if (n === -1) return 'אתמול';
    if (n === 2) return 'מחרתיים';
    if (n > 0 && n < 7) return `בעוד ${n} ימים`;
    if (n < 0 && n > -7) return `לפני ${-n} ימים`;
    return fmtShort(s);
  }
  const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const nowMins = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const subj = k => S.subjects[k] || { name: k, color: '#64748b', teacher: '' };
  const role = () => S.user && S.user.role;
  const isParent = () => role() === 'parent';
  const isTeacher = () => role() === 'teacher';
  const isAdmin = () => role() === 'admin';
  const isStaff = () => isTeacher() || isAdmin();
  const child = () => S.children.find(c => c.id === P.childId) || S.children[0];
  const myClass = () => isParent() ? child().classId : (S.user && S.user.classId) || 'ח2';
  const firstName = () => (S.user && S.user.name || '').split(' ')[0];

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.add('hidden'), 2400);
  }

  function openSheet(html) {
    $('#sheetContent').innerHTML = html;
    $('#sheet').classList.remove('hidden');
    const f = $('#sheetContent').querySelector('input,textarea,select');
    if (f && window.matchMedia('(pointer:fine)').matches) f.focus();
  }
  function closeSheet() { $('#sheet').classList.add('hidden'); $('#sheetContent').innerHTML = ''; }

  const ROLES = {
    student: { label: 'תלמיד/ה', ico: '🎒', desc: 'מערכת שעות, שיעורי בית, ציונים וחוגים' },
    parent:  { label: 'הורה',     ico: '👨‍👩‍👧', desc: 'מעקב אחרי הילדים, אישורים, דיווח היעדרות' },
    teacher: { label: 'מורה',     ico: '🧑‍🏫', desc: 'נוכחות, משימות, ציונים והודעות לכיתה' },
    admin:   { label: 'הנהלה / מזכירות', ico: '🏫', desc: 'לוח בקרה, פרסום הודעות, פניות וסקרים' }
  };

  // ---------- Derived data ----------
  function classItems(list) { const c = myClass(); return list.filter(x => !x.classId || x.classId === 'all' || x.classId === c); }
  function upcomingHw() { return classItems(S.homework).filter(h => daysFrom(h.due) >= -1).sort((a, b) => a.due.localeCompare(b.due)); }
  function openHw() { return upcomingHw().filter(h => !S.hwDone.includes(h.id) && daysFrom(h.due) >= 0); }
  function upcomingEvents(n = 30) { return classItems(S.events).filter(e => { const d = daysFrom(e.date); return d >= 0 && d <= n; }).sort((a, b) => a.date.localeCompare(b.date)); }
  function audienceOk(a) {
    if (isStaff() || a.audience === 'all') return true;
    return (a.audience === 'parents' && isParent()) || (a.audience === 'students' && role() === 'student');
  }
  function visibleAnn() { return S.announcements.filter(audienceOk).sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date)); }
  function unreadAnn() { return visibleAnn().filter(a => !S.annRead.includes(a.id)).length; }
  function unreadMsgs() { return S.threads.reduce((n, t) => n + (t.unread || 0), 0); }
  function changesFor(date) { return S.changes.filter(c => c.date === date); }

  function subjectAverages() {
    const by = {};
    S.grades.forEach(g => { (by[g.subject] = by[g.subject] || []).push(g); });
    return Object.entries(by).map(([k, gs]) => {
      const w = gs.reduce((s, g) => s + g.weight, 0);
      return { k, avg: gs.reduce((s, g) => s + g.score * g.weight, 0) / w, count: gs.length };
    }).sort((a, b) => b.avg - a.avg);
  }
  function overallAvg(avgs = subjectAverages()) { return avgs.length ? avgs.reduce((s, a) => s + a.avg, 0) / avgs.length : 0; }
  const gradeColor = n => n >= 90 ? 'var(--ok)' : n >= 75 ? 'var(--brand)' : n >= 60 ? 'var(--warn)' : 'var(--danger)';

  function currentLesson() {
    const dow = new Date().getDay();
    const lessons = S.timetable[dow];
    if (!lessons) return { state: 'off' };
    const m = nowMins();
    for (let i = 0; i < lessons.length; i++) {
      const p = S.periods[i];
      if (m >= mins(p.from) && m < mins(p.to)) return { state: 'in', i, p, k: lessons[i], next: lessons[i + 1], nextP: S.periods[i + 1], pct: (m - mins(p.from)) / (mins(p.to) - mins(p.from)) };
      if (m < mins(p.from)) return { state: 'before', i, p, k: lessons[i] };
    }
    return { state: 'done' };
  }

  function alerts() {
    const a = [];
    const hw = openHw().filter(h => daysFrom(h.due) <= 1);
    if (P.notifyHw && hw.length) a.push({ ico: '📝', text: `${hw.length} משימות להגשה עד מחר`, go: 'tasks' });
    if (P.notifyExams) upcomingEvents(4).filter(e => e.type === 'exam').forEach(e => a.push({ ico: '🧪', text: `${e.title} – ${rel(e.date)}`, go: 'calendar' }));
    const ch = changesFor(todayISO()).concat(changesFor(addDaysISO(1)));
    ch.forEach(c => a.push({ ico: '🔄', text: `שינוי במערכת (${rel(c.date)}, שיעור ${c.period}): ${c.text}`, go: 'schedule' }));
    if (unreadAnn()) a.push({ ico: '📢', text: `${unreadAnn()} הודעות חדשות מבית הספר`, go: 'news' });
    if (P.notifyMsgs && unreadMsgs()) a.push({ ico: '💬', text: `${unreadMsgs()} הודעות שלא נקראו`, go: 'messages' });
    if (isParent()) { const p = S.permits.filter(x => !x.signed).length; if (p) a.push({ ico: '✍️', text: `${p} אישורים ממתינים לחתימה`, go: 'permits' }); }
    if (!isStaff()) S.library.filter(b => daysFrom(b.due) < 0).forEach(b => a.push({ ico: '📚', text: `החזרת ספר באיחור: ${b.title}`, go: 'library' }));
    if (isAdmin()) { const c = S.counsel.filter(x => !x.handled).length; if (c) a.push({ ico: '💚', text: `${c} פניות חדשות ל"אוזן קשבת"`, go: 'inbox' }); }
    if (isStaff()) { const r = S.absenceReports.filter(x => !x.seen).length; if (r) a.push({ ico: '🏠', text: `${r} דיווחי היעדרות מהורים`, go: 'inbox' }); }
    return a;
  }
  function addDaysISO(n) { const d = parseISO(todayISO()); d.setDate(d.getDate() + n); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }

  // ---------- UI fragments ----------
  const EVT = {
    exam: { label: 'מבחן', c: '#ef4444', ico: '🧪' },
    event: { label: 'אירוע', c: '#3b82f6', ico: '🎉' },
    trip: { label: 'טיול', c: '#10b981', ico: '🚌' },
    meeting: { label: 'אסיפה', c: '#8b5cf6', ico: '👥' },
    holiday: { label: 'חופשה', c: '#f59e0b', ico: '🏖️' }
  };

  function hwRow(h) {
    const done = S.hwDone.includes(h.id);
    const n = daysFrom(h.due);
    const dueBadge = done ? '<span class="badge green">הוגש</span>'
      : n < 0 ? '<span class="badge red">באיחור</span>'
      : n <= 1 ? `<span class="badge amber">${rel(h.due)}</span>`
      : `<span class="badge gray">${rel(h.due)}</span>`;
    const s = subj(h.subject);
    return `<li class="row ${done ? 'done' : ''}">
      ${isStaff() ? `<span class="swatch" style="background:${s.color}"></span>` : `<button class="check ${done ? 'on' : ''}" data-act="toggleHw" data-id="${h.id}" aria-label="סמן כהוגש">${done ? '✓' : ''}</button>`}
      <button class="rowbtn" data-act="hwDetail" data-id="${h.id}">
        <div class="grow"><div class="title ellipsis">${esc(h.title)}</div><div class="meta">${esc(s.name)}${isStaff() ? ' · ' + esc(h.classId) : ''}</div></div>
        ${dueBadge}
      </button></li>`;
  }

  function eventRow(e) {
    const t = EVT[e.type] || EVT.event;
    const n = daysFrom(e.date);
    return `<li class="row">
      <div class="ico-circle" style="background:${t.c}22">${t.ico}</div>
      <div class="grow"><div class="title">${esc(e.title)}</div><div class="meta">${fmtDate(e.date)}${e.time ? ' · ' + esc(e.time) : ''}</div></div>
      <span class="badge ${n <= 3 ? 'amber' : 'gray'}">${rel(e.date)}</span></li>`;
  }

  function annRow(a) {
    const unread = !S.annRead.includes(a.id);
    return `<li class="row"><button class="rowbtn" data-go="news/${a.id}">
      <div class="ico-circle">${a.pinned ? '📌' : '📢'}</div>
      <div class="grow"><div class="title ellipsis">${unread ? '● ' : ''}${esc(a.title)}</div><div class="meta ellipsis">${esc(a.author)} · ${rel(a.date)}</div></div>
      <span class="badge gray">${esc(a.cat || '')}</span></button></li>`;
  }

  function sectionList(items, fn, emptyText) {
    if (!items.length) return `<div class="card empty"><div class="e">✨</div>${emptyText}</div>`;
    return `<div class="card"><ul class="list">${items.map(fn).join('')}</ul></div>`;
  }

  // ---------- Pages ----------
  const PAGES = {};

  PAGES.onboard = () => {
    const sel = PAGES.onboard.sel || 'student';
    return `<div class="onboard">
      <div class="logo"><img src="icon.svg" alt="סמל מישור הנוף"><h1>ברוכים הבאים למישור הנוף</h1><p class="sub">${esc(S.school.motto)}</p></div>
      <div class="card">
        <b>מי נכנס/ת?</b>
        ${Object.entries(ROLES).map(([k, r]) => `<button class="role-card ${sel === k ? 'on' : ''}" data-act="pickRole" data-id="${k}">
          <span class="ico-circle">${r.ico}</span><span><b>${r.label}</b><br><small class="meta">${r.desc}</small></span></button>`).join('')}
        <label class="f" for="obName">שם מלא</label>
        <input id="obName" class="input" placeholder="${sel === 'teacher' ? 'מיכל אברהם' : sel === 'parent' ? 'רחל ישראלי' : sel === 'admin' ? 'שלומית גבאי' : 'נועם ישראלי'}" autocomplete="name">
        ${sel === 'student' || sel === 'teacher' ? `<label class="f" for="obClass">${sel === 'teacher' ? 'כיתת חינוך' : 'כיתה'}</label>
          <select id="obClass" class="input">${S.classes.map(c => `<option ${c === 'ח2' ? 'selected' : ''}>${c}</option>`).join('')}</select>` : ''}
        <button class="btn block" style="margin-top:16px" data-act="finishOnboard">כניסה</button>
        <p class="meta" style="text-align:center;margin:10px 0 0">גרסת הדגמה · הנתונים נשמרים במכשיר בלבד</p>
      </div></div>`;
  };

  PAGES.home = () => {
    if (isTeacher()) return PAGES.teacherHome();
    if (isAdmin()) return PAGES.adminHome();
    const cl = currentLesson();
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב';
    let nowHtml;
    if (cl.state === 'in') {
      nowHtml = `<small>עכשיו · שיעור ${cl.p.n} · <bdi dir="ltr">${cl.p.from}–${cl.p.to}</bdi></small><b>${esc(subj(cl.k).name)}</b>
        <small>${esc(subj(cl.k).teacher)}${cl.next ? ` · אחר כך: ${esc(subj(cl.next).name)}` : ' · שיעור אחרון להיום'}</small>
        <div class="progress"><i style="width:${Math.round(cl.pct * 100)}%"></i></div>`;
    } else if (cl.state === 'before') {
      nowHtml = `<small>השיעור הבא · ${cl.p.from}</small><b>${esc(subj(cl.k).name)}</b><small>${esc(subj(cl.k).teacher)}</small>`;
    } else if (cl.state === 'done') {
      nowHtml = `<small>הלימודים להיום הסתיימו</small><b>${openHw().length ? `נשארו ${openHw().length} משימות פתוחות` : 'אין משימות פתוחות 🎉'}</b>`;
    } else {
      nowHtml = `<small>סוף שבוע</small><b>שבת שלום! 🌄</b><small>נתראה ביום ראשון</small>`;
    }
    const kid = isParent() ? `<div class="chips" style="margin:12px 0 0">${S.children.map(c => `<button class="chip ${c.id === child().id ? 'on' : ''}" data-act="pickChild" data-id="${c.id}">${esc(c.name)} · ${esc(c.classId)}</button>`).join('')}</div>` : '';
    const avg = overallAvg();
    const att = S.attendance.filter(a => a.type === 'absent').length;
    const tiles = isParent()
      ? [['permits', '✍️', 'אישורים', S.permits.filter(p => !p.signed).length], ['absence', '🏠', 'דיווח היעדרות'], ['grades', '📊', 'ציונים'], ['attendance', '🗓️', 'נוכחות'], ['calendar', '📅', 'אירועים'], ['contacts', '📞', 'אנשי קשר'], ['buses', '🚌', 'הסעות'], ['menu', '🍽️', 'תפריט']]
      : [['grades', '📊', 'ציונים'], ['calendar', '📅', 'מבחנים'], ['clubs', '⚽', 'חוגים'], ['counsel', '💚', 'אוזן קשבת'], ['library', '📚', 'ספרייה', S.library.filter(b => daysFrom(b.due) < 0).length], ['lost', '🔎', 'אבדות'], ['buses', '🚌', 'הסעות'], ['menu', '🍽️', 'תפריט']];
    const al = alerts();
    return `
      <section class="hero">
        <h1>${greet}${firstName() ? ', ' + esc(firstName()) : ''} 👋</h1>
        <p>${fmtDate(todayISO())}${isParent() ? '' : ' · כיתה ' + esc(myClass())}</p>
        ${kid}
        <div class="now-box">${nowHtml}</div>
      </section>
      ${al.length ? `<h2>דורש תשומת לב</h2><div class="card"><ul class="list">${al.slice(0, 4).map(x => `<li class="row"><button class="rowbtn" data-go="${x.go}"><span class="ico-circle">${x.ico}</span><span class="grow">${esc(x.text)}</span><span>‹</span></button></li>`).join('')}</ul></div>` : ''}
      <h2>גישה מהירה</h2>
      <div class="grid4">${tiles.map(([go, ico, l, b]) => `<button class="tile" data-go="${go}"><span class="ico">${ico}</span>${l}${b ? `<span class="badge count">${b}</span>` : ''}</button>`).join('')}</div>
      <div class="grid2" style="margin-top:12px">
        <button class="card stat" data-go="grades"><b>${avg ? avg.toFixed(1) : '—'}</b><small>ממוצע כללי</small></button>
        <button class="card stat" data-go="attendance"><b>${att}</b><small>חיסורים במחצית</small></button>
      </div>
      <h2>משימות קרובות <a href="#/tasks">הכל</a></h2>
      ${sectionList(openHw().slice(0, 3), hwRow, 'אין משימות פתוחות')}
      <h2>מבחנים ואירועים <a href="#/calendar">ללוח</a></h2>
      ${sectionList(upcomingEvents(14).slice(0, 3), eventRow, 'אין אירועים בשבועיים הקרובים')}
      <h2>הודעות אחרונות <a href="#/news">הכל</a></h2>
      ${sectionList(visibleAnn().slice(0, 2), annRow, 'אין הודעות')}`;
  };

  PAGES.teacherHome = () => {
    const dow = new Date().getDay();
    const mySubjects = Object.entries(S.subjects).filter(([, s]) => s.teacher === S.user.name).map(([k]) => k);
    const lessons = (S.timetable[dow] || []).map((k, i) => ({ k, p: S.periods[i] }));
    const today = todayISO();
    const marked = S.classAttendance && S.classAttendance[today];
    const reports = S.absenceReports.filter(r => !r.seen);
    return `
      <section class="hero"><h1>שלום ${esc(firstName())} 👋</h1><p>${fmtDate(today)} · מחנכת ${esc(S.user.classId)}</p>
        <div class="now-box"><small>היום במערכת</small><b>${lessons.length ? lessons.length + ' שיעורים · ' + lessons[0].p.from + '–' + lessons[lessons.length - 1].p.to : 'אין לימודים היום'}</b>
        <small>${marked ? '✓ נוכחות היום נרשמה' : 'טרם נרשמה נוכחות להיום'}</small></div></section>
      <h2>פעולות מהירות</h2>
      <div class="grid4">
        <button class="tile" data-go="roll"><span class="ico">✅</span>נוכחות</button>
        <button class="tile" data-act="newHw"><span class="ico">📝</span>משימה חדשה</button>
        <button class="tile" data-act="newGrade"><span class="ico">💯</span>הזנת ציון</button>
        <button class="tile" data-act="newEvent"><span class="ico">🧪</span>מבחן/אירוע</button>
        <button class="tile" data-act="newAnn"><span class="ico">📢</span>הודעה לכיתה</button>
        <button class="tile" data-act="newChange"><span class="ico">🔄</span>שינוי מערכת</button>
        <button class="tile" data-act="newNote"><span class="ico">⭐</span>משוב לתלמיד</button>
        <button class="tile" data-go="inbox"><span class="ico">📥</span>דיווחים${reports.length ? `<span class="badge count">${reports.length}</span>` : ''}</button>
      </div>
      ${reports.length ? `<h2>דיווחי היעדרות מהורים</h2><div class="card"><ul class="list">${reports.slice(0, 3).map(r => `<li class="row"><span class="ico-circle">🏠</span><div class="grow"><div class="title">${esc(r.child)} · ${fmtShort(r.from)}${r.to !== r.from ? '–' + fmtShort(r.to) : ''}</div><div class="meta">${esc(r.reason)}${r.note ? ' – ' + esc(r.note) : ''}</div></div><button class="btn sm ghost" data-act="seeReport" data-id="${r.id}">ראיתי</button></li>`).join('')}</ul></div>` : ''}
      <h2>המשימות שנתתי <a href="#/tasks">הכל</a></h2>
      ${sectionList(S.homework.filter(h => !mySubjects.length || mySubjects.includes(h.subject)).filter(h => daysFrom(h.due) >= 0).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4), hwRow, 'אין משימות פעילות')}
      <h2>אירועים קרובים</h2>
      ${sectionList(S.events.filter(e => daysFrom(e.date) >= 0 && daysFrom(e.date) <= 14).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4), eventRow, 'אין אירועים קרובים')}`;
  };

  PAGES.adminHome = () => {
    const today = todayISO();
    const att = S.classAttendance && S.classAttendance[today];
    const present = att ? Object.values(att).filter(v => v !== 'a').length : null;
    const signed = S.permits.filter(p => p.signed).length;
    const newCounsel = S.counsel.filter(c => !c.handled).length;
    return `
      <section class="hero"><h1>לוח בקרה</h1><p>${fmtDate(today)} · ${esc(S.school.name)}</p>
        <div class="now-box"><small>נוכחות היום (כיתות שדיווחו)</small><b>${present == null ? 'טרם התקבלו דיווחים' : `${present}/${Object.keys(att).length} תלמידים נוכחים`}</b></div></section>
      <div class="grid2" style="margin-top:12px">
        <div class="card stat"><b>${S.classes.length}</b><small>כיתות</small></div>
        <div class="card stat"><b>${S.students.length * S.classes.length}</b><small>תלמידים (הערכה)</small></div>
        <button class="card stat" data-go="inbox"><b>${newCounsel}</b><small>פניות "אוזן קשבת"</small></button>
        <button class="card stat" data-go="inbox"><b>${S.absenceReports.length}</b><small>דיווחי היעדרות</small></button>
        <button class="card stat" data-go="permits"><b>${signed}/${S.permits.length}</b><small>טפסים נחתמו</small></button>
        <button class="card stat" data-go="polls"><b>${S.polls.length}</b><small>סקרים פעילים</small></button>
      </div>
      <h2>פעולות הנהלה</h2>
      <div class="grid4">
        <button class="tile" data-act="newAnn"><span class="ico">📢</span>פרסום הודעה</button>
        <button class="tile" data-act="newEvent"><span class="ico">📅</span>אירוע</button>
        <button class="tile" data-act="newPoll"><span class="ico">🗳️</span>סקר חדש</button>
        <button class="tile" data-act="newChange"><span class="ico">🔄</span>שינוי מערכת</button>
        <button class="tile" data-act="newPermit"><span class="ico">✍️</span>טופס לחתימה</button>
        <button class="tile" data-go="inbox"><span class="ico">📥</span>פניות</button>
        <button class="tile" data-go="lost"><span class="ico">🔎</span>אבדות</button>
        <button class="tile" data-go="buses"><span class="ico">🚌</span>הסעות</button>
      </div>
      <h2>הודעות שפורסמו <a href="#/news">הכל</a></h2>
      ${sectionList(visibleAnn().slice(0, 3), annRow, 'אין הודעות')}`;
  };

  PAGES.schedule = () => {
    const sel = PAGES.schedule.day != null ? PAGES.schedule.day : Math.min(new Date().getDay(), 5);
    const base = parseISO(todayISO());
    base.setDate(base.getDate() - base.getDay()); // Sunday of this week
    const dateOf = i => { const d = new Date(base); d.setDate(d.getDate() + i); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
    const date = dateOf(sel);
    const lessons = S.timetable[sel] || [];
    const ch = changesFor(date);
    const cl = date === todayISO() ? currentLesson() : null;
    let html = '';
    lessons.forEach((k, i) => {
      const p = S.periods[i];
      const c = ch.find(x => x.period === p.n);
      const s = subj(k);
      html += `<div class="lesson ${cl && cl.state === 'in' && cl.i === i ? 'now' : ''} ${c ? 'changed' : ''}">
        <div class="num">${p.n}<small>${p.from}</small></div>
        <span class="swatch" style="background:${s.color}"></span>
        <div class="grow"><div class="title">${esc(s.name)}</div><div class="meta">${esc(s.teacher)} · <bdi dir="ltr">${p.from}–${p.to}</bdi></div>
        ${c ? `<div class="badge amber" style="margin-top:4px;white-space:normal">🔄 ${esc(c.text)}</div>` : ''}</div>
        ${cl && cl.state === 'in' && cl.i === i ? '<span class="badge green">עכשיו</span>' : ''}</div>`;
      const br = S.breaks.find(b => b.after === p.n && i < lessons.length - 1);
      if (br) html += `<div class="break">☕ ${br.label} · <bdi dir="ltr">${br.from}–${br.to}</bdi></div>`;
    });
    const exams = S.events.filter(e => e.date === date && (e.classId === myClass() || e.classId === 'all'));
    return `<h1>מערכת שעות</h1><p class="sub">כיתה ${esc(myClass())} · ${fmtDate(date)}</p>
      <div class="daytabs">${[0, 1, 2, 3, 4, 5].map(i => `<button class="daytab ${i === sel ? 'on' : ''}" data-act="pickDay" data-id="${i}">${DAYS_S[i]}<small>${fmtShort(dateOf(i))}</small></button>`).join('')}</div>
      ${exams.map(e => `<div class="notice ${e.type === 'exam' ? 'red' : 'info'}" style="margin-bottom:10px">${(EVT[e.type] || EVT.event).ico} ${esc(e.title)}</div>`).join('')}
      ${html || '<div class="card empty"><div class="e">🌄</div>אין לימודים ביום זה</div>'}
      ${isStaff() ? '<button class="btn ghost block" style="margin-top:14px" data-act="newChange">+ הוספת שינוי במערכת</button>' : ''}`;
  };

  PAGES.tasks = () => {
    const f = PAGES.tasks.f || 'open';
    const subjF = PAGES.tasks.s || 'all';
    let list = isStaff() ? S.homework.slice().sort((a, b) => a.due.localeCompare(b.due)) : classItems(S.homework).sort((a, b) => a.due.localeCompare(b.due));
    if (!isStaff()) {
      if (f === 'open') list = list.filter(h => !S.hwDone.includes(h.id));
      if (f === 'done') list = list.filter(h => S.hwDone.includes(h.id));
    } else if (f === 'open') list = list.filter(h => daysFrom(h.due) >= 0);
    if (subjF !== 'all') list = list.filter(h => h.subject === subjF);
    const usedSubjects = [...new Set(S.homework.map(h => h.subject))];
    const total = classItems(S.homework).length;
    const done = classItems(S.homework).filter(h => S.hwDone.includes(h.id)).length;
    return `<h1>${isStaff() ? 'משימות ושיעורי בית' : 'המשימות שלי'}</h1>
      ${!isStaff() ? `<div class="card" style="margin:10px 0 14px"><div style="display:flex;justify-content:space-between"><b>התקדמות</b><span class="meta">${done}/${total} הושלמו</span></div>
        <div class="bar-track" style="margin-top:8px"><i style="width:${total ? done / total * 100 : 0}%;background:var(--ok)"></i></div></div>` : '<p class="sub">משימות שפורסמו לכיתות</p>'}
      <div class="chips">${(isStaff() ? [['open', 'פעילות'], ['all', 'הכל']] : [['open', 'פתוחות'], ['done', 'הושלמו'], ['all', 'הכל']]).map(([k, l]) => `<button class="chip ${f === k ? 'on' : ''}" data-act="taskFilter" data-id="${k}">${l}</button>`).join('')}
        <span style="border-inline-start:1px solid var(--line)"></span>
        <button class="chip ${subjF === 'all' ? 'on' : ''}" data-act="taskSubj" data-id="all">כל המקצועות</button>
        ${usedSubjects.map(k => `<button class="chip ${subjF === k ? 'on' : ''}" data-act="taskSubj" data-id="${k}">${esc(subj(k).name)}</button>`).join('')}</div>
      ${sectionList(list, hwRow, f === 'open' ? 'כל המשימות הושלמו – כל הכבוד! 🎉' : 'אין משימות להצגה')}
      ${isStaff() ? '<button class="fab" data-act="newHw" aria-label="משימה חדשה">+</button>' : ''}`;
  };

  PAGES.grades = () => {
    const avgs = subjectAverages();
    const all = overallAvg(avgs);
    const recent = S.grades.slice().sort((a, b) => b.date.localeCompare(a.date));
    const C = 2 * Math.PI * 40;
    return `<h1>ציונים</h1><p class="sub">${isParent() ? esc(child().name) + ' · ' : ''}מחצית א׳</p>
      <div class="card" style="display:flex;align-items:center;gap:16px">
        <svg class="ring" viewBox="0 0 96 96" role="img" aria-label="ממוצע ${all.toFixed(1)}">
          <circle cx="48" cy="48" r="40" fill="none" stroke="var(--line)" stroke-width="10"/>
          <circle cx="48" cy="48" r="40" fill="none" stroke="${gradeColor(all)}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C * all / 100} ${C}" transform="rotate(-90 48 48)"/>
          <text x="48" y="54" text-anchor="middle" font-size="20" font-weight="800" fill="var(--text)">${all.toFixed(1)}</text></svg>
        <div class="grow"><b>ממוצע כללי</b><div class="meta">${S.grades.length} ציונים ב-${avgs.length} מקצועות</div>
          <div class="meta">חזק ביותר: ${avgs[0] ? esc(subj(avgs[0].k).name) : '—'}</div>
          <button class="btn sm ghost" style="margin-top:8px" data-act="whatIf">🧮 מחשבון "מה אם"</button></div>
      </div>
      <h2>לפי מקצוע</h2>
      <div class="card">${avgs.map(a => `<div class="bar-row"><span class="lbl">${esc(subj(a.k).name)}</span><div class="bar-track"><i style="width:${a.avg}%;background:${subj(a.k).color}"></i></div><b>${Math.round(a.avg)}</b></div>`).join('')}</div>
      <h2>ציונים אחרונים</h2>
      <div class="card"><ul class="list">${recent.map(g => `<li class="row"><span class="swatch" style="background:${subj(g.subject).color}"></span>
        <div class="grow"><div class="title">${esc(g.title)}</div><div class="meta">${esc(subj(g.subject).name)} · ${fmtShort(g.date)} · משקל ${g.weight}</div></div>
        <b style="color:${gradeColor(g.score)};font-size:1.15rem">${g.score}</b></li>`).join('')}</ul></div>
      <h2>משובים מהמורים</h2>
      ${sectionList(S.notes.slice().sort((a, b) => b.date.localeCompare(a.date)), n => `<li class="row"><span class="ico-circle">${n.type === 'praise' ? '⭐' : n.type === 'missing' ? '🎒' : '⚠️'}</span><div class="grow"><div class="title">${esc(n.text)}</div><div class="meta">${esc(subj(n.subject).name)} · ${rel(n.date)}</div></div></li>`, 'אין משובים')}`;
  };

  PAGES.attendance = () => {
    const by = t => S.attendance.filter(a => a.type === t).length;
    const T = { absent: ['חיסור', 'red', '❌'], late: ['איחור', 'amber', '⏰'], justified: ['חיסור מוצדק', 'green', '📄'] };
    const totalLessons = 30 * 7;
    const pct = 100 - (by('absent') / totalLessons * 100);
    return `<h1>נוכחות</h1><p class="sub">${isParent() ? esc(child().name) + ' · ' : ''}מתחילת המחצית</p>
      <div class="grid4" style="grid-template-columns:repeat(4,1fr)">
        <div class="card stat"><b>${pct.toFixed(0)}%</b><small>נוכחות</small></div>
        <div class="card stat"><b style="color:var(--danger)">${by('absent')}</b><small>חיסורים</small></div>
        <div class="card stat"><b style="color:var(--warn)">${by('late')}</b><small>איחורים</small></div>
        <div class="card stat"><b style="color:var(--ok)">${by('justified')}</b><small>מוצדקים</small></div>
      </div>
      ${isParent() ? '<button class="btn block" style="margin-top:12px" data-go="absence">🏠 דיווח על היעדרות צפויה</button>' : ''}
      <h2>פירוט</h2>
      ${sectionList(S.attendance.slice().sort((a, b) => b.date.localeCompare(a.date)), a => `<li class="row"><span class="ico-circle">${T[a.type][2]}</span>
        <div class="grow"><div class="title">${a.subject === 'all' ? 'יום שלם' : esc(subj(a.subject).name) + ' · שיעור ' + a.period}</div><div class="meta">${fmtDate(a.date)}${a.note ? ' · ' + esc(a.note) : ''}</div></div>
        <span class="badge ${T[a.type][1]}">${T[a.type][0]}</span></li>`, 'אין חיסורים – נוכחות מלאה!')}
      ${isParent() ? '' : '<p class="meta" style="margin-top:12px">חושבים שיש טעות? פנו למחנכת דרך מסך ההודעות.</p>'}`;
  };

  PAGES.calendar = () => {
    const now = parseISO(todayISO());
    const ym = PAGES.calendar.ym || [now.getFullYear(), now.getMonth()];
    const sel = PAGES.calendar.sel || todayISO();
    const first = new Date(ym[0], ym[1], 1, 12);
    const start = new Date(first); start.setDate(1 - first.getDay());
    const evs = isStaff() ? S.events : classItems(S.events);
    const hwByDate = {};
    (isStaff() ? [] : classItems(S.homework)).forEach(h => { hwByDate[h.due] = true; });
    let cells = DAYS_S.map(d => `<div class="dow">${d}</div>`).join('');
    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const iso = new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
      const dayEvs = evs.filter(e => e.date === iso);
      cells += `<button class="d ${d.getMonth() !== ym[1] ? 'out' : ''} ${iso === todayISO() ? 'today' : ''} ${iso === sel ? 'sel' : ''}" data-act="calSel" data-id="${iso}">
        ${d.getDate()}<span class="dots">${dayEvs.slice(0, 3).map(e => `<i style="background:${(EVT[e.type] || EVT.event).c}"></i>`).join('')}${hwByDate[iso] ? '<i style="background:var(--muted)"></i>' : ''}</span></button>`;
      if (i >= 34 && d.getMonth() !== ym[1] && d.getDay() === 6) break;
    }
    const selEvs = evs.filter(e => e.date === sel);
    const selHw = isStaff() ? [] : classItems(S.homework).filter(h => h.due === sel);
    return `<h1>לוח אירועים ומבחנים</h1>
      <div class="card" style="margin-top:10px">
        <div class="cal-head"><button class="icon-btn" data-act="calMove" data-id="-1" aria-label="חודש קודם">→</button><b>${MONTHS[ym[1]]} ${ym[0]}</b><button class="icon-btn" data-act="calMove" data-id="1" aria-label="חודש הבא">←</button></div>
        <div class="cal">${cells}</div>
        <div class="legend">${Object.values(EVT).map(t => `<span style="--c:${t.c}">${t.label}</span>`).join('')}${isStaff() ? '' : '<span style="--c:var(--muted)">הגשת משימה</span>'}</div>
      </div>
      <h2>${fmtDate(sel)}</h2>
      ${selEvs.length || selHw.length ? `<div class="card"><ul class="list">${selEvs.map(eventRow).join('')}${selHw.map(hwRow).join('')}</ul></div>` : '<div class="card empty">אין אירועים ביום זה</div>'}
      <h2>החודש הקרוב</h2>
      ${sectionList(upcomingEvents(31), eventRow, 'אין אירועים קרובים')}
      <button class="btn ghost block" style="margin-top:12px" data-act="exportIcs">📥 ייצוא ליומן (קובץ ICS)</button>
      ${isStaff() ? '<button class="fab" data-act="newEvent" aria-label="אירוע חדש">+</button>' : ''}`;
  };

  PAGES.news = id => {
    if (id) {
      const a = S.announcements.find(x => x.id === id);
      if (!a) return '<div class="empty">ההודעה לא נמצאה</div>';
      if (!S.annRead.includes(a.id)) { S.annRead.push(a.id); save(); }
      return `<span class="badge">${esc(a.cat || 'כללי')}</span>
        <h1 style="margin-top:8px">${esc(a.title)}</h1><p class="sub">${esc(a.author)} · ${fmtDate(a.date)}</p>
        <div class="card" style="white-space:pre-wrap">${esc(a.body)}</div>
        <div class="btn-row" style="margin-top:12px">
          <button class="btn ghost" data-act="shareAnn" data-id="${a.id}">↗️ שיתוף</button>
          ${isStaff() ? `<button class="btn ghost" data-act="pinAnn" data-id="${a.id}">${a.pinned ? 'ביטול הצמדה' : '📌 הצמדה'}</button><button class="btn danger" data-act="delAnn" data-id="${a.id}">מחיקה</button>` : ''}
        </div>`;
    }
    const cat = PAGES.news.cat || 'all';
    const list = visibleAnn().filter(a => cat === 'all' || a.cat === cat);
    const cats = [...new Set(visibleAnn().map(a => a.cat).filter(Boolean))];
    return `<h1>הודעות ועדכונים</h1>
      <div class="chips" style="margin-top:10px"><button class="chip ${cat === 'all' ? 'on' : ''}" data-act="newsCat" data-id="all">הכל</button>${cats.map(c => `<button class="chip ${cat === c ? 'on' : ''}" data-act="newsCat" data-id="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      ${sectionList(list, annRow, 'אין הודעות')}
      <h2>הודעות אישיות <a href="#/messages">לתיבה</a></h2>
      ${PAGES.threadList()}
      ${isStaff() ? '<button class="fab" data-act="newAnn" aria-label="הודעה חדשה">+</button>' : ''}`;
  };

  PAGES.threadList = () => sectionList(S.threads.slice().sort((a, b) => (b.msgs.at(-1) || {}).time > (a.msgs.at(-1) || {}).time ? 1 : -1), t => {
    const last = t.msgs[t.msgs.length - 1];
    return `<li class="row"><button class="rowbtn" data-go="chat/${t.id}"><span class="ico-circle">${esc(t.with[0])}</span>
      <div class="grow"><div class="title">${esc(t.with)} <span class="meta">· ${esc(t.role)}</span></div><div class="meta ellipsis">${last ? (last.from === 'me' ? 'את/ה: ' : '') + esc(last.text) : ''}</div></div>
      ${t.unread ? `<span class="badge count">${t.unread}</span>` : `<span class="pill-time">${last ? rel(last.time) : ''}</span>`}</button></li>`;
  }, 'אין שיחות');

  PAGES.messages = () => `<h1>הודעות</h1><p class="sub">תקשורת ישירה עם הצוות החינוכי</p>
    ${PAGES.threadList()}
    <button class="fab" data-act="newThread" aria-label="שיחה חדשה">✏️</button>`;

  PAGES.chat = id => {
    const t = S.threads.find(x => x.id === id);
    if (!t) return '<div class="empty">השיחה לא נמצאה</div>';
    if (t.unread) { t.unread = 0; save(); }
    return `<h1>${esc(t.with)}</h1><p class="sub">${esc(t.role)}</p>
      <div class="chat" id="chatBox">${t.msgs.map(m => `<div class="msg ${m.from}">${esc(m.text)}<small>${fmtShort(m.time)} ${m.time.slice(11, 16)}</small></div>`).join('')}</div>
      <form class="composer" data-form="sendMsg" data-id="${t.id}"><input class="input" name="text" placeholder="כתיבת הודעה..." autocomplete="off" required><button class="btn">שליחה</button></form>`;
  };

  PAGES.more = () => {
    const groups = [
      ['לימודים', [['grades', '📊', 'ציונים ומשובים'], ['attendance', '🗓️', 'נוכחות'], ['calendar', '📅', 'לוח אירועים ומבחנים'], ['library', '📚', 'הספרייה שלי']]],
      ['הורים', [['permits', '✍️', 'אישורים וטפסים לחתימה'], ['absence', '🏠', 'דיווח היעדרות']]],
      ['קהילה ושירותים', [['news', '📢', 'הודעות בית הספר'], ['clubs', '⚽', 'חוגים ופעילויות'], ['polls', '🗳️', 'סקרים והצבעות'], ['lost', '🔎', 'אבדות ומציאות'], ['buses', '🚌', 'הסעות'], ['menu', '🍽️', 'תפריט ארוחת צהריים']]],
      ['רווחה וביטחון', [['counsel', '💚', 'אוזן קשבת – פנייה ליועצת'], ['emergency', '🚨', 'חירום ונהלי ביטחון'], ['contacts', '📞', 'ספר טלפונים']]],
      ['צוות', [['roll', '✅', 'רישום נוכחות לכיתה'], ['inbox', '📥', 'פניות ודיווחים']]],
      ['כללי', [['settings', '⚙️', 'הגדרות'], ['about', 'ℹ️', 'אודות בית הספר']]]
    ].filter(([g]) => (g !== 'הורים' || isParent() || isAdmin()) && (g !== 'צוות' || isStaff()));
    return `<h1>עוד</h1>
      <div class="card" style="display:flex;align-items:center;gap:12px;margin:10px 0">
        <span class="ico-circle" style="width:52px;height:52px;font-size:1.6rem">${ROLES[role()].ico}</span>
        <div class="grow"><b>${esc(S.user.name)}</b><div class="meta">${ROLES[role()].label}${S.user.classId ? ' · ' + esc(S.user.classId) : ''}${isParent() ? ' · ' + S.children.map(c => esc(c.name)).join(', ') : ''}</div></div>
        <button class="btn sm ghost" data-act="switchRole">החלפת משתמש</button></div>
      ${groups.map(([g, items]) => `<h2>${g}</h2><div class="card"><ul class="list">${items.map(([go, ico, l]) => `<li class="row"><button class="rowbtn" data-go="${go}"><span class="ico-circle">${ico}</span><span class="grow title">${l}</span><span class="meta">‹</span></button></li>`).join('')}</ul></div>`).join('')}`;
  };

  PAGES.permits = () => `<h1>אישורים וטפסים</h1><p class="sub">חתימה דיגיטלית ותשלום – בלי פתקים בתיק</p>
    ${S.permits.map(p => `<div class="card">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><b>${esc(p.title)}</b>${p.signed ? '<span class="badge green">✓ נחתם</span>' : `<span class="badge ${daysFrom(p.due) <= 3 ? 'red' : 'amber'}">עד ${fmtShort(p.due)}</span>`}</div>
      <p class="meta" style="margin:6px 0">${esc(p.desc)}</p>
      ${p.cost ? `<div class="meta">עלות: <b>${p.cost} ₪</b> · ${p.paid ? 'שולם ✓' : 'טרם שולם'}</div>` : ''}
      ${isParent() && !p.signed ? `<button class="btn block" style="margin-top:10px" data-act="signPermit" data-id="${p.id}">✍️ קריאה וחתימה${p.cost ? ' + תשלום' : ''}</button>` : ''}
      ${isStaff() ? `<div class="meta" style="margin-top:6px">${p.signed ? 'הורי ' + esc(child().name) + ' חתמו' : 'ממתין לחתימות'}</div>` : ''}
    </div>`).join('')}
    ${isAdmin() ? '<button class="fab" data-act="newPermit" aria-label="טופס חדש">+</button>' : ''}`;

  PAGES.absence = () => `<h1>דיווח היעדרות</h1><p class="sub">הדיווח נשלח ישירות למחנכת ולמזכירות</p>
    <form class="card" data-form="absence">
      <label class="f">ילד/ה</label><select class="input" name="child">${S.children.map(c => `<option ${c.id === child().id ? 'selected' : ''}>${esc(c.name)} (${esc(c.classId)})</option>`).join('')}</select>
      <div class="grid2"><div><label class="f">מתאריך</label><input class="input" type="date" name="from" value="${todayISO()}" required></div>
      <div><label class="f">עד תאריך</label><input class="input" type="date" name="to" value="${todayISO()}" required></div></div>
      <label class="f">סיבה</label><select class="input" name="reason"><option>מחלה</option><option>תור לרופא</option><option>אירוע משפחתי</option><option>נסיעה</option><option>אחר</option></select>
      <label class="f">הערה (לא חובה)</label><textarea class="input" name="note" placeholder="למשל: יגיע בשעה 10:00"></textarea>
      <button class="btn block" style="margin-top:14px">שליחת דיווח</button>
    </form>
    ${S.absenceReports.length ? `<h2>דיווחים קודמים</h2>${sectionList(S.absenceReports.slice().reverse(), r => `<li class="row"><span class="ico-circle">🏠</span><div class="grow"><div class="title">${esc(r.child)} · ${esc(r.reason)}</div><div class="meta">${fmtShort(r.from)}${r.to !== r.from ? '–' + fmtShort(r.to) : ''}</div></div><span class="badge ${r.seen ? 'green' : 'gray'}">${r.seen ? 'נקרא' : 'נשלח'}</span></li>`, '')}` : ''}`;

  PAGES.counsel = () => `<h1>אוזן קשבת 💚</h1><p class="sub">פנייה דיסקרטית ליועצת בית הספר. אפשר גם באופן אנונימי.</p>
    <div class="notice red" style="margin-bottom:12px">🚨 במצב של סכנה מיידית – פנו מיד למבוגר בבית הספר או חייגו <b>&nbsp;100&nbsp;</b>. פגיעה ברשת: <b>&nbsp;105&nbsp;</b>. ער"ן: <b>&nbsp;1201</b></div>
    <form class="card" data-form="counsel">
      <label class="f">במה מדובר?</label>
      <select class="input" name="topic"><option>לחץ לימודי / מבחנים</option><option>חברים / חברה</option><option>הצקות או חרם</option><option>בריונות ברשת</option><option>משהו בבית</option><option>הרגשה כללית</option><option>אחר</option></select>
      <label class="f">ספרו לנו</label><textarea class="input" name="text" required placeholder="כתבו כמה שנוח לכם..."></textarea>
      <label class="f">כמה דחוף?</label>
      <select class="input" name="urgency"><option>אפשר לדבר השבוע</option><option>הייתי רוצה לדבר היום</option><option>דחוף</option></select>
      <div class="switch-row"><span>שליחה אנונימית</span><input type="checkbox" class="toggle" name="anon"></div>
      <button class="btn block" style="margin-top:8px">שליחה ליועצת</button>
    </form>
    <h2>טיפים קטנים לימים עמוסים</h2>
    <div class="card"><ul class="list">
      <li class="row"><span class="ico-circle">🫁</span><div class="grow">נשימת קופסה: 4 שניות שאיפה, 4 עצירה, 4 נשיפה, 4 עצירה.</div></li>
      <li class="row"><span class="ico-circle">🗂️</span><div class="grow">לפרק משימה גדולה לצעדים קטנים – ולסמן כל אחד במסך המשימות.</div></li>
      <li class="row"><span class="ico-circle">🤝</span><div class="grow">לא חייבים להתמודד לבד. גם לשתף חבר זה צעד חשוב.</div></li>
    </ul></div>`;

  PAGES.clubs = () => `<h1>חוגים ופעילויות</h1><p class="sub">פעילויות אחר הצהריים בבית הספר</p>
    ${S.clubs.map(c => `<div class="card" style="display:flex;align-items:center;gap:12px"><span class="ico-circle">⚽</span>
      <div class="grow"><b>${esc(c.name)}</b><div class="meta">${esc(c.when)} · ${esc(c.where)}</div><div class="meta">${c.seats} מקומות פנויים</div></div>
      <button class="btn sm ${c.joined ? 'ghost' : ''}" data-act="joinClub" data-id="${c.id}" ${!c.joined && c.seats <= 0 ? 'disabled' : ''}>${c.joined ? 'רשום/ה ✓' : 'הרשמה'}</button></div>`).join('')}`;

  PAGES.polls = () => `<h1>סקרים והצבעות</h1><p class="sub">הקול שלכם משפיע על בית הספר</p>
    ${S.polls.map(p => {
      const total = p.options.reduce((s, o) => s + o.v, 0);
      return `<div class="card"><b>${esc(p.q)}</b>${p.options.map((o, i) => {
        const pct = total ? Math.round(o.v / total * 100) : 0;
        return `<button class="opt ${p.voted === i ? 'mine' : ''}" data-act="vote" data-id="${p.id}:${i}" ${p.voted != null ? 'disabled' : ''}>
          ${p.voted != null ? `<i class="fill" style="width:${pct}%"></i>` : ''}<span>${esc(o.t)}${p.voted != null ? `<b>${pct}%</b>` : ''}</span></button>`;
      }).join('')}<div class="meta" style="margin-top:8px">${total} הצבעות${p.voted != null ? ' · תודה שהצבעת!' : ''}</div></div>`;
    }).join('')}
    ${isAdmin() ? '<button class="fab" data-act="newPoll" aria-label="סקר חדש">+</button>' : ''}`;

  PAGES.lost = () => {
    const f = PAGES.lost.f || 'all';
    const list = S.lostFound.filter(l => !l.done && (f === 'all' || l.type === f));
    return `<h1>אבדות ומציאות</h1><p class="sub">איבדתם משהו? מצאתם? פרסמו כאן</p>
      <div class="chips">${[['all', 'הכל'], ['lost', 'אבד'], ['found', 'נמצא']].map(([k, l]) => `<button class="chip ${f === k ? 'on' : ''}" data-act="lostFilter" data-id="${k}">${l}</button>`).join('')}</div>
      ${sectionList(list, l => `<li class="row"><span class="ico-circle">${l.type === 'lost' ? '❓' : '📦'}</span>
        <div class="grow"><div class="title">${esc(l.item)}</div><div class="meta">${esc(l.place)} · ${rel(l.date)} · ${esc(l.contact)}</div></div>
        <button class="btn sm ghost" data-act="lostDone" data-id="${l.id}">${l.type === 'lost' ? 'נמצא!' : 'נאסף'}</button></li>`, 'אין פריטים פתוחים')}
      <button class="fab" data-act="newLost" aria-label="פרסום פריט">+</button>`;
  };

  PAGES.buses = () => `<h1>הסעות</h1><p class="sub">זמני איסוף משוערים · חזרה בסיום יום הלימודים</p>
    ${S.buses.map(b => `<div class="card"><div style="display:flex;justify-content:space-between;gap:8px"><b>🚌 ${esc(b.line)}</b><span class="badge ${b.status === 'בזמן' ? 'green' : 'amber'}">${esc(b.status)}</span></div>
      <ul class="list">${b.stops.map(s => `<li class="row" style="padding:6px 0"><span>📍</span><span class="grow">${esc(s)}</span></li>`).join('')}</ul>
      <div class="meta">חזרה: ${esc(b.back)} · נהג/ת: ${esc(b.driver)}</div></div>`).join('')}`;

  PAGES.menu = () => {
    const dow = new Date().getDay();
    return `<h1>תפריט ארוחת צהריים</h1><p class="sub">במסגרת תוכנית ההזנה · מידע על אלרגנים במזכירות</p>
      ${S.menu.map(m => `<div class="card" ${m.d === dow ? 'style="border-color:var(--brand);box-shadow:0 0 0 2px var(--brand-soft)"' : ''}>
        <div style="display:flex;justify-content:space-between"><b>יום ${DAYS[m.d]}</b>${m.d === dow ? '<span class="badge green">היום</span>' : ''}</div>
        <div class="meta">${m.items.map(esc).join(' · ')}</div></div>`).join('')}`;
  };

  PAGES.library = () => `<h1>הספרייה שלי</h1><p class="sub">ספרים מושאלים ותזכורות החזרה</p>
    ${sectionList(S.library, b => {
      const n = daysFrom(b.due);
      return `<li class="row"><span class="ico-circle">📖</span><div class="grow"><div class="title">${esc(b.title)}</div><div class="meta">${esc(b.author)} · להחזיר עד ${fmtShort(b.due)}</div></div>
        ${n < 0 ? '<span class="badge red">באיחור</span>' : `<button class="btn sm ghost" data-act="renew" data-id="${b.id}">הארכה</button>`}</li>`;
    }, 'אין ספרים מושאלים')}
    <div class="notice info" style="margin-top:12px">📚 שעות הספרייה: א׳–ה׳ 08:00–14:00 · בכל ההפסקות</div>`;

  PAGES.contacts = () => {
    const q = (PAGES.contacts.q || '').trim();
    const list = S.contacts.filter(c => !q || (c.name + c.role).includes(q));
    const groups = [...new Set(list.map(c => c.group))];
    return `<h1>ספר טלפונים</h1>
      <input class="input" style="margin:10px 0" placeholder="חיפוש לפי שם או תפקיד" value="${esc(q)}" data-input="contactsQ">
      ${groups.map(g => `<h2>${esc(g)}</h2><div class="card"><ul class="list">${list.filter(c => c.group === g).map(c => `<li class="row"><span class="ico-circle">${esc(c.name[0])}</span>
        <div class="grow"><div class="title">${esc(c.name)}</div><div class="meta">${esc(c.role)}</div></div>
        <a class="btn sm ghost" href="tel:${esc(c.phone)}" aria-label="חיוג">📞</a><a class="btn sm ghost" href="mailto:${esc(c.email)}" aria-label="מייל">✉️</a></li>`).join('')}</ul></div>`).join('') || '<div class="card empty">לא נמצאו תוצאות</div>'}`;
  };

  PAGES.emergency = () => `<h1>חירום ונהלי ביטחון</h1>
    <div class="grid2" style="margin:10px 0">
      ${[['100', 'משטרה', '👮'], ['101', 'מד"א', '🚑'], ['102', 'כבאות', '🚒'], ['104', 'פיקוד העורף', '🛡️'], ['105', 'הגנה על ילדים ברשת', '🧒'], ['1201', 'ער"ן – עזרה נפשית', '💚']].map(([n, l, i]) => `<a class="card sos" style="text-decoration:none;display:block" href="tel:${n}"><b style="font-size:1.4rem">${i} ${n}</b><div class="meta">${l}</div></a>`).join('')}
    </div>
    <a class="btn block" href="tel:${esc(S.school.phone)}">📞 מזכירות בית הספר · ${esc(S.school.phone)}</a>
    <h2>נהלים</h2>
    ${[['🔔', 'אזעקה', 'בבית הספר: להיכנס למרחב המוגן הקרוב לפי הנחיית המורה. בדרך: לשכב על הקרקע ולהגן על הראש. לחכות 10 דקות.'],
       ['🔥', 'שריפה', 'לצאת מהכיתה בשקט לפי מסלול הפינוי, לא להשתמש במעלית, להתכנס במגרש הכדורסל לבדיקת נוכחות.'],
       ['🌍', 'רעידת אדמה', 'בתוך המבנה: מתחת לשולחן ואחיזה ברגלו. כשהרעידה נפסקת – יציאה לשטח פתוח הרחק ממבנים.'],
       ['🔒', 'אירוע ביטחוני', 'לנעול את הכיתה, להתרחק מחלונות ודלתות, להשתיק טלפונים ולחכות להוראות הצוות.'],
       ['🤒', 'פגיעה או מחלה', 'לפנות מיד למורה או לאחות בית הספר (חדר 4). ההורים יעודכנו על ידי הצוות.']]
      .map(([i, t, d]) => `<details class="card"><summary style="font-weight:700;cursor:pointer">${i} ${t}</summary><p style="margin:8px 0 0">${d}</p></details>`).join('')}`;

  PAGES.roll = () => {
    if (!isStaff()) return '<div class="empty">עמוד זה זמין לצוות בלבד</div>';
    const today = todayISO();
    S.classAttendance = S.classAttendance || {};
    const rec = S.classAttendance[today] || {};
    const counts = { p: 0, l: 0, a: 0 };
    S.students.forEach(s => counts[rec[s] || 'p']++);
    return `<h1>רישום נוכחות</h1><p class="sub">כיתה ${esc(S.user.classId || 'ח2')} · ${fmtDate(today)}</p>
      <div class="grid4" style="grid-template-columns:repeat(3,1fr)"><div class="card stat"><b style="color:var(--ok)">${counts.p}</b><small>נוכחים</small></div><div class="card stat"><b style="color:var(--warn)">${counts.l}</b><small>איחור</small></div><div class="card stat"><b style="color:var(--danger)">${counts.a}</b><small>חסרים</small></div></div>
      <div class="card" style="margin-top:12px"><ul class="list">${S.students.map(s => {
        const v = rec[s] || 'p';
        return `<li class="row"><span class="ico-circle">${esc(s[0])}</span><span class="grow title">${esc(s)}</span>
          <span class="att-btns">${[['p', 'נוכח'], ['l', 'איחור'], ['a', 'חסר']].map(([k, l]) => `<button class="${k} ${v === k ? 'on' : ''}" data-act="mark" data-id="${esc(s)}|${k}">${l}</button>`).join('')}</span></li>`;
      }).join('')}</ul></div>
      <button class="btn block" style="margin-top:12px" data-act="saveRoll">שמירת נוכחות</button>`;
  };

  PAGES.inbox = () => {
    if (!isStaff()) return '<div class="empty">עמוד זה זמין לצוות בלבד</div>';
    return `<h1>פניות ודיווחים</h1>
      <h2>דיווחי היעדרות מהורים</h2>
      ${sectionList(S.absenceReports.slice().reverse(), r => `<li class="row"><span class="ico-circle">🏠</span><div class="grow"><div class="title">${esc(r.child)} · ${esc(r.reason)}</div><div class="meta">${fmtShort(r.from)}${r.to !== r.from ? '–' + fmtShort(r.to) : ''}${r.note ? ' · ' + esc(r.note) : ''}</div></div>
        ${r.seen ? '<span class="badge green">טופל</span>' : `<button class="btn sm ghost" data-act="seeReport" data-id="${r.id}">אישור</button>`}</li>`, 'אין דיווחים חדשים')}
      ${isAdmin() ? `<h2>פניות "אוזן קשבת"</h2>
      <div class="notice info" style="margin-bottom:10px">🔒 גלוי ליועצת ולהנהלה בלבד</div>
      ${sectionList(S.counsel.slice().reverse(), c => `<li class="row"><span class="ico-circle">${c.urgency === 'דחוף' ? '🔴' : '💚'}</span><div class="grow"><div class="title">${esc(c.topic)} · ${c.anon ? 'אנונימי' : esc(c.from)}</div><div class="meta">${esc(c.text)}</div><div class="meta">${esc(c.urgency)} · ${rel(c.date)}</div></div>
        ${c.handled ? '<span class="badge green">טופל</span>' : `<button class="btn sm ghost" data-act="handleCounsel" data-id="${c.id}">טופל</button>`}</li>`, 'אין פניות')}` : ''}`;
  };

  PAGES.settings = () => `<h1>הגדרות</h1>
    <h2>תצוגה</h2>
    <div class="card">
      <label class="f" style="margin-top:0">ערכת צבעים</label>
      <div class="chips">${[['auto', 'אוטומטי'], ['light', 'בהיר'], ['dark', 'כהה']].map(([k, l]) => `<button class="chip ${P.theme === k ? 'on' : ''}" data-act="theme" data-id="${k}">${l}</button>`).join('')}</div>
      <div class="switch-row"><span>טקסט מוגדל (נגישות)</span><input type="checkbox" class="toggle" data-pref="bigText" ${P.bigText ? 'checked' : ''}></div>
    </div>
    <h2>התראות</h2>
    <div class="card">
      <div class="switch-row"><span>תזכורת למשימות</span><input type="checkbox" class="toggle" data-pref="notifyHw" ${P.notifyHw ? 'checked' : ''}></div>
      <div class="switch-row"><span>מבחנים קרובים</span><input type="checkbox" class="toggle" data-pref="notifyExams" ${P.notifyExams ? 'checked' : ''}></div>
      <div class="switch-row"><span>הודעות אישיות</span><input type="checkbox" class="toggle" data-pref="notifyMsgs" ${P.notifyMsgs ? 'checked' : ''}></div>
      <button class="btn ghost block" style="margin-top:8px" data-act="askNotify">הפעלת התראות בדפדפן</button>
    </div>
    <h2>חשבון</h2>
    <div class="card stack">
      <button class="btn ghost block" data-act="switchRole">החלפת משתמש / תפקיד</button>
      <button class="btn ghost block" data-act="install">📲 התקנה כאפליקציה במסך הבית</button>
      <button class="btn danger block" data-act="reset">איפוס נתוני ההדגמה</button>
    </div>`;

  PAGES.about = () => `<div style="text-align:center"><img src="icon.svg" width="96" height="96" style="border-radius:24px" alt=""><h1>${esc(S.school.name)}</h1><p class="sub">${esc(S.school.motto)}</p></div>
    <div class="card"><ul class="list">
      <li class="row"><span class="ico-circle">📍</span><span class="grow">${esc(S.school.address)}</span></li>
      <li class="row"><span class="ico-circle">📞</span><a class="grow" href="tel:${esc(S.school.phone)}">${esc(S.school.phone)}</a></li>
      <li class="row"><span class="ico-circle">✉️</span><a class="grow" href="mailto:${esc(S.school.email)}">${esc(S.school.email)}</a></li>
      <li class="row"><span class="ico-circle">🕗</span><span class="grow">${esc(S.school.hours)}</span></li>
    </ul></div>
    <h2>שעות הצלצולים</h2>
    <div class="card"><ul class="list">${S.periods.map(p => `<li class="row" style="padding:6px 0"><b style="width:70px">שיעור ${p.n}</b><span class="grow pill-time"><bdi dir="ltr">${p.from}–${p.to}</bdi></span></li>`).join('')}</ul></div>
    <p class="meta" style="text-align:center;margin-top:16px">גרסה 1.0 · עובד גם ללא חיבור לאינטרנט</p>`;

  PAGES.alerts = () => {
    const a = alerts();
    return `<h1>התראות</h1>${a.length ? `<div class="card"><ul class="list">${a.map(x => `<li class="row"><button class="rowbtn" data-go="${x.go}"><span class="ico-circle">${x.ico}</span><span class="grow">${esc(x.text)}</span><span>‹</span></button></li>`).join('')}</ul></div>` : '<div class="card empty"><div class="e">🔕</div>אין התראות חדשות</div>'}`;
  };

  PAGES.search = () => {
    const q = (PAGES.search.q || '').trim();
    const hl = s => { const e = esc(s); return q ? e.split(esc(q)).join(`<mark>${esc(q)}</mark>`) : e; };
    const hit = s => q && String(s).includes(q);
    const res = !q ? [] : [
      ...S.homework.filter(h => hit(h.title + h.desc + subj(h.subject).name)).map(h => ({ ico: '📝', t: h.title, m: subj(h.subject).name + ' · ' + rel(h.due), go: 'tasks' })),
      ...S.events.filter(e => hit(e.title)).map(e => ({ ico: (EVT[e.type] || EVT.event).ico, t: e.title, m: fmtDate(e.date), go: 'calendar' })),
      ...visibleAnn().filter(a => hit(a.title + a.body)).map(a => ({ ico: '📢', t: a.title, m: a.author, go: 'news/' + a.id })),
      ...S.contacts.filter(c => hit(c.name + c.role)).map(c => ({ ico: '📞', t: c.name, m: c.role, go: 'contacts' })),
      ...Object.values(S.subjects).filter(s => hit(s.name + s.teacher)).map(s => ({ ico: '📚', t: s.name, m: s.teacher, go: 'schedule' }))
    ];
    return `<h1>חיפוש</h1>
      <input class="input" style="margin:10px 0" placeholder="משימות, מבחנים, הודעות, אנשי קשר..." value="${esc(q)}" data-input="searchQ" autofocus>
      ${q ? (res.length ? `<div class="card search-res"><ul class="list">${res.map(r => `<li class="row"><button class="rowbtn" data-go="${r.go}"><span class="ico-circle">${r.ico}</span><span class="grow"><div class="title">${hl(r.t)}</div><div class="meta">${esc(r.m)}</div></span></button></li>`).join('')}</ul></div>` : '<div class="card empty">לא נמצאו תוצאות</div>') : '<p class="meta">התחילו להקליד כדי לחפש בכל האפליקציה</p>'}`;
  };

  // ---------- Navigation ----------
  function tabsFor() {
    if (isTeacher()) return [['home', '🏠', 'בית'], ['roll', '✅', 'נוכחות'], ['tasks', '📝', 'משימות'], ['news', '💬', 'הודעות'], ['more', '☰', 'עוד']];
    if (isAdmin()) return [['home', '📊', 'בקרה'], ['calendar', '📅', 'לוח'], ['news', '📢', 'הודעות'], ['inbox', '📥', 'פניות'], ['more', '☰', 'עוד']];
    if (isParent()) return [['home', '🏠', 'בית'], ['schedule', '🕘', 'מערכת'], ['grades', '📊', 'ציונים'], ['news', '💬', 'הודעות'], ['more', '☰', 'עוד']];
    return [['home', '🏠', 'בית'], ['schedule', '🕘', 'מערכת'], ['tasks', '📝', 'משימות'], ['news', '💬', 'הודעות'], ['more', '☰', 'עוד']];
  }
  const TAB_BADGE = { news: () => unreadAnn() + unreadMsgs(), tasks: () => isStaff() ? 0 : openHw().filter(h => daysFrom(h.due) <= 1).length, inbox: () => S.counsel.filter(c => !c.handled).length + S.absenceReports.filter(r => !r.seen).length };

  function go(r) { location.hash = '#/' + r; }

  function render() {
    if (!S.user) { $('#tabbar').classList.add('hidden'); $('#topbar').classList.add('hidden'); $('#view').innerHTML = PAGES.onboard(); return; }
    $('#tabbar').classList.remove('hidden'); $('#topbar').classList.remove('hidden');
    const [name, param] = (location.hash.replace(/^#\/?/, '') || 'home').split('/');
    const page = PAGES[name] && !['onboard', 'teacherHome', 'adminHome', 'threadList'].includes(name) ? name : 'home';
    const tabs = tabsFor();
    $('#view').innerHTML = PAGES[page](param);
    $('#tabbar').innerHTML = tabs.map(([k, i, l]) => {
      const b = TAB_BADGE[k] ? TAB_BADGE[k]() : 0;
      const on = k === page || (k === 'news' && (page === 'chat' || page === 'messages'));
      return `<button class="${on ? 'on' : ''}" data-go="${k}" aria-label="${l}"><span class="ti">${i}</span>${l}${b ? `<span class="badge count">${b}</span>` : ''}</button>`;
    }).join('');
    $('#backBtn').classList.toggle('hidden', tabs.some(t => t[0] === page) && !param);
    $('#roleLabel').textContent = ROLES[role()].label + (isParent() ? ' · ' + child().name : S.user.classId ? ' · ' + S.user.classId : '');
    $('#bellDot').classList.toggle('hidden', !alerts().length);
    if (page === 'chat') { const c = $('#chatBox'); if (c) window.scrollTo(0, document.body.scrollHeight); }
    else if (render._last !== location.hash) window.scrollTo(0, 0);
    render._last = location.hash;
  }

  // ---------- Forms in sheets ----------
  const subjOptions = (sel) => Object.entries(S.subjects).map(([k, s]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
  const classOptions = (all) => (all ? '<option value="all">כל בית הספר</option>' : '') + S.classes.map(c => `<option ${c === (S.user.classId || 'ח2') ? 'selected' : ''}>${c}</option>`).join('');
  const sheetForm = (title, form, body, submit) => `<h3>${title}</h3><form data-form="${form}">${body}<button class="btn block" style="margin-top:16px">${submit}</button></form>`;
  const mySubject = () => (Object.entries(S.subjects).find(([, s]) => s.teacher === S.user.name) || ['math'])[0];

  const ACTIONS = {
    pickRole: id => { PAGES.onboard.sel = id; render(); },
    finishOnboard: () => {
      const r = PAGES.onboard.sel || 'student';
      const name = ($('#obName').value.trim()) || $('#obName').placeholder;
      const cls = $('#obClass') ? $('#obClass').value : null;
      S.user = { role: r, name, classId: cls };
      save(); go('home'); render(); toast(`ברוכים הבאים, ${name.split(' ')[0]}!`);
    },
    switchRole: () => { S.user = null; save(); location.hash = ''; render(); },
    pickChild: id => { P.childId = id; savePrefs(); render(); },
    pickDay: id => { PAGES.schedule.day = +id; render(); },
    toggleHw: id => {
      const i = S.hwDone.indexOf(id);
      if (i >= 0) S.hwDone.splice(i, 1); else { S.hwDone.push(id); toast('כל הכבוד! ✓ המשימה סומנה כהוגשה'); }
      save(); render();
    },
    hwDetail: id => {
      const h = S.homework.find(x => x.id === id); const s = subj(h.subject);
      const done = S.hwDone.includes(id);
      openSheet(`<span class="badge" style="background:${s.color}22;color:${s.color}">${esc(s.name)}</span><h3 style="margin-top:8px">${esc(h.title)}</h3>
        <p class="meta">להגשה: ${fmtDate(h.due)} (${rel(h.due)}) · ${esc(s.teacher)} · ${esc(h.classId)}</p>
        <div class="card" style="white-space:pre-wrap">${esc(h.desc || 'אין פירוט נוסף')}</div>
        <div class="btn-row" style="margin-top:14px">
          ${isStaff() ? `<button class="btn danger" data-act="delHw" data-id="${id}">מחיקת משימה</button>` : `<button class="btn" data-act="toggleHw" data-id="${id}" data-close-after>${done ? 'ביטול סימון' : '✓ סימון כהוגש'}</button>
          <button class="btn ghost" data-act="askTeacher" data-id="${esc(s.teacher)}">שאלה למורה</button>`}
        </div>`);
    },
    delHw: id => { S.homework = S.homework.filter(h => h.id !== id); save(); closeSheet(); render(); toast('המשימה נמחקה'); },
    askTeacher: name => {
      closeSheet();
      let t = S.threads.find(x => x.with === name);
      if (!t) { t = { id: uid('t'), with: name, role: 'מורה', unread: 0, msgs: [] }; S.threads.push(t); save(); }
      go('chat/' + t.id);
    },
    taskFilter: id => { PAGES.tasks.f = id; render(); },
    taskSubj: id => { PAGES.tasks.s = id; render(); },
    newsCat: id => { PAGES.news.cat = id; render(); },
    lostFilter: id => { PAGES.lost.f = id; render(); },
    calSel: id => { PAGES.calendar.sel = id; const d = parseISO(id); PAGES.calendar.ym = [d.getFullYear(), d.getMonth()]; render(); },
    calMove: id => {
      const now = parseISO(todayISO());
      const ym = PAGES.calendar.ym || [now.getFullYear(), now.getMonth()];
      const d = new Date(ym[0], ym[1] + Number(id), 1);
      PAGES.calendar.ym = [d.getFullYear(), d.getMonth()]; render();
    },
    exportIcs: () => {
      const evs = isStaff() ? S.events : classItems(S.events);
      const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mishur HaNof//HE'];
      evs.forEach(e => { const d = e.date.replace(/-/g, ''); lines.push('BEGIN:VEVENT', `UID:${e.id}@mishur-hanof`, `DTSTART;VALUE=DATE:${d}`, `SUMMARY:${e.title}`, 'END:VEVENT'); });
      lines.push('END:VCALENDAR');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
      a.download = 'mishur-hanof.ics'; a.click();
      toast('קובץ היומן הורד – פתחו אותו כדי להוסיף ליומן');
    },
    shareAnn: id => {
      const a = S.announcements.find(x => x.id === id);
      const text = `${a.title}\n${a.body}\n— ${S.school.name}`;
      if (navigator.share) navigator.share({ title: a.title, text }).catch(() => {});
      else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('ההודעה הועתקה'));
    },
    pinAnn: id => { const a = S.announcements.find(x => x.id === id); a.pinned = !a.pinned; save(); render(); },
    delAnn: id => { if (!confirm('למחוק את ההודעה?')) return; S.announcements = S.announcements.filter(a => a.id !== id); save(); go('news'); toast('ההודעה נמחקה'); },
    newThread: () => openSheet(sheetForm('שיחה חדשה', 'newThread', `
      <label class="f">אל</label><select class="input" name="to">${S.contacts.filter(c => c.group !== 'קהילה').map(c => `<option value="${esc(c.name)}|${esc(c.role)}">${esc(c.name)} – ${esc(c.role)}</option>`).join('')}</select>
      <label class="f">הודעה</label><textarea class="input" name="text" required></textarea>`, 'שליחה')),
    signPermit: id => {
      const p = S.permits.find(x => x.id === id);
      openSheet(sheetForm('חתימה על ' + esc(p.title), 'signPermit', `<input type="hidden" name="id" value="${id}">
        <p class="meta">${esc(p.desc)}</p>
        <label class="f">שם ההורה החותם</label><input class="input" name="name" required value="${esc(S.user.name)}">
        <div class="switch-row"><span>קראתי ואני מאשר/ת את השתתפות ${esc(child().name)}</span><input type="checkbox" class="toggle" name="ok" required></div>
        ${p.cost ? `<div class="notice info">💳 סכום לתשלום: <b>&nbsp;${p.cost} ₪</b>&nbsp;– התשלום יבוצע דרך מערכת התשלומים של בית הספר</div>` : ''}`, p.cost ? 'חתימה ומעבר לתשלום' : 'חתימה'));
    },
    joinClub: id => {
      const c = S.clubs.find(x => x.id === id);
      c.joined = !c.joined; c.seats += c.joined ? -1 : 1; save(); render();
      toast(c.joined ? `נרשמת לחוג ${c.name} 🎉` : 'ההרשמה בוטלה');
    },
    vote: v => { const [id, i] = v.split(':'); const p = S.polls.find(x => x.id === id); if (p.voted != null) return; p.voted = +i; p.options[+i].v++; save(); render(); toast('ההצבעה נקלטה'); },
    lostDone: id => { S.lostFound.find(l => l.id === id).done = true; save(); render(); toast('מעולה! הפריט הוסר מהרשימה'); },
    newLost: () => openSheet(sheetForm('פרסום פריט', 'newLost', `
      <div class="chips"><label class="chip"><input type="radio" name="type" value="lost" checked> איבדתי</label><label class="chip"><input type="radio" name="type" value="found"> מצאתי</label></div>
      <label class="f">מה?</label><input class="input" name="item" required placeholder="למשל: מחשבון כחול">
      <label class="f">איפה?</label><input class="input" name="place" required placeholder="למשל: אולם ספורט">
      <label class="f">איך ליצור קשר?</label><input class="input" name="contact" value="${esc(S.user.name)}">`, 'פרסום')),
    renew: id => { const b = S.library.find(x => x.id === id); const d = parseISO(b.due); d.setDate(d.getDate() + 14); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); b.due = d.toISOString().slice(0, 10); save(); render(); toast('ההשאלה הוארכה בשבועיים'); },
    mark: v => { const [s, k] = v.split('|'); const t = todayISO(); S.classAttendance = S.classAttendance || {}; S.classAttendance[t] = S.classAttendance[t] || {}; S.classAttendance[t][s] = k; save(); render(); },
    saveRoll: () => {
      const t = todayISO(); S.classAttendance = S.classAttendance || {}; const rec = S.classAttendance[t] = S.classAttendance[t] || {};
      S.students.forEach(s => { if (!rec[s]) rec[s] = 'p'; }); save();
      const missing = S.students.filter(s => rec[s] === 'a').length;
      toast(`הנוכחות נשמרה · ${missing} חסרים${missing ? ' – הורים יקבלו עדכון' : ''}`); go('home');
    },
    seeReport: id => { S.absenceReports.find(r => r.id === id).seen = true; save(); render(); toast('הדיווח סומן כנקרא'); },
    handleCounsel: id => { S.counsel.find(c => c.id === id).handled = true; save(); render(); },
    whatIf: () => openSheet(sheetForm('מחשבון "מה אם" 🧮', 'whatIf', `<p class="meta">בדקו איך ציון עתידי ישפיע על הממוצע</p>
      <label class="f">מקצוע</label><select class="input" name="subject">${subjOptions('math')}</select>
      <div class="grid2"><div><label class="f">ציון משוער</label><input class="input" type="number" min="0" max="100" name="score" value="90" required></div>
      <div><label class="f">משקל</label><select class="input" name="weight"><option value="1">בוחן (1)</option><option value="2" selected>מבחן (2)</option></select></div></div>
      <div id="whatIfRes" class="notice info" style="margin-top:12px">הזינו ציון וחשבו</div>`, 'חישוב')),
    newHw: () => openSheet(sheetForm('משימה חדשה', 'newHw', `
      <div class="grid2"><div><label class="f">מקצוע</label><select class="input" name="subject">${subjOptions(mySubject())}</select></div>
      <div><label class="f">כיתה</label><select class="input" name="classId">${classOptions()}</select></div></div>
      <label class="f">כותרת</label><input class="input" name="title" required placeholder="למשל: תרגילים 1–10 עמ׳ 50">
      <label class="f">פירוט</label><textarea class="input" name="desc"></textarea>
      <label class="f">תאריך הגשה</label><input class="input" type="date" name="due" value="${addDaysISO(2)}" required>`, 'פרסום לתלמידים')),
    newGrade: () => openSheet(sheetForm('הזנת ציון', 'newGrade', `
      <label class="f">תלמיד/ה</label><select class="input" name="student">${S.students.map(s => `<option>${esc(s)}</option>`).join('')}</select>
      <div class="grid2"><div><label class="f">מקצוע</label><select class="input" name="subject">${subjOptions(mySubject())}</select></div>
      <div><label class="f">ציון</label><input class="input" type="number" min="0" max="100" name="score" required></div></div>
      <label class="f">שם המטלה</label><input class="input" name="title" required placeholder="למשל: מבחן – משוואות">
      <label class="f">משקל</label><select class="input" name="weight"><option value="1">בוחן / עבודה (1)</option><option value="2">מבחן (2)</option></select>`, 'שמירת ציון')),
    newEvent: () => openSheet(sheetForm('אירוע / מבחן חדש', 'newEvent', `
      <label class="f">סוג</label><select class="input" name="type">${Object.entries(EVT).map(([k, t]) => `<option value="${k}">${t.ico} ${t.label}</option>`).join('')}</select>
      <label class="f">כותרת</label><input class="input" name="title" required>
      <div class="grid2"><div><label class="f">תאריך</label><input class="input" type="date" name="date" value="${addDaysISO(7)}" required></div>
      <div><label class="f">קהל יעד</label><select class="input" name="classId">${classOptions(true)}</select></div></div>
      <label class="f">שעה (לא חובה)</label><input class="input" type="time" name="time">`, 'הוספה ללוח')),
    newAnn: () => openSheet(sheetForm('פרסום הודעה', 'newAnn', `
      <label class="f">כותרת</label><input class="input" name="title" required>
      <label class="f">תוכן</label><textarea class="input" name="body" required></textarea>
      <div class="grid2"><div><label class="f">קהל יעד</label><select class="input" name="audience"><option value="all">כולם</option><option value="students">תלמידים</option><option value="parents">הורים</option></select></div>
      <div><label class="f">קטגוריה</label><select class="input" name="cat"><option>הנהלה</option><option>כיתתי</option><option>טיולים</option><option>חוגים</option><option>תרבות</option><option>דחוף</option></select></div></div>
      <div class="switch-row"><span>הצמדה לראש הרשימה</span><input type="checkbox" class="toggle" name="pinned"></div>`, 'פרסום')),
    newChange: () => openSheet(sheetForm('שינוי במערכת', 'newChange', `
      <div class="grid2"><div><label class="f">תאריך</label><input class="input" type="date" name="date" value="${addDaysISO(1)}" required></div>
      <div><label class="f">שיעור</label><select class="input" name="period">${S.periods.map(p => `<option value="${p.n}">${p.n} (${p.from})</option>`).join('')}</select></div></div>
      <label class="f">תיאור השינוי</label><input class="input" name="text" required placeholder="למשל: מתמטיקה – מבוטל / חדר 14">`, 'פרסום שינוי')),
    newNote: () => openSheet(sheetForm('משוב לתלמיד/ה', 'newNote', `
      <label class="f">תלמיד/ה</label><select class="input" name="student">${S.students.map(s => `<option>${esc(s)}</option>`).join('')}</select>
      <div class="grid2"><div><label class="f">סוג</label><select class="input" name="type"><option value="praise">⭐ שבח</option><option value="missing">🎒 חוסר ציוד</option><option value="behavior">⚠️ התנהגות</option></select></div>
      <div><label class="f">מקצוע</label><select class="input" name="subject">${subjOptions(mySubject())}</select></div></div>
      <label class="f">תוכן</label><input class="input" name="text" required>`, 'שליחה')),
    newPoll: () => openSheet(sheetForm('סקר חדש', 'newPoll', `
      <label class="f">שאלה</label><input class="input" name="q" required>
      <label class="f">אפשרויות (אחת בכל שורה)</label><textarea class="input" name="opts" required placeholder="כן&#10;לא"></textarea>`, 'פרסום סקר')),
    newPermit: () => openSheet(sheetForm('טופס חדש לחתימת הורים', 'newPermit', `
      <label class="f">כותרת</label><input class="input" name="title" required>
      <label class="f">פירוט</label><textarea class="input" name="desc" required></textarea>
      <div class="grid2"><div><label class="f">חתימה עד</label><input class="input" type="date" name="due" value="${addDaysISO(7)}" required></div>
      <div><label class="f">עלות (₪)</label><input class="input" type="number" min="0" name="cost" value="0"></div></div>`, 'שליחה להורים')),
    theme: id => { P.theme = id; savePrefs(); render(); },
    askNotify: () => {
      if (!('Notification' in window)) return toast('הדפדפן לא תומך בהתראות');
      Notification.requestPermission().then(p => {
        if (p === 'granted') { new Notification('מישור הנוף', { body: 'ההתראות הופעלו בהצלחה 🎉', icon: 'icon.svg' }); toast('ההתראות הופעלו'); }
        else toast('ההרשאה להתראות לא ניתנה');
      });
    },
    install: () => {
      if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; return; }
      openSheet(`<h3>התקנה במסך הבית</h3><p><b>אייפון (Safari):</b> כפתור השיתוף ⬆️ ← "הוסף למסך הבית".</p><p><b>אנדרואיד (Chrome):</b> תפריט ⋮ ← "התקנת אפליקציה".</p><button class="btn block" data-close>הבנתי</button>`);
    },
    reset: () => { if (!confirm('לאפס את כל נתוני ההדגמה?')) return; localStorage.removeItem(KEY); S = load(); location.hash = ''; render(); toast('הנתונים אופסו'); }
  };

  const FORMS = {
    sendMsg: (fd, el) => {
      const t = S.threads.find(x => x.id === el.dataset.id);
      const text = fd.get('text').trim(); if (!text) return;
      const now = new Date(); const time = todayISO() + 'T' + now.toTimeString().slice(0, 5);
      t.msgs.push({ from: 'me', text, time }); save(); render();
      // Demo: simulated auto-acknowledgement
      setTimeout(() => {
        t.msgs.push({ from: 'them', text: 'תודה, קיבלתי. אחזור אליך בהקדם 🙏', time: todayISO() + 'T' + new Date().toTimeString().slice(0, 5) });
        if (!location.hash.includes(t.id)) t.unread = (t.unread || 0) + 1;
        save(); render();
      }, 1800);
    },
    newThread: fd => {
      const [name, r] = fd.get('to').split('|');
      let t = S.threads.find(x => x.with === name);
      if (!t) { t = { id: uid('t'), with: name, role: r, unread: 0, msgs: [] }; S.threads.push(t); }
      t.msgs.push({ from: 'me', text: fd.get('text'), time: todayISO() + 'T' + new Date().toTimeString().slice(0, 5) });
      save(); closeSheet(); go('chat/' + t.id);
    },
    absence: fd => {
      if (fd.get('to') < fd.get('from')) return toast('תאריך הסיום לפני תאריך ההתחלה');
      S.absenceReports.push({ id: uid('ar'), child: fd.get('child'), from: fd.get('from'), to: fd.get('to'), reason: fd.get('reason'), note: fd.get('note'), seen: false, date: todayISO() });
      save(); render(); toast('הדיווח נשלח למחנכת ✓');
    },
    counsel: (fd, el) => {
      S.counsel.push({ id: uid('cs'), topic: fd.get('topic'), text: fd.get('text'), urgency: fd.get('urgency'), anon: !!fd.get('anon'), from: S.user.name + (S.user.classId ? ' (' + S.user.classId + ')' : ''), date: todayISO(), handled: false });
      save(); el.reset();
      openSheet(`<div style="text-align:center"><div style="font-size:3rem">💚</div><h3>הפנייה נשלחה</h3><p>היועצת תחזור אליך ${fd.get('urgency') === 'דחוף' ? 'עוד היום' : 'בימים הקרובים'}. תודה ששיתפת – זה אמיץ.</p><button class="btn block" data-close>סגירה</button></div>`);
    },
    signPermit: fd => {
      const p = S.permits.find(x => x.id === fd.get('id'));
      p.signed = true; p.paid = true; p.signedBy = fd.get('name'); save(); closeSheet(); render();
      toast('האישור נחתם בהצלחה ✓');
    },
    newLost: fd => { S.lostFound.unshift({ id: uid('l'), type: fd.get('type'), item: fd.get('item'), place: fd.get('place'), contact: fd.get('contact'), date: todayISO(), done: false }); save(); closeSheet(); render(); toast('הפריט פורסם'); },
    whatIf: fd => {
      const k = fd.get('subject'); const score = Math.max(0, Math.min(100, +fd.get('score'))); const w = +fd.get('weight');
      const before = overallAvg();
      const saved = S.grades;
      S.grades = saved.concat([{ subject: k, score, weight: w }]);
      const avgs = subjectAverages(); const after = overallAvg(avgs);
      const sAvg = avgs.find(a => a.k === k).avg;
      S.grades = saved;
      const diff = after - before;
      $('#whatIfRes').innerHTML = `ממוצע ב${esc(subj(k).name)}: <b>&nbsp;${sAvg.toFixed(1)}&nbsp;</b> · ממוצע כללי: <b>&nbsp;${after.toFixed(1)}&nbsp;</b> (${diff >= 0 ? '+' : ''}${diff.toFixed(2)})`;
    },
    newHw: fd => { S.homework.push({ id: uid('h'), subject: fd.get('subject'), classId: fd.get('classId'), title: fd.get('title'), desc: fd.get('desc'), due: fd.get('due'), attach: '' }); save(); closeSheet(); render(); toast('המשימה פורסמה לתלמידי ' + fd.get('classId')); },
    newGrade: fd => {
      // Demo: grades for the first student are mirrored into the student/parent view
      if (fd.get('student') === S.students[0]) S.grades.push({ id: uid('g'), subject: fd.get('subject'), title: fd.get('title'), score: +fd.get('score'), weight: +fd.get('weight'), date: todayISO() });
      save(); closeSheet(); render(); toast(`הציון של ${fd.get('student')} נשמר`);
    },
    newEvent: fd => { S.events.push({ id: uid('e'), type: fd.get('type'), title: fd.get('title'), date: fd.get('date'), classId: fd.get('classId'), time: fd.get('time') }); save(); closeSheet(); render(); toast('האירוע נוסף ללוח'); },
    newAnn: fd => { S.announcements.unshift({ id: uid('an'), title: fd.get('title'), body: fd.get('body'), audience: fd.get('audience'), cat: fd.get('cat'), pinned: !!fd.get('pinned'), author: S.user.name, date: todayISO() }); save(); closeSheet(); go('news'); toast('ההודעה פורסמה'); },
    newChange: fd => { S.changes.push({ id: uid('ch'), date: fd.get('date'), period: +fd.get('period'), text: fd.get('text') }); save(); closeSheet(); render(); toast('השינוי פורסם ונשלחה התראה'); },
    newNote: fd => {
      if (fd.get('student') === S.students[0]) S.notes.push({ id: uid('n'), date: todayISO(), subject: fd.get('subject'), type: fd.get('type'), text: fd.get('text') });
      save(); closeSheet(); toast('המשוב נשלח לתלמיד/ה ולהורים');
    },
    newPoll: fd => {
      const opts = fd.get('opts').split('\n').map(s => s.trim()).filter(Boolean);
      if (opts.length < 2) return toast('יש להזין לפחות שתי אפשרויות');
      S.polls.unshift({ id: uid('po'), q: fd.get('q'), options: opts.map(t => ({ t, v: 0 })), voted: null }); save(); closeSheet(); go('polls'); toast('הסקר פורסם');
    },
    newPermit: fd => { S.permits.unshift({ id: uid('p'), title: fd.get('title'), desc: fd.get('desc'), due: fd.get('due'), cost: +fd.get('cost') || 0, signed: false, paid: false }); save(); closeSheet(); render(); toast('הטופס נשלח לחתימת ההורים'); }
  };

  // ---------- Events ----------
  document.addEventListener('click', e => {
    const close = e.target.closest('[data-close]');
    if (close) { closeSheet(); return; }
    const goEl = e.target.closest('[data-go]');
    if (goEl) { e.preventDefault(); closeSheet(); go(goEl.dataset.go); return; }
    const act = e.target.closest('[data-act]');
    if (act && ACTIONS[act.dataset.act]) {
      e.preventDefault();
      ACTIONS[act.dataset.act](act.dataset.id);
      if (act.hasAttribute('data-close-after')) closeSheet();
    }
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('[data-form]');
    if (!f || !FORMS[f.dataset.form]) return;
    e.preventDefault();
    FORMS[f.dataset.form](new FormData(f), f);
  });
  document.addEventListener('change', e => {
    const p = e.target.dataset.pref;
    if (p) { P[p] = e.target.checked; savePrefs(); render(); }
  });
  document.addEventListener('input', e => {
    const k = e.target.dataset.input;
    if (!k) return;
    const page = k === 'searchQ' ? PAGES.search : PAGES.contacts;
    page.q = e.target.value;
    const pos = e.target.selectionStart;
    render();
    const el = document.querySelector(`[data-input="${k}"]`);
    if (el) { el.focus(); el.setSelectionRange(pos, pos); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

  $('#backBtn').addEventListener('click', () => history.length > 1 ? history.back() : go('home'));
  $('#bellBtn').addEventListener('click', () => go('alerts'));
  $('#searchBtn').addEventListener('click', () => go('search'));
  window.addEventListener('hashchange', render);

  let deferredInstall = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });

  // Keep the "now" lesson card fresh on the home and schedule screens
  setInterval(() => {
    const page = (location.hash.replace(/^#\/?/, '') || 'home').split('/')[0];
    if ((page === 'home' || page === 'schedule') && $('#sheet').classList.contains('hidden') && document.activeElement.tagName !== 'INPUT') render();
  }, 60000);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});

  applyPrefs();
  render();
})();
