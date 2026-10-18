/**
 * DE Mastery Pro — Application Engine
 * Pure modern Vanilla JavaScript (Zero build step, 100% offline-ready PWA)
 */

(function () {
  'use strict';

  const C = window.DE_CONTENT;
  const SQL = window.DE_SQL;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // Application State
  let S = {
    view: 'dashboard',
    module: 0,
    lesson: 0,
    filter: 'All',
    search: '',
    // Quiz state
    quizMode: 'practice', // 'practice', 'exam', 'flashcards', 'missed'
    quizCategory: 'All',
    quizQuestions: [],
    qi: 0,
    choice: null,
    checked: false,
    score: 0,
    examTimer: 1200, // 20 mins
    examInterval: null,
    flashFlipped: false,
    // SQL Lab State
    activeSqlChallengeId: 'c1',
    activeSqlTable: 'orders'
  };

  // Persistent User Progress (localStorage)
  let P = loadProgress();

  function loadProgress() {
    try {
      const data = JSON.parse(localStorage.getItem('deMasteryPro_v2'));
      if (data && Array.isArray(data.done)) {
        return {
          done: data.done || [],
          weeks: data.weeks || [],
          best: data.best || 0,
          attempts: data.attempts || 0,
          missed: data.missed || [],
          bookmarked: data.bookmarked || [],
          notes: data.notes || { text: '' },
          projects: data.projects || {},
          theme: data.theme || 'dark',
          streak: data.streak || { count: 1, lastDate: new Date().toISOString().split('T')[0] },
          voiceGender: data.voiceGender || 'male',
          audioRate: data.audioRate || 0.9
        };
      }
    } catch (e) {}

    return {
      done: [],
      weeks: [],
      best: 0,
      attempts: 0,
      missed: [],
      bookmarked: [],
      notes: { text: '' },
      projects: {},
      theme: 'dark',
      streak: { count: 1, lastDate: new Date().toISOString().split('T')[0] },
      voiceGender: 'male',
      audioRate: 0.9
    };
  }

  function saveProgress() {
    localStorage.setItem('deMasteryPro_v2', JSON.stringify(P));
    updateBadges();
  }

  function updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    if (!P.streak) P.streak = { count: 1, lastDate: today };

    if (P.streak.lastDate !== today) {
      const last = new Date(P.streak.lastDate);
      const curr = new Date(today);
      const diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        P.streak.count += 1;
      } else if (diffDays > 1) {
        P.streak.count = 1; // streak reset
      }
      P.streak.lastDate = today;
      saveProgress();
    }
    const el = $('#streakCount');
    if (el) el.textContent = P.streak.count || 1;
  }

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function getAllLessons() {
    return C.modules.flatMap((m, mi) =>
      m.lessons.map((l, li) => ({ ...l, mi, li, key: `${mi}-${li}`, module: m }))
    );
  }

  function getOverallPercent() {
    const all = getAllLessons();
    return Math.round((P.done.length / Math.max(1, all.length)) * 100);
  }

  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => el.classList.add('hidden'), 2200);
  }

  function updateBadges() {
    const all = getAllLessons();
    const lb = $('#lessonsBadge');
    if (lb) lb.textContent = `${P.done.length}/${all.length}`;
    const rb = $('#roadmapBadge');
    if (rb) rb.textContent = `${P.weeks.length}/16`;
    const qb = $('#quizBadge');
    if (qb) qb.textContent = `${P.best}%`;
  }

  // ==========================================================================
  // TEXT TO SPEECH (TTS) NARRATOR
  // ==========================================================================
  let speaking = false;
  let currentUtterance = null;

  function pickVoice(gender) {
    const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() || [] : [];
    if (gender === 'male') {
      const maleNames = ['Google UK English Male', 'Google US English', 'Microsoft David', 'Microsoft Mark', 'Daniel', 'Alex', 'Microsoft Ravi', 'Google हिन्दी'];
      for (const name of maleNames) {
        const v = voices.find(x => x.name.includes(name));
        if (v) return v;
      }
      const m = voices.find(v => v.lang && v.lang.startsWith('en') && /male|david|mark|alex|daniel/i.test(v.name));
      if (m) return m;
    } else {
      const femaleNames = ['Google UK English Female', 'Microsoft Zira', 'Samantha', 'Victoria', 'Karen'];
      for (const name of femaleNames) {
        const v = voices.find(x => x.name.includes(name));
        if (v) return v;
      }
    }
    const en = voices.find(v => v.lang && (v.lang.startsWith('en') || v.lang.startsWith('hi')));
    return en || voices[0] || null;
  }

  function prepSpeechText(t) {
    if (!t) return '';
    let s = String(t);
    const map = {
      'ETL': 'E T L', 'ELT': 'E L T', 'SQL': 'S Q L', 'AWS': 'A W S', 'S3': 'S 3',
      'IAM': 'I A M', 'CDC': 'C D C', 'SCD': 'S C D', 'API': 'A P I', 'JSON': 'J S O N',
      'CSV': 'C S V', 'dbt': 'd b t', 'OLTP': 'O L T P', 'OLAP': 'O L A P',
      'PySpark': 'Pie Spark', 'DataFrame': 'Data Frame', 'Parquet': 'Par kay',
      'Redshift': 'Red shift', 'Athena': 'Athena', 'Glue': 'Glue', 'Lambda': 'Lambda',
      'Airflow': 'Air flow', 'Docker': 'Docker', 'Git': 'Git', 'Kafka': 'Kafka',
      'Iceberg': 'Iceberg', 'Delta Lake': 'Delta Lake', 'PWA': 'P W A'
    };
    for (const [k, v] of Object.entries(map)) {
      s = s.replace(new RegExp('\\b' + k + '\\b', 'g'), v);
    }
    s = s.replace(/[•·]/g, '. ');
    s = s.replace(/\n+/g, '. ');
    s = s.replace(/\s{2,}/g, ' ');
    return s.trim();
  }

  function stopSpeak() {
    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    speaking = false;
    currentUtterance = null;
    const btn = $('#speakBtn');
    if (btn) {
      btn.textContent = '🔊 Listen Lesson';
      btn.classList.remove('btn-install');
    }
  }

  function speakLesson() {
    if (!window.speechSynthesis) {
      toast('Speech synthesis is not supported on this browser.');
      return;
    }
    if (speaking) {
      stopSpeak();
      return;
    }

    const m = C.modules[S.module];
    const l = m && m.lessons ? m.lessons[S.lesson] : null;
    if (!l) return;

    const raw = `${l.title}. ${l.explanation}. Takeaway: ${l.takeaway}`;
    const cleanText = prepSpeechText(raw);

    const u = new SpeechSynthesisUtterance(cleanText);
    u.rate = P.audioRate || 0.9;
    u.pitch = P.voiceGender === 'female' ? 1.1 : 0.95;

    const voice = pickVoice(P.voiceGender);
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang || 'en-IN';
    } else {
      u.lang = 'en-IN';
    }

    u.onend = () => {
      speaking = false;
      const b = $('#speakBtn');
      if (b) {
        b.textContent = '🔊 Listen Lesson';
        b.classList.remove('btn-install');
      }
    };
    u.onerror = () => {
      speaking = false;
      toast('Audio voice encountered an issue.');
    };

    window.speechSynthesis.cancel();
    speaking = true;
    currentUtterance = u;
    window.speechSynthesis.speak(u);

    const btn = $('#speakBtn');
    if (btn) {
      btn.textContent = '⏹ Stop Audio';
      btn.classList.add('btn-install');
    }
    toast('Audio playing with ' + (P.voiceGender || 'male') + ' voice...');
  }

  // ==========================================================================
  // NAVIGATION ROUTING
  // ==========================================================================
  function go(viewName) {
    stopSpeak();
    if (S.examInterval) {
      clearInterval(S.examInterval);
      S.examInterval = null;
    }
    S.view = viewName;
    render();
    syncNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openLesson(mi, li) {
    stopSpeak();
    S.view = 'lesson';
    S.module = mi;
    S.lesson = li;
    render();
    syncNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function syncNav() {
    $$('[data-view]').forEach((b) => {
      b.classList.toggle('active', b.dataset.view === S.view);
    });
  }

  // ==========================================================================
  // VIEW: DASHBOARD
  // ==========================================================================
  function dashboardView() {
    const all = getAllLessons();
    const pct = getOverallPercent();
    const nextLesson = all.find(l => !P.done.includes(l.key)) || all[0];

    return `
      <section class="hero-card">
        <div class="hero-glow-blob"></div>
        <div class="page-eyebrow">YOUR JOURNEY · ROADMAP 2026</div>
        <h1 class="hero-title">From Zero to <span class="gradient-text">Hero Data Engineer.</span></h1>
        <p class="page-lead" style="color:rgba(255,255,255,0.85);margin-bottom:20px">
          Master SQL, Python, Kimball Data Modeling, PySpark Distributed Processing, AWS Data Stack, Airflow, dbt, and Apache Iceberg. Free, ad-free, 100% offline-ready.
        </p>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="openLesson(${nextLesson.mi}, ${nextLesson.li})">
            ▶ Continue Learning: ${esc(nextLesson.title)}
          </button>
          <button class="btn btn-secondary" onclick="go('roadmap')">
            ◫ View 16-Week Plan
          </button>
          <button class="btn btn-secondary" onclick="go('sqllab')">
            ⚡ Open SQL Practice Lab
          </button>
        </div>
        <div class="hero-stats-row">
          <div class="hero-stat-pill">⚡ <b>17</b> Modules</div>
          <div class="hero-stat-pill">📚 <b>50+</b> Deep Lessons</div>
          <div class="hero-stat-pill">✳ <b>130+</b> Quizzes</div>
          <div class="hero-stat-pill">💼 <b>5</b> Portfolio Blueprints</div>
          <div class="hero-stat-pill">🎯 <b>40+</b> Interview Q&As</div>
        </div>
      </section>

      <!-- 4 METRIC CARDS -->
      <div class="grid">
        <div class="card card-stat col-3">
          <div class="stat-label">Lessons Completed</div>
          <div class="stat-number">${P.done.length}<span style="font-size:18px;color:var(--text-muted)"> / ${all.length}</span></div>
          <div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
          <div class="stat-meta">${pct}% of curriculum mastered</div>
        </div>
        <div class="card card-stat col-3">
          <div class="stat-label">Roadmap Milestone</div>
          <div class="stat-number">${P.weeks.length}<span style="font-size:18px;color:var(--text-muted)"> / 16</span></div>
          <div class="progress-bar"><div class="progress-bar-fill" style="width:${Math.round(P.weeks.length/16*100)}%"></div></div>
          <div class="stat-meta">Weeks checked complete</div>
        </div>
        <div class="card card-stat col-3">
          <div class="stat-label">Best Quiz Score</div>
          <div class="stat-number">${P.best}%</div>
          <div class="progress-bar"><div class="progress-bar-fill" style="width:${P.best}%"></div></div>
          <div class="stat-meta">${P.attempts} quiz sessions completed</div>
        </div>
        <div class="card card-stat col-3">
          <div class="stat-label">Daily Streak</div>
          <div class="stat-number">🔥 ${P.streak.count || 1} <span style="font-size:16px;color:var(--text-muted)">Days</span></div>
          <div class="progress-bar"><div class="progress-bar-fill" style="width:100%;background:var(--accent-amber)"></div></div>
          <div class="stat-meta">Consistency beats intensity!</div>
        </div>
      </div>

      <!-- ZERO TO HERO JOURNEY STEPPER -->
      <div class="card" style="margin-bottom:28px">
        <div class="page-eyebrow">THE 4-STAGE MILESTONE MAP</div>
        <h3 style="font-size:17px;font-weight:800;margin-bottom:16px">Zero to Hero Pathway</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">
          <div style="padding:14px;border-radius:var(--radius-md);background:var(--bg-subtle);border-left:3px solid var(--accent-emerald)">
            <b style="color:var(--accent-emerald)">Month 1: Foundations</b>
            <p style="font-size:12px;color:var(--text-secondary);margin-top:4px">SQL Basics to Window Functions + Python & Pandas memory-safe batching.</p>
          </div>
          <div style="padding:14px;border-radius:var(--radius-md);background:var(--bg-subtle);border-left:3px solid var(--accent-cyan)">
            <b style="color:var(--accent-cyan)">Month 2: Core Data Engineering</b>
            <p style="font-size:12px;color:var(--text-secondary);margin-top:4px">Kimball Star Schema, SCD 1 & 2 + PySpark Distributed Computing & Tuning.</p>
          </div>
          <div style="padding:14px;border-radius:var(--radius-md);background:var(--bg-subtle);border-left:3px solid var(--accent-purple)">
            <b style="color:var(--accent-purple)">Month 3: Cloud & Modern Stack</b>
            <p style="font-size:12px;color:var(--text-secondary);margin-top:4px">AWS S3, Glue, Athena, Redshift + Airflow DAGs, dbt models, and Iceberg Lakehouse.</p>
          </div>
          <div style="padding:14px;border-radius:var(--radius-md);background:var(--bg-subtle);border-left:3px solid var(--accent-amber)">
            <b style="color:var(--accent-amber)">Month 4: Projects & Job Hunt</b>
            <p style="font-size:12px;color:var(--text-secondary);margin-top:4px">3 GitHub Blueprints, ATS 1-page resume, daily SQL mocks, and applications.</p>
          </div>
        </div>
      </div>

      <!-- FEATURED MODULES -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <h2 style="font-size:20px;font-weight:800">Featured Learning Modules</h2>
          <p style="font-size:12px;color:var(--text-secondary)">Follow the sequence strictly. Foundations first!</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="go('learn')">Explore All 17 Modules →</button>
      </div>

      <div class="grid">
        ${C.modules.slice(0, 6).map((m, i) => renderModuleCard(m, i)).join('')}
      </div>
    `;
  }

  function renderModuleCard(m, i) {
    const total = m.lessons.length;
    const done = m.lessons.filter((l, j) => P.done.includes(`${i}-${j}`)).length;
    const pct = Math.round((done / total) * 100);

    return `
      <div class="card col-6">
        <div class="module-card">
          <div class="module-num">${String(i).padStart(2, '0')}</div>
          <div class="module-body">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <h3 class="module-title">${esc(m.title)}</h3>
            </div>
            <p class="module-desc">${esc(m.desc)}</p>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
              <span class="tag tag-cyan">${esc(m.period)}</span>
              <span class="tag ${done === total ? 'tag-emerald' : ''}">${done}/${total} Completed</span>
            </div>
            <div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
            <button class="btn btn-secondary btn-sm" style="margin-top:8px" onclick="openLesson(${i}, 0)">
              ${done > 0 ? 'Continue Module →' : 'Start Module →'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // VIEW: 16-WEEK ROADMAP
  // ==========================================================================
  function roadmapView() {
    const pct = Math.round((P.weeks.length / 16) * 100);

    return `
      <div class="page-eyebrow">YOUR 4-5 MONTH BLUEPRINT</div>
      <h1 class="page-title">16-Week Fresher Roadmap Tracker</h1>
      <p class="page-lead">
        Based directly on the 2026 Fresher Roadmap PDF. Study 3.5 to 5 focused hours daily. Mark each week complete as you finish hands-on practice.
      </p>

      <div class="card" style="margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <b>Overall Roadmap Completion: ${P.weeks.length} of 16 Weeks Done</b>
          <span class="tag tag-emerald">${pct}% Job-Ready</span>
        </div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      </div>

      <!-- WEEKLY STUDY PLAN TEMPLATE -->
      <div class="card" style="margin-bottom:28px;background:linear-gradient(135deg,rgba(6,182,212,0.08),rgba(16,185,129,0.04))">
        <h3 style="font-size:16px;font-weight:800;color:var(--accent-cyan);margin-bottom:8px">📅 Daily Routine Template (Sample)</h3>
        <p style="font-size:12.5px;color:var(--text-secondary);margin-bottom:14px">
          Morning: New Concept + Notes (2-3 hrs) | Evening: Hands-on Coding + SQL Practice (1.5-2 hrs)
        </p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;font-size:11px">
          <div style="padding:8px;background:var(--bg-card);border-radius:8px"><b>Mon:</b> Concept + Video</div>
          <div style="padding:8px;background:var(--bg-card);border-radius:8px"><b>Tue:</b> Hands-on examples</div>
          <div style="padding:8px;background:var(--bg-card);border-radius:8px"><b>Wed:</b> SQL Practice (Must!)</div>
          <div style="padding:8px;background:var(--bg-card);border-radius:8px"><b>Thu:</b> Tool & Pipeline lab</div>
          <div style="padding:8px;background:var(--bg-card);border-radius:8px"><b>Fri:</b> Error debugging</div>
          <div style="padding:8px;background:var(--bg-card);border-radius:8px"><b>Sat:</b> GitHub Project coding</div>
          <div style="padding:8px;background:var(--bg-card);border-radius:8px"><b>Sun:</b> Revision & Planning</div>
        </div>
      </div>

      <!-- 16 WEEKS GRID -->
      <div class="grid">
        ${C.weeks.map(w => `
          <div class="card col-6">
            <div style="display:flex;gap:14px;align-items:flex-start">
              <div class="module-num" style="width:42px;height:42px;font-size:14px">${String(w[0]).padStart(2, '0')}</div>
              <div style="flex:1">
                <span class="tag tag-cyan" style="font-size:9.5px;margin-bottom:4px">${esc(w[1])}</span>
                <h3 style="font-size:15px;font-weight:700;margin:4px 0">${esc(w[2])}</h3>
                <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px">${esc(w[3])}</p>
                
                <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--border-subtle)">
                  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12.5px;font-weight:600">
                    <input type="checkbox" ${P.weeks.includes(w[0]) ? 'checked' : ''} onchange="toggleWeek(${w[0]}, this.checked)" style="accent-color:var(--accent-emerald);width:16px;height:16px">
                    Mark Week Complete
                  </label>
                  <button class="btn btn-secondary btn-sm" onclick="openLesson(${w[4]}, 0)">
                    Study Module →
                  </button>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- SALARY RANGE GUIDE -->
      <div class="card" style="margin-top:20px">
        <h3 style="font-size:16px;font-weight:800;margin-bottom:12px">💰 Expected Fresher Salary Range (India 2026)</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px">
          <div style="padding:14px;border-radius:var(--radius-md);background:var(--bg-subtle)">
            <b style="color:var(--text-primary)">Service-Based Companies</b>
            <div style="font-size:18px;font-weight:800;color:var(--accent-cyan);margin:4px 0">₹3.5 – 6.5 LPA</div>
            <p style="font-size:11px;color:var(--text-muted)">TCS, Infosys, Wipro, Cognizant, Accenture. Great for initial industry launch.</p>
          </div>
          <div style="padding:14px;border-radius:var(--radius-md);background:var(--bg-subtle)">
            <b style="color:var(--text-primary)">Mid-Size Tech / Analytics</b>
            <div style="font-size:18px;font-weight:800;color:var(--accent-emerald);margin:4px 0">₹7.0 – 12 LPA</div>
            <p style="font-size:11px;color:var(--text-muted)">Fractal, Nagarro, Tiger Analytics, Persistent. Skills & GitHub projects matter heavily.</p>
          </div>
          <div style="padding:14px;border-radius:var(--radius-md);background:var(--bg-subtle)">
            <b style="color:var(--text-primary)">Startups & Product Companies</b>
            <div style="font-size:18px;font-weight:800;color:var(--accent-amber);margin:4px 0">₹10 – 18 LPA</div>
            <p style="font-size:11px;color:var(--text-muted)">Zepto, Swiggy, Flipkart, InMobi. Demands deep PySpark, Lakehouse & System Design.</p>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // VIEW: LEARNING ACADEMY (ALL LESSONS)
  // ==========================================================================
  function learnView() {
    const all = getAllLessons();
    const query = S.search.toLowerCase().trim();

    const filtered = all.filter(l => {
      const matchCat = S.filter === 'All' || l.module.title.includes(S.filter) || l.module.id === S.filter;
      const matchSearch = !query ||
        l.title.toLowerCase().includes(query) ||
        l.explanation.toLowerCase().includes(query) ||
        l.module.title.toLowerCase().includes(query);
      return matchCat && matchSearch;
    });

    return `
      <div class="page-eyebrow">CURRICULUM DIRECTORY</div>
      <h1 class="page-title">Data Engineering Learning Academy</h1>
      <p class="page-lead">
        Search any concept, filter by module, or dive into detailed lessons with real code, architecture diagrams, and audio narration.
      </p>

      <input type="text" class="search-input-box" placeholder="🔍 Search SQL joins, window functions, PySpark skew, S3 partitioning, dbt tests, Iceberg..." value="${esc(S.search)}" oninput="updateSearch(this.value)">

      <div class="chip-group">
        <button class="chip ${S.filter === 'All' ? 'active' : ''}" onclick="setFilter('All')">All Modules (${all.length})</button>
        ${C.modules.map(m => `
          <button class="chip ${S.filter === m.id || S.filter === m.title ? 'active' : ''}" onclick="setFilter('${esc(m.id)}')">
            ${esc(m.title.split(':')[0])}
          </button>
        `).join('')}
      </div>

      <div style="margin-top:16px">
        ${filtered.length > 0 ? filtered.map(l => `
          <div class="lesson-row">
            <div class="lesson-row-info">
              <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px">
                <span class="tag tag-cyan">${esc(l.module.period)}</span>
                ${P.done.includes(l.key) ? '<span class="tag tag-emerald">✓ Completed</span>' : ''}
              </div>
              <h3 class="lesson-row-title">${esc(l.title)}</h3>
              <p class="lesson-row-meta">${esc(l.module.title)}</p>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="openLesson(${l.mi}, ${l.li})">
              Read Lesson →
            </button>
          </div>
        `).join('') : `
          <div class="card" style="text-align:center;padding:40px;color:var(--text-muted)">
            <h3>No matching lessons found for "${esc(S.search)}"</h3>
            <p style="margin-top:8px">Try searching for generic terms like SQL, PySpark, AWS, dbt, or Clear Search.</p>
            <button class="btn btn-secondary btn-sm" style="margin-top:14px" onclick="clearSearch()">Clear Search Filter</button>
          </div>
        `}
      </div>
    `;
  }

  // ==========================================================================
  // VIEW: LESSON DETAIL
  // ==========================================================================
  function lessonView() {
    const m = C.modules[S.module];
    if (!m) return dashboardView();
    const l = m.lessons[S.lesson];
    if (!l) return dashboardView();
    const key = `${S.module}-${S.lesson}`;
    const isDone = P.done.includes(key);

    return `
      <div class="lesson-view-container">
        <button class="btn btn-secondary btn-sm" onclick="go('learn')">← Back to Learning Library</button>

        <div style="margin-top:20px">
          <div class="page-eyebrow">${esc(m.title)} · ${esc(m.period)}</div>
          <h1 class="page-title">${esc(l.title)}</h1>
          <p style="color:var(--text-secondary);font-size:13.5px">Dhyaan se padho, architecture flow samjho, ya Audio se suno.</p>
        </div>

        <!-- AUDIO NARRATOR PANEL -->
        <div class="lesson-audio-panel">
          <div class="audio-controls">
            <button id="speakBtn" class="btn btn-primary btn-sm" onclick="speakLesson()">
              🔊 Listen Lesson
            </button>
            <select class="audio-select" onchange="setAudioGender(this.value)">
              <option value="male" ${P.voiceGender === 'male' ? 'selected' : ''}>👨 Male Voice</option>
              <option value="female" ${P.voiceGender === 'female' ? 'selected' : ''}>👩 Female Voice</option>
            </select>
            <select class="audio-select" onchange="setAudioRate(this.value)">
              <option value="0.8" ${P.audioRate == 0.8 ? 'selected' : ''}>0.8x Speed</option>
              <option value="0.9" ${P.audioRate == 0.9 ? 'selected' : ''}>0.9x Speed (Recommended)</option>
              <option value="1.0" ${P.audioRate == 1.0 ? 'selected' : ''}>1.0x Normal</option>
              <option value="1.2" ${P.audioRate == 1.2 ? 'selected' : ''}>1.2x Fast</option>
            </select>
          </div>
          <div style="font-size:11px;color:var(--text-muted)">Natural Hinglish Tech Pronunciation</div>
        </div>

        <!-- CONCEPT EXPLANATION -->
        <div class="lesson-section-box">
          <h3>📘 Concept & Deep Explanation</h3>
          <div class="explanation-text">
            ${esc(l.explanation).replace(/\n/g, '<br>')}
          </div>
        </div>

        <!-- ARCHITECTURE / VISUAL DIAGRAM -->
        ${l.diagram ? `
          <div class="lesson-section-box">
            <h3>◈ Architecture / Data Flow Diagram</h3>
            <div class="diagram-box">${esc(l.diagram)}</div>
          </div>
        ` : ''}

        <!-- CODE EXAMPLE -->
        ${l.example ? `
          <div class="lesson-section-box">
            <h3>⚡ Production Code / Pattern Example</h3>
            <div class="code-block-wrapper">
              <div class="code-block-header">
                <span>Code Pattern</span>
                <button class="btn btn-secondary btn-sm" style="padding:2px 8px;font-size:10px" onclick="copyCode(this)">Copy Code</button>
              </div>
              <div class="code-snippet">${esc(l.example)}</div>
            </div>
          </div>
        ` : ''}

        <!-- COMMON MISTAKES & TRAPS -->
        ${l.mistakes ? `
          <div class="callout-box callout-warning">
            <b style="display:block;margin-bottom:4px">⚠️ Common Fresher Mistakes & Interview Traps:</b>
            ${esc(l.mistakes).replace(/\n/g, '<br>')}
          </div>
        ` : ''}

        <!-- KEY TAKEAWAYS -->
        ${l.takeaway ? `
          <div class="callout-box">
            <b style="display:block;margin-bottom:4px">💡 Key Takeaway:</b>
            ${esc(l.takeaway)}
          </div>
        ` : ''}

        <!-- NAVIGATION & COMPLETION BUTTONS -->
        <div class="grid" style="margin-top:32px">
          <div class="card col-6" style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-weight:700">Lesson Completion</div>
              <small style="color:var(--text-muted)">${isDone ? '✓ You have mastered this lesson' : 'Mark when you understand this'}</small>
            </div>
            <button class="btn ${isDone ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="toggleLessonComplete('${key}')">
              ${isDone ? '✓ Completed' : 'Mark Complete'}
            </button>
          </div>

          <div class="card col-6" style="display:flex;gap:8px;align-items:center;justify-content:flex-end">
            ${S.lesson > 0 ? `
              <button class="btn btn-secondary btn-sm" onclick="openLesson(${S.module}, ${S.lesson - 1})">← Previous</button>
            ` : ''}
            ${S.lesson < m.lessons.length - 1 ? `
              <button class="btn btn-primary btn-sm" onclick="openLesson(${S.module}, ${S.lesson + 1})">Next Lesson →</button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="go('learn')">Library Overview →</button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // VIEW: SQL PRACTICE LAB (INTERACTIVE SANDBOX)
  // ==========================================================================
  function sqllabView() {
    const ch = SQL.challenges.find(c => c.id === S.activeSqlChallengeId) || SQL.challenges[0];

    return `
      <div class="page-eyebrow">INTERACTIVE QUERY RUNNER</div>
      <h1 class="page-title">Client-Side SQL Practice Lab</h1>
      <p class="page-lead">
        Write and execute live SQL queries directly inside your browser! Includes pre-loaded datasets (orders, customers, products, order_items) and guided interview challenges.
      </p>

      <div class="sql-sandbox-container">
        <!-- CHALLENGES SIDEBAR -->
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <h3 style="font-size:15px;font-weight:700">Practice Challenges</h3>
            <span class="tag tag-emerald">${SQL.challenges.length} Tasks</span>
          </div>
          <div class="sql-challenges-list">
            ${SQL.challenges.map(c => `
              <div class="sql-challenge-item ${c.id === S.activeSqlChallengeId ? 'active' : ''}" onclick="selectSqlChallenge('${c.id}')">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px">
                  <span class="tag ${c.difficulty === 'Beginner' ? 'tag-cyan' : c.difficulty === 'Intermediate' ? 'tag-emerald' : 'tag-amber'}" style="font-size:9px">${c.difficulty}</span>
                  <span style="font-size:10px;color:var(--text-muted)">${c.category}</span>
                </div>
                <h4>${esc(c.title)}</h4>
              </div>
            `).join('')}
          </div>

          <!-- TABLE SCHEMA INSPECTOR -->
          <div class="card" style="margin-top:16px;padding:14px">
            <h4 style="font-size:12.5px;font-weight:700;margin-bottom:8px">📊 Available Tables</h4>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="btn btn-secondary btn-sm" onclick="loadTableQuery('customers')">customers</button>
              <button class="btn btn-secondary btn-sm" onclick="loadTableQuery('orders')">orders</button>
              <button class="btn btn-secondary btn-sm" onclick="loadTableQuery('products')">products</button>
              <button class="btn btn-secondary btn-sm" onclick="loadTableQuery('order_items')">order_items</button>
            </div>
          </div>
        </div>

        <!-- CODE EDITOR & RESULTS -->
        <div>
          <div class="card" style="margin-bottom:16px;border-left:4px solid var(--accent-cyan)">
            <b style="color:var(--accent-cyan)">Task Goal:</b>
            <p style="font-size:13.5px;margin-top:4px;color:var(--text-primary)">${esc(ch.prompt)}</p>
          </div>

          <div class="sql-editor-card">
            <div class="sql-editor-header">
              <span style="font-family:var(--font-mono);font-size:12px;color:var(--accent-cyan)">SQL Query Editor</span>
              <div style="display:flex;gap:8px">
                <button class="btn btn-secondary btn-sm" onclick="loadChallengeStarter()">Reset</button>
                <button class="btn btn-secondary btn-sm" onclick="loadChallengeSolution()">Show Solution</button>
                <button class="btn btn-primary btn-sm" onclick="runSqlQuery()">▶ Run SQL Query</button>
              </div>
            </div>
            <textarea id="sqlInput" class="sql-textarea" spellcheck="false">${esc(ch.starter)}</textarea>

            <div id="sqlOutputArea">
              ${renderSqlResult(S.sqlResult)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderSqlResult(res) {
    if (!res) {
      return `
        <div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12.5px">
          Click <b>▶ Run SQL Query</b> to execute query and view results.
        </div>
      `;
    }
    if (!res.success) {
      return `
        <div style="padding:16px 20px;background:rgba(244,63,94,0.1);color:#fda4af;font-size:13px;border-top:1px solid rgba(244,63,94,0.3)">
          <b>❌ SQL Error:</b> ${esc(res.error)}
        </div>
      `;
    }
    if (res.rows.length === 0) {
      return `
        <div style="padding:16px 20px;background:#0d1829;color:var(--text-muted);font-size:12.5px;border-top:1px solid var(--border-subtle)">
          ✓ Query executed successfully in ${res.duration} with <b>0 rows returned</b>.
        </div>
      `;
    }

    return `
      <div style="padding:10px 16px;background:#0d1829;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-subtle);font-size:11.5px">
        <span style="color:var(--accent-emerald)">✓ Query completed successfully</span>
        <span style="color:var(--text-muted)">Rows: <b>${res.rowCount}</b> | Time: <b>${res.duration}</b></span>
      </div>
      <div class="sql-result-table-wrapper">
        <table class="sql-table">
          <thead>
            <tr>${res.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${res.rows.map(r => `
              <tr>${res.columns.map(c => `<td>${esc(r[c])}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ==========================================================================
  // VIEW: QUIZ & MOCK EXAM STUDIO
  // ==========================================================================
  function quizView() {
    if (S.quizQuestions.length === 0) {
      initQuizQuestions();
    }

    // Complete screen
    if (S.qi >= S.quizQuestions.length) {
      const total = S.quizQuestions.length;
      const scorePct = Math.round((S.score / Math.max(1, total)) * 100);
      P.attempts += 1;
      P.best = Math.max(P.best, scorePct);
      saveProgress();

      return `
        <div class="card" style="max-width:700px;margin:30px auto;text-align:center;padding:40px">
          <div class="page-eyebrow">ASSESSMENT REPORT</div>
          <h1 style="font-size:52px;font-weight:800;color:var(--accent-emerald);margin:12px 0">${scorePct}%</h1>
          <h2 style="font-size:22px;margin-bottom:8px">Assessment Complete!</h2>
          <p class="page-lead" style="margin:0 auto 24px">
            You answered <b>${S.score} out of ${total}</b> questions correctly.
            ${scorePct >= 80 ? '🎉 Excellent score! You have strong data engineering fundamentals.' : 'Keep practicing tricky SQL and PySpark concepts to reach 85%+.'}
          </p>

          <div class="progress-bar" style="margin:20px auto 28px;max-width:400px">
            <div class="progress-bar-fill" style="width:${scorePct}%"></div>
          </div>

          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="restartQuiz()">Retake Quiz</button>
            <button class="btn btn-secondary" onclick="startMockExam()">Start 20-Min Mock Exam</button>
            <button class="btn btn-secondary" onclick="go('learn')">Review Lessons</button>
          </div>
        </div>
      `;
    }

    const q = S.quizQuestions[S.qi];
    const total = S.quizQuestions.length;

    return `
      <div style="max-width:850px;margin:0 auto">
        <div class="page-eyebrow">TECHNICAL KNOWLEDGE CHECK</div>
        <h1 class="page-title">Data Engineering Quiz & Mock Exam</h1>
        <p class="page-lead">
          Test your real understanding on 130+ scenario questions. Choose between Category Practice, Timed Screening Exam, and Flashcards.
        </p>

        <!-- QUIZ MODE SELECTOR TABS -->
        <div class="quiz-mode-tabs">
          <button class="btn ${S.quizMode === 'practice' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="setQuizMode('practice')">
            📚 Category Practice
          </button>
          <button class="btn ${S.quizMode === 'exam' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="setQuizMode('exam')">
            ⏱ Timed Mock Exam (20 min)
          </button>
          <button class="btn ${S.quizMode === 'flashcards' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="setQuizMode('flashcards')">
            🗂 Flashcard Revision
          </button>
          ${P.missed.length > 0 ? `
            <button class="btn ${S.quizMode === 'missed' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="setQuizMode('missed')">
              ⚠️ Review Missed (${P.missed.length})
            </button>
          ` : ''}
        </div>

        ${S.quizMode === 'flashcards' ? renderFlashcard(q) : renderStandardQuiz(q, total)}
      </div>
    `;
  }

  function renderStandardQuiz(q, total) {
    return `
      <div class="card" style="padding:28px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-size:12px;color:var(--text-muted)">
          <span>QUESTION ${S.qi + 1} OF ${total} · <b style="color:var(--accent-cyan)">${esc(q[4])}</b></span>
          <span class="tag tag-amber">${esc(q[5] || 'Intermediate')}</span>
        </div>

        <div class="progress-bar"><div class="progress-bar-fill" style="width:${(S.qi / total) * 100}%"></div></div>

        <h2 style="font-size:18px;font-weight:700;line-height:1.4;margin:18px 0 20px;color:var(--text-primary)">
          ${esc(q[0])}
        </h2>

        <div>
          ${q[1].map((opt, i) => {
            let cls = 'quiz-option-btn';
            if (S.checked) {
              if (i === q[2]) cls += ' correct';
              else if (i === S.choice) cls += ' wrong';
            } else if (S.choice === i) {
              cls += ' selected';
            }
            return `
              <button class="${cls}" ${S.checked ? 'disabled' : ''} onclick="chooseOption(${i})">
                <b>${String.fromCharCode(65 + i)}.</b> ${esc(opt)}
              </button>
            `;
          }).join('')}
        </div>

        ${S.checked ? `
          <div class="quiz-explanation-card">
            <b style="color:${S.choice === q[2] ? 'var(--accent-emerald)' : 'var(--accent-rose)'};font-size:14px">
              ${S.choice === q[2] ? '✓ Correct Answer!' : '✗ Not Quite.'}
            </b>
            <p style="margin-top:6px;color:var(--text-secondary)">${esc(q[3])}</p>
          </div>
          <button class="btn btn-primary" style="margin-top:20px" onclick="nextQuestion()">
            ${S.qi === total - 1 ? 'See Assessment Results →' : 'Next Question →'}
          </button>
        ` : `
          <button class="btn btn-primary" style="margin-top:16px" onclick="checkAnswer()" ${S.choice === null ? 'disabled' : ''}>
            Check Answer
          </button>
        `}
      </div>
    `;
  }

  function renderFlashcard(q) {
    return `
      <div class="flashcard-card" onclick="flipFlashcard()">
        <span class="tag tag-cyan" style="margin-bottom:14px">${esc(q[4])} · Click Card to Flip</span>
        ${!S.flashFlipped ? `
          <h2 style="font-size:22px;font-weight:800;color:var(--text-primary)">${esc(q[0])}</h2>
          <p style="color:var(--text-muted);font-size:13px;margin-top:16px">👉 Tap anywhere to reveal the correct answer and explanation</p>
        ` : `
          <h3 style="font-size:18px;color:var(--accent-emerald);margin-bottom:10px">Answer: ${esc(q[1][q[2]])}</h3>
          <p style="color:var(--text-secondary);font-size:14px;max-width:600px;line-height:1.6">${esc(q[3])}</p>
        `}
      </div>
      <div style="display:flex;justify-content:center;gap:12px;margin-top:16px">
        <button class="btn btn-secondary" onclick="prevFlashcard()">← Previous</button>
        <button class="btn btn-primary" onclick="nextFlashcard()">Next Card →</button>
      </div>
    `;
  }

  // ==========================================================================
  // VIEW: ARCHITECTURE STUDIO (INTERACTIVE SCHEMA & LAKEHOUSE)
  // ==========================================================================
  let activeArchTab = 'star_schema';

  function architectureView() {
    return `
      <div class="page-eyebrow">VISUAL SYSTEM DESIGN</div>
      <h1 class="page-title">Data Architecture Studio</h1>
      <p class="page-lead">
        Interactive visual models of Dimensional Star vs Snowflake Schemas and Medallion Lakehouse pipeline flow.
      </p>

      <div class="chip-group">
        <button class="chip ${activeArchTab === 'star_schema' ? 'active' : ''}" onclick="setArchTab('star_schema')">★ Star Schema Explorer</button>
        <button class="chip ${activeArchTab === 'medallion' ? 'active' : ''}" onclick="setArchTab('medallion')">◈ Medallion Lakehouse Flow</button>
      </div>

      ${activeArchTab === 'star_schema' ? `
        <div class="card" style="padding:28px">
          <h3 style="font-size:18px;font-weight:800;margin-bottom:8px">Retail Analytics Star Schema</h3>
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:20px">
            Central <b>Fact Table</b> surrounded by denormalized <b>Dimension Tables</b>. Click any table to inspect its schema and surrogate keys.
          </p>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px">
            <div style="padding:16px;border-radius:var(--radius-md);background:#0f1d36;border:1px solid var(--accent-cyan)">
              <span class="tag tag-cyan" style="margin-bottom:6px">DIMENSION</span>
              <h4 style="font-size:15px;color:#38bdf8">dim_customer</h4>
              <ul style="font-family:var(--font-mono);font-size:11.5px;color:var(--text-secondary);margin-top:8px;padding-left:16px">
                <li><b style="color:var(--accent-emerald)">customer_key (PK)</b></li>
                <li>customer_id (Natural Key)</li>
                <li>name, email, city</li>
                <li>valid_from, valid_to (SCD2)</li>
                <li>is_current (Boolean)</li>
              </ul>
            </div>

            <div style="padding:16px;border-radius:var(--radius-md);background:#19271d;border:2px solid var(--accent-emerald)">
              <span class="tag tag-emerald" style="margin-bottom:6px">CENTRAL FACT</span>
              <h4 style="font-size:15px;color:#34d399">fact_orders</h4>
              <ul style="font-family:var(--font-mono);font-size:11.5px;color:var(--text-secondary);margin-top:8px;padding-left:16px">
                <li>order_key (PK)</li>
                <li><b style="color:var(--accent-cyan)">customer_key (FK)</b></li>
                <li><b style="color:var(--accent-cyan)">product_key (FK)</b></li>
                <li><b style="color:var(--accent-cyan)">date_key (FK)</b></li>
                <li>gross_amount (Metric)</li>
                <li>discount_amount (Metric)</li>
                <li>net_amount (Metric)</li>
              </ul>
            </div>

            <div style="padding:16px;border-radius:var(--radius-md);background:#0f1d36;border:1px solid var(--accent-cyan)">
              <span class="tag tag-cyan" style="margin-bottom:6px">DIMENSION</span>
              <h4 style="font-size:15px;color:#38bdf8">dim_product</h4>
              <ul style="font-family:var(--font-mono);font-size:11.5px;color:var(--text-secondary);margin-top:8px;padding-left:16px">
                <li><b style="color:var(--accent-emerald)">product_key (PK)</b></li>
                <li>product_id (Natural Key)</li>
                <li>product_name</li>
                <li>category, subcategory</li>
                <li>unit_cost</li>
              </ul>
            </div>

            <div style="padding:16px;border-radius:var(--radius-md);background:#0f1d36;border:1px solid var(--accent-cyan)">
              <span class="tag tag-cyan" style="margin-bottom:6px">DIMENSION</span>
              <h4 style="font-size:15px;color:#38bdf8">dim_date (Conformed)</h4>
              <ul style="font-family:var(--font-mono);font-size:11.5px;color:var(--text-secondary);margin-top:8px;padding-left:16px">
                <li><b style="color:var(--accent-emerald)">date_key (PK) [20250601]</b></li>
                <li>full_date, day_of_week</li>
                <li>month_name, quarter, year</li>
                <li>is_weekend (Flag)</li>
                <li>is_holiday (Flag)</li>
              </ul>
            </div>
          </div>
        </div>
      ` : `
        <div class="card" style="padding:28px">
          <h3 style="font-size:18px;font-weight:800;margin-bottom:8px">Medallion Data Lakehouse Architecture</h3>
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:20px">
            Standard modern data architecture (Databricks / Snowflake / Iceberg):
          </p>

          <div style="display:flex;flex-direction:column;gap:14px">
            <div style="padding:18px;border-radius:var(--radius-md);background:#1a1917;border-left:4px solid #b45309">
              <h4 style="color:#f59e0b;font-size:16px">🥉 Bronze Layer (Raw Landing Zone)</h4>
              <p style="font-size:12.5px;color:var(--text-secondary);margin-top:4px">
                • Ingestion from APIs, CDC, S3 files.<br>
                • Append-only, immutable raw formats (JSON, CSV). Exact 1:1 replica of source systems without transformation.
              </p>
            </div>
            <div style="padding:18px;border-radius:var(--radius-md);background:#111c2b;border-left:4px solid #0284c7">
              <h4 style="color:#38bdf8;font-size:16px">🥈 Silver Layer (Cleaned & Conformed)</h4>
              <p style="font-size:12.5px;color:var(--text-secondary);margin-top:4px">
                • PySpark & dbt cleaning: Schema enforcement, deduplication, type casting.<br>
                • Stored as Snappy-compressed Parquet with Delta Lake or Apache Iceberg metadata.
              </p>
            </div>
            <div style="padding:18px;border-radius:var(--radius-md);background:#0d241d;border-left:4px solid #10b981">
              <h4 style="color:#34d399;font-size:16px">🥇 Gold Layer (Curated Business Marts)</h4>
              <p style="font-size:12.5px;color:var(--text-secondary);margin-top:4px">
                • Dimensional Star Schema, Fact & Dimension tables.<br>
                • Aggregated metrics optimized for PowerBI, Tableau, and ML feature stores.
              </p>
            </div>
          </div>
        </div>
      `}
    `;
  }

  // ==========================================================================
  // VIEW: INTERVIEW STUDIO
  // ==========================================================================
  function interviewView() {
    return `
      <div class="page-eyebrow">ACE THE TECHNICAL SCREENING</div>
      <h1 class="page-title">Data Engineering Interview Studio</h1>
      <p class="page-lead">
        Realistic technical and architectural interview questions asked at top service and product companies, complete with model answers and follow-up traps.
      </p>

      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:30px">
        ${C.interview.map((item, i) => `
          <details class="card" style="padding:18px 22px">
            <summary style="font-size:15px;font-weight:700;color:var(--text-primary);cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px">
              <span class="tag tag-cyan" style="font-size:10px">Q${i + 1}</span>
              <span>${esc(item[0])}</span>
            </summary>
            <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border-subtle);font-size:13.5px;line-height:1.7;color:var(--text-secondary)">
              ${esc(item[1]).replace(/\n/g, '<br>')}
            </div>
          </details>
        `).join('')}
      </div>

      <!-- PRE-APPLICATION READINESS CHECKLIST -->
      <div class="card">
        <h3 style="font-size:17px;font-weight:800;margin-bottom:12px">✅ Pre-Application Readiness Checklist</h3>
        <p style="font-size:12.5px;color:var(--text-secondary);margin-bottom:16px">Check off each item honestly before sending applications to recruiters:</p>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${[
            'Can write and explain complex SQL queries with Window Functions & CTEs confidently',
            'Comfortable writing modular Python ETL scripts using Pathlib, Logging, and Requests',
            'Can explain Spark Architecture (Driver, Executors, Shuffle, Broadcast Join, Skew) with diagrams',
            'Understand Kimball Dimensional Modeling (Grain, Fact vs Dimension, SCD Type 1 vs 2)',
            'Have at least 2 well-documented end-to-end projects on GitHub with architecture diagrams',
            'Have basic hands-on familiarity with AWS S3, Glue Data Catalog, and Athena',
            '1-Page ATS-compliant resume focused on quantified engineering bullet points'
          ].map((item, idx) => `
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:13px">
              <input type="checkbox" style="accent-color:var(--accent-emerald);width:16px;height:16px">
              <span>${item}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // VIEW: PROJECT LAB
  // ==========================================================================
  function projectsView() {
    return `
      <div class="page-eyebrow">PORTFOLIO ACCELERATOR</div>
      <h1 class="page-title">Production Portfolio Project Lab</h1>
      <p class="page-lead">
        Build 2 to 3 of these industry-standard blueprints. Recruiters value GitHub proof of work far more than course certificates!
      </p>

      <div style="display:flex;flex-direction:column;gap:24px">
        ${C.projects.map((p, idx) => `
          <div class="card" style="padding:28px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
              <div>
                <span class="tag tag-emerald" style="margin-bottom:6px">BLUEPRINT #${idx + 1}</span>
                <h2 style="font-size:20px;font-weight:800;color:var(--text-primary)">${esc(p.title)}</h2>
              </div>
              <span class="tag tag-cyan">${esc(p.stack)}</span>
            </div>

            <div style="margin:14px 0;padding:12px 16px;background:var(--bg-subtle);border-radius:var(--radius-md);font-size:13px">
              <b style="color:var(--accent-cyan)">What this demonstrates to recruiters:</b> ${esc(p.shows)}
            </div>

            <h4 style="font-size:14px;font-weight:700;margin:16px 0 8px">◈ Architecture Flow:</h4>
            <div class="diagram-box">${esc(p.architecture)}</div>

            <h4 style="font-size:14px;font-weight:700;margin:16px 0 8px">📋 Step-by-Step Implementation Guide:</h4>
            <ul style="font-size:13px;color:var(--text-secondary);padding-left:20px;line-height:1.8">
              ${p.steps.map(s => `<li>${esc(s)}</li>`).join('')}
            </ul>

            ${p.sample_code ? `
              <h4 style="font-size:14px;font-weight:700;margin:16px 0 8px">⚡ Sample Core Code Pattern:</h4>
              <div class="code-block-wrapper">
                <div class="code-block-header">
                  <span>Starter Implementation</span>
                  <button class="btn btn-secondary btn-sm" style="padding:2px 8px;font-size:10px" onclick="copyCode(this)">Copy</button>
                </div>
                <div class="code-snippet">${esc(p.sample_code)}</div>
              </div>
            ` : ''}

            <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border-subtle);display:flex;gap:14px;flex-wrap:wrap">
              <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;cursor:pointer">
                <input type="checkbox" ${P.projects[`${idx}-repo`] ? 'checked' : ''} onchange="toggleProjectTask(${idx}, 'repo', this.checked)" style="accent-color:var(--accent-emerald)">
                GitHub Repo & README created
              </label>
              <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;cursor:pointer">
                <input type="checkbox" ${P.projects[`${idx}-arch`] ? 'checked' : ''} onchange="toggleProjectTask(${idx}, 'arch', this.checked)" style="accent-color:var(--accent-emerald)">
                Architecture Diagram embedded
              </label>
              <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;cursor:pointer">
                <input type="checkbox" ${P.projects[`${idx}-tests`] ? 'checked' : ''} onchange="toggleProjectTask(${idx}, 'tests', this.checked)" style="accent-color:var(--accent-emerald)">
                Validation & Quality Checks added
              </label>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- CURATED FREE RESOURCES -->
      <div class="card" style="margin-top:30px">
        <h3 style="font-size:18px;font-weight:800;margin-bottom:12px">📚 Curated Free & Low-Cost Resources</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px">
          ${C.resources.map(r => `
            <div style="padding:14px;background:var(--bg-subtle);border-radius:var(--radius-md)">
              <b style="color:var(--accent-cyan);display:block;margin-bottom:4px">${esc(r[0])}</b>
              <p style="font-size:11.5px;color:var(--text-secondary);margin:0">${esc(r[1])}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // VIEW: RESUME & CAREER KIT
  // ==========================================================================
  function careerView() {
    return `
      <div class="page-eyebrow">CAREER ACCELERATOR</div>
      <h1 class="page-title">ATS Resume & Career Kit</h1>
      <p class="page-lead">
        Formulas, templates, and LinkedIn strategies tailored for BCA, Non-CS, and Fresher Data Engineers to get interview calls.
      </p>

      <div class="card" style="margin-bottom:24px">
        <h3 style="font-size:18px;font-weight:800;color:var(--accent-emerald);margin-bottom:8px">🎯 The Winning Bullet Point Formula (X-Y-Z)</h3>
        <p style="font-size:13.5px;color:var(--text-secondary);margin-bottom:14px">
          Never write passive descriptions like "Worked on SQL queries". Always use:
        </p>
        <div class="callout-box" style="font-size:14px">
          <b>[Strong Action Verb]</b> + <b>[System / Task Built]</b> + using <b>[Specific Tools]</b> + resulting in <b>[Quantifiable Metric / Impact]</b>.
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin-top:16px">
          <div style="padding:14px;background:var(--bg-subtle);border-radius:var(--radius-md)">
            <b style="color:var(--accent-cyan)">Bad Bullet (Ignored by Recruiters):</b>
            <p style="color:var(--accent-rose);font-size:12.5px;margin-top:4px">"Wrote PySpark code to process sales data and saved to AWS."</p>
          </div>
          <div style="padding:14px;background:var(--bg-subtle);border-radius:var(--radius-md)">
            <b style="color:var(--accent-cyan)">Winning Bullet (Gets Interviews!):</b>
            <p style="color:var(--accent-emerald);font-size:12.5px;margin-top:4px">"Architected a PySpark data pipeline processing 10M+ daily clickstream events into S3 Parquet lakehouse, optimizing shuffle via broadcast joins to cut execution time by 42%."</p>
          </div>
        </div>
      </div>

      <!-- SAMPLE ATS RESUME TEMPLATE -->
      <div class="card" style="margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3 style="font-size:17px;font-weight:800">📄 1-Page Fresher DE Resume Template</h3>
          <button class="btn btn-secondary btn-sm" onclick="copyResumeTemplate(this)">Copy Markdown Template</button>
        </div>
        <div class="diagram-box" style="font-size:11.5px;color:var(--text-secondary)"># YOUR NAME
City, India | +91 XXXXXXXXXX | email@example.com | LinkedIn: /in/yourprofile | GitHub: github.com/yourhandle

## PROFESSIONAL SUMMARY
Aspiring Data Engineer with strong foundations in SQL (Window functions, CTEs), PySpark distributed computing, Dimensional Modeling (Star Schema), and AWS Cloud Data Pipelines. Built 3 end-to-end production pipelines on GitHub.

## TECHNICAL SKILLS
- Languages: SQL (PostgreSQL, Snowflake, Athena), Python (Pandas, Requests, Pytest)
- Big Data & Lakehouse: Apache Spark (PySpark), Apache Iceberg, Delta Lake, Parquet
- Cloud & Warehousing: AWS (S3, Glue, Athena, Redshift, IAM, Lambda), Snowflake
- Orchestration & Ops: Apache Airflow, dbt Core, Docker, Git, Linux / Bash, CI/CD (GitHub Actions)

## DATA ENGINEERING PROJECTS
### 1. Automated Batch ETL Pipeline | Python, PostgreSQL, Airflow, Docker
- Engineered an automated batch ETL pipeline extracting daily transactions from REST APIs with cursor pagination and exponential backoff.
- Implemented an idempotent staging-to-curated upsert pattern in PostgreSQL, eliminating duplicate writes across pipeline retries.
- Orchestrated daily workflows via an Apache Airflow DAG with automated failure notifications and data quality assertions.

### 2. Big Data Clickstream Processing & Optimization | PySpark, Parquet, Databricks
- Processed 12M+ e-commerce user events using PySpark DataFrames and window functions to compute rolling user session metrics.
- Mitigated cluster data skew on high-frequency guest accounts via key salting and broadcast join optimization.
- Stored curated outputs in partitioned Snappy-compressed Parquet, eliminating the small files problem via coalesce.

## EDUCATION
Bachelor of Computer Applications (BCA) / B.Sc / B.Tech | [Your University] | 2022 - 2026</div>
      </div>
    `;
  }

  // ==========================================================================
  // VIEW: MY NOTES
  // ==========================================================================
  function notesView() {
    return `
      <div class="page-eyebrow">PERSONAL KNOWLEDGE BASE</div>
      <h1 class="page-title">My Learning Notes & Cheat Sheets</h1>
      <p class="page-lead">
        Notes are automatically saved locally on this device. Jot down tricky interview formulas, error solutions, and SQL snippets.
      </p>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <label style="font-weight:700;font-size:13px">Your Notebook (Auto-saved):</label>
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary btn-sm" onclick="exportNotes()">Export Notes (.txt)</button>
            <button class="btn btn-secondary btn-sm" onclick="clearNotes()">Clear</button>
          </div>
        </div>
        <textarea id="personalNotes" class="sql-textarea" style="min-height:300px;color:var(--text-primary);border:1px solid var(--border-subtle);border-radius:var(--radius-md)" placeholder="Jot down notes here...
Example:
- ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY timestamp DESC)
- Spark: coalesce() reduces partition count without shuffle; repartition() shuffles.
- Athena charges $5/TB scanned; always partition by date and use Parquet!">${esc(P.notes.text || '')}</textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">
          <span style="font-size:11.5px;color:var(--text-muted)">Stored safely in your browser LocalStorage</span>
          <button class="btn btn-primary btn-sm" onclick="savePersonalNotes()">Save Notes</button>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // VIEW: SETTINGS & BACKUP
  // ==========================================================================
  function settingsView() {
    return `
      <div class="page-eyebrow">APPLICATION SETTINGS</div>
      <h1 class="page-title">Settings, Backup & Installation</h1>
      <p class="page-lead">
        Manage your local progress, export JSON backups, configure audio preferences, and install the offline PWA.
      </p>

      <div class="grid">
        <div class="card col-6">
          <h3 style="font-size:16px;font-weight:800;margin-bottom:6px">📥 Install App on Laptop & Phone</h3>
          <p style="font-size:12.5px;color:var(--text-secondary);margin-bottom:14px">
            Run DE Mastery Pro as a standalone desktop app or mobile home screen app with 100% offline access.
          </p>
          <button class="btn btn-primary" onclick="showInstallModal()">View Installation Guide</button>
        </div>

        <div class="card col-6">
          <h3 style="font-size:16px;font-weight:800;margin-bottom:6px">💾 Export Progress Backup</h3>
          <p style="font-size:12.5px;color:var(--text-secondary);margin-bottom:14px">
            Download a portable JSON backup of your completed lessons, notes, and quiz milestones.
          </p>
          <button class="btn btn-secondary" onclick="exportData()">Download Backup (JSON)</button>
        </div>

        <div class="card col-6">
          <h3 style="font-size:16px;font-weight:800;margin-bottom:6px">📂 Import Backup File</h3>
          <p style="font-size:12.5px;color:var(--text-secondary);margin-bottom:14px">
            Transfer your progress from another laptop or phone by restoring your JSON backup.
          </p>
          <input type="file" id="importInput" accept=".json" style="font-size:11px;margin-bottom:10px" onchange="importData(this)">
        </div>

        <div class="card col-6">
          <h3 style="font-size:16px;font-weight:800;margin-bottom:6px">🔊 Audio Voice Settings</h3>
          <p style="font-size:12.5px;color:var(--text-secondary);margin-bottom:14px">
            Configure the default voice narrator gender and reading speed.
          </p>
          <div style="display:flex;gap:10px">
            <select class="audio-select" onchange="setAudioGender(this.value)">
              <option value="male" ${P.voiceGender === 'male' ? 'selected' : ''}>👨 Male Voice</option>
              <option value="female" ${P.voiceGender === 'female' ? 'selected' : ''}>👩 Female Voice</option>
            </select>
            <button class="btn btn-secondary btn-sm" onclick="testAudioVoice()">Test Audio</button>
          </div>
        </div>

        <div class="card col-12" style="border-color:rgba(244,63,94,0.3)">
          <h3 style="font-size:16px;font-weight:800;color:var(--accent-rose);margin-bottom:6px">⚠️ Reset All Local Data</h3>
          <p style="font-size:12.5px;color:var(--text-secondary);margin-bottom:14px">
            Permanently erase all lesson completions, quiz attempts, and notes stored in this browser.
          </p>
          <button class="btn btn-secondary btn-sm" style="border-color:var(--accent-rose);color:var(--accent-rose)" onclick="resetAllProgress()">
            Reset All Local Progress
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // VIEW RENDERER DISPATCHER
  // ==========================================================================
  function render() {
    const main = $('#main');
    if (!main) return;

    let html = '';
    switch (S.view) {
      case 'dashboard': html = dashboardView(); break;
      case 'roadmap': html = roadmapView(); break;
      case 'learn': html = learnView(); break;
      case 'lesson': html = lessonView(); break;
      case 'sqllab': html = sqllabView(); break;
      case 'quiz': html = quizView(); break;
      case 'architecture': html = architectureView(); break;
      case 'interview': html = interviewView(); break;
      case 'projects': html = projectsView(); break;
      case 'career': html = careerView(); break;
      case 'notes': html = notesView(); break;
      case 'settings': html = settingsView(); break;
      default: html = dashboardView();
    }

    main.innerHTML = html;
    updateBadges();
  }

  // ==========================================================================
  // EVENT HANDLERS & ACTIONS
  // ==========================================================================
  function toggleLessonComplete(key) {
    if (P.done.includes(key)) {
      P.done = P.done.filter(k => k !== key);
      toast('Lesson marked incomplete');
    } else {
      P.done.push(key);
      toast('✓ Lesson progress saved!');
    }
    saveProgress();
    render();
  }

  function toggleWeek(w, checked) {
    if (checked) {
      if (!P.weeks.includes(w)) P.weeks.push(w);
      toast(`Week ${w} marked complete!`);
    } else {
      P.weeks = P.weeks.filter(x => x !== w);
    }
    saveProgress();
    render();
  }

  function toggleProjectTask(pIdx, taskKey, checked) {
    const k = `${pIdx}-${taskKey}`;
    P.projects[k] = checked;
    saveProgress();
  }

  function updateSearch(val) {
    S.search = val;
    render();
  }

  function setFilter(cat) {
    S.filter = cat;
    render();
  }

  function clearSearch() {
    S.search = '';
    S.filter = 'All';
    render();
  }

  function copyCode(btn) {
    const snippet = btn.closest('.code-block-wrapper').querySelector('.code-snippet');
    if (!snippet) return;
    navigator.clipboard.writeText(snippet.textContent).then(() => {
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy Code', 2000);
      toast('Code snippet copied to clipboard');
    });
  }

  function copyResumeTemplate(btn) {
    const snippet = btn.closest('.card').querySelector('.diagram-box');
    if (!snippet) return;
    navigator.clipboard.writeText(snippet.textContent).then(() => {
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy Markdown Template', 2000);
      toast('Resume markdown template copied!');
    });
  }

  // ==========================================================================
  // SQL PRACTICE LAB HANDLERS
  // ==========================================================================
  function selectSqlChallenge(cid) {
    S.activeSqlChallengeId = cid;
    const ch = SQL.challenges.find(c => c.id === cid);
    if (ch) {
      const area = $('#sqlInput');
      if (area) area.value = ch.starter;
      S.sqlResult = null;
    }
    render();
  }

  function loadChallengeStarter() {
    const ch = SQL.challenges.find(c => c.id === S.activeSqlChallengeId);
    if (ch) {
      const area = $('#sqlInput');
      if (area) area.value = ch.starter;
      S.sqlResult = null;
      render();
    }
  }

  function loadChallengeSolution() {
    const ch = SQL.challenges.find(c => c.id === S.activeSqlChallengeId);
    if (ch) {
      const area = $('#sqlInput');
      if (area) area.value = ch.solution;
      toast('Solution loaded into SQL editor.');
    }
  }

  function loadTableQuery(tableName) {
    const area = $('#sqlInput');
    if (area) {
      area.value = `SELECT * FROM ${tableName} LIMIT 10;`;
      runSqlQuery();
    }
  }

  function runSqlQuery() {
    const area = $('#sqlInput');
    if (!area) return;
    const query = area.value;
    const res = SQL.executeQuery(query);
    S.sqlResult = res;
    const out = $('#sqlOutputArea');
    if (out) {
      out.innerHTML = renderSqlResult(res);
    }
  }

  // ==========================================================================
  // QUIZ ENGINE HANDLERS
  // ==========================================================================
  function initQuizQuestions() {
    if (S.quizMode === 'exam') {
      // 25 randomized questions
      const shuffled = [...C.quiz].sort(() => 0.5 - Math.random());
      S.quizQuestions = shuffled.slice(0, 25);
    } else if (S.quizMode === 'missed') {
      S.quizQuestions = P.missed.map(idx => C.quiz[idx]).filter(Boolean);
      if (S.quizQuestions.length === 0) S.quizQuestions = C.quiz.slice(0, 20);
    } else {
      S.quizQuestions = C.quiz;
    }
    S.qi = 0;
    S.choice = null;
    S.checked = false;
    S.score = 0;
  }

  function setQuizMode(mode) {
    S.quizMode = mode;
    initQuizQuestions();
    render();
  }

  function chooseOption(idx) {
    if (S.checked) return;
    S.choice = idx;
    render();
  }

  function checkAnswer() {
    if (S.choice === null) return;
    S.checked = true;
    const q = S.quizQuestions[S.qi];
    const originalIdx = C.quiz.indexOf(q);

    if (S.choice === q[2]) {
      S.score += 1;
      // remove from missed if present
      P.missed = P.missed.filter(i => i !== originalIdx);
    } else {
      if (originalIdx >= 0 && !P.missed.includes(originalIdx)) {
        P.missed.push(originalIdx);
      }
    }
    saveProgress();
    render();
  }

  function nextQuestion() {
    S.qi += 1;
    S.choice = null;
    S.checked = false;
    render();
  }

  function restartQuiz() {
    initQuizQuestions();
    render();
  }

  function startMockExam() {
    S.quizMode = 'exam';
    initQuizQuestions();
    render();
  }

  function flipFlashcard() {
    S.flashFlipped = !S.flashFlipped;
    render();
  }

  function nextFlashcard() {
    S.flashFlipped = false;
    S.qi = (S.qi + 1) % S.quizQuestions.length;
    render();
  }

  function prevFlashcard() {
    S.flashFlipped = false;
    S.qi = (S.qi - 1 + S.quizQuestions.length) % S.quizQuestions.length;
    render();
  }

  function setArchTab(tab) {
    activeArchTab = tab;
    render();
  }

  // ==========================================================================
  // NOTES & STORAGE MANAGEMENT
  // ==========================================================================
  function savePersonalNotes() {
    const area = $('#personalNotes');
    if (area) {
      P.notes.text = area.value;
      saveProgress();
      toast('Notes saved safely on this device');
    }
  }

  function clearNotes() {
    if (confirm('Clear all your notes?')) {
      P.notes.text = '';
      saveProgress();
      render();
    }
  }

  function exportNotes() {
    const text = P.notes.text || '';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'DE_Mastery_Notes.txt';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Notes exported as text file.');
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(P, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `DE_Mastery_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Backup JSON exported successfully.');
  }

  function importData(inputEl) {
    const file = inputEl.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (imported && Array.isArray(imported.done)) {
          P = { ...P, ...imported };
          saveProgress();
          toast('✓ Backup restored successfully!');
          render();
        } else {
          throw new Error();
        }
      } catch (e) {
        toast('❌ Invalid DE Mastery backup file');
      }
    };
    reader.readAsText(file);
  }

  function resetAllProgress() {
    if (confirm('Are you sure you want to permanently reset all DE Mastery progress and notes on this browser?')) {
      localStorage.removeItem('deMasteryPro_v2');
      P = loadProgress();
      render();
      toast('Local progress reset complete.');
    }
  }

  function toggleTheme() {
    P.theme = P.theme === 'light' ? 'dark' : 'light';
    document.body.classList.toggle('light', P.theme === 'light');
    saveProgress();
  }

  function setAudioGender(val) {
    P.voiceGender = val;
    saveProgress();
    toast(`Voice set to ${val}`);
  }

  function setAudioRate(val) {
    P.audioRate = parseFloat(val);
    saveProgress();
    toast(`Audio speed set to ${val}x`);
  }

  function testAudioVoice() {
    const u = new SpeechSynthesisUtterance("Welcome to DE Mastery Pro. Your audio narrator is configured and working perfectly.");
    u.rate = P.audioRate || 0.9;
    const v = pickVoice(P.voiceGender);
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  }

  // ==========================================================================
  // PWA INSTALLATION PROMPT HANDLING
  // ==========================================================================
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = $('#installBtn');
    if (btn) btn.classList.remove('hidden');
    const directBtn = $('#directInstallBtn');
    if (directBtn) directBtn.disabled = false;
  });

  function showInstallModal() {
    const m = $('#installModal');
    if (m) m.classList.remove('hidden');
  }

  function closeInstallModal() {
    const m = $('#installModal');
    if (m) m.classList.add('hidden');
  }

  function triggerPWAInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          toast('✓ App installed successfully!');
        }
        deferredPrompt = null;
        closeInstallModal();
      });
    } else {
      alert("To install:\n- On Laptop: Click the install icon in your browser's address bar (right next to the bookmark star in Chrome or Edge).\n- On Mobile: Tap browser menu -> 'Add to Home screen'.");
    }
  }

  // Service Worker Registration
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('Service Worker registered'))
        .catch((err) => console.log('Service Worker register error:', err));
    });
  }

  // Network Online/Offline Indicators
  window.addEventListener('online', () => {
    const el = $('#networkStatus');
    if (el) {
      el.textContent = '● Online';
      el.style.color = 'var(--accent-emerald)';
    }
  });

  window.addEventListener('offline', () => {
    const el = $('#networkStatus');
    if (el) {
      el.textContent = '● Offline-ready';
      el.style.color = 'var(--accent-cyan)';
    }
  });

  // Attach global exports
  window.go = go;
  window.openLesson = openLesson;
  window.toggleLessonComplete = toggleLessonComplete;
  window.toggleWeek = toggleWeek;
  window.toggleProjectTask = toggleProjectTask;
  window.updateSearch = updateSearch;
  window.setFilter = setFilter;
  window.clearSearch = clearSearch;
  window.copyCode = copyCode;
  window.copyResumeTemplate = copyResumeTemplate;
  window.selectSqlChallenge = selectSqlChallenge;
  window.loadChallengeStarter = loadChallengeStarter;
  window.loadChallengeSolution = loadChallengeSolution;
  window.loadTableQuery = loadTableQuery;
  window.runSqlQuery = runSqlQuery;
  window.setQuizMode = setQuizMode;
  window.chooseOption = chooseOption;
  window.checkAnswer = checkAnswer;
  window.nextQuestion = nextQuestion;
  window.restartQuiz = restartQuiz;
  window.startMockExam = startMockExam;
  window.flipFlashcard = flipFlashcard;
  window.nextFlashcard = nextFlashcard;
  window.prevFlashcard = prevFlashcard;
  window.setArchTab = setArchTab;
  window.savePersonalNotes = savePersonalNotes;
  window.clearNotes = clearNotes;
  window.exportNotes = exportNotes;
  window.exportData = exportData;
  window.importData = importData;
  window.resetAllProgress = resetAllProgress;
  window.toggleTheme = toggleTheme;
  window.setAudioGender = setAudioGender;
  window.setAudioRate = setAudioRate;
  window.testAudioVoice = testAudioVoice;
  window.speakLesson = speakLesson;
  window.showInstallModal = showInstallModal;
  window.closeInstallModal = closeInstallModal;
  window.triggerPWAInstall = triggerPWAInstall;

  // Initialize App on DOM Ready
  document.addEventListener('DOMContentLoaded', () => {
    if (P.theme === 'light') document.body.classList.add('light');
    updateStreak();

    // Setup sidebar and mobile navigation click listeners
    $$('[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        go(btn.dataset.view);
      });
    });

    // Check URL hash routing (e.g. #roadmap, #sqllab)
    const hash = window.location.hash.replace('#', '');
    if (hash && ['dashboard', 'roadmap', 'learn', 'sqllab', 'quiz', 'architecture', 'interview', 'projects', 'career', 'notes', 'settings'].includes(hash)) {
      go(hash);
    } else {
      render();
    }
  });

})();
