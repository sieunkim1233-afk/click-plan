(function () {
  'use strict';

  const D = window.PLAN_DATA;

  /* =========================================================
   * AI 연결 지점
   * ---------------------------------------------------------
   * 브라우저는 OpenAI를 직접 부르지 않고, 같은 사이트의 Vercel 서버 함수(/api/*)만 불러요.
   * API 키는 서버(Vercel 환경변수 OPENAI_API_KEY)에만 있어요. 이 파일에는 절대 넣지 마세요.
   * AI가 실패하거나, 늦거나, 사용 횟수를 넘으면 data.js의 예시 데이터로 자연스럽게 넘어가요.
   * ========================================================= */
  const AI_TIMEOUT = { interpret: 15000, meeting: 25000 }; // 이 시간 안에 답이 없으면 예시 데이터로
  const DAILY_LIMIT = 20; // 브라우저 하나당 하루 AI 호출 수

  // 브라우저별 하루 사용 횟수 (저장이 막힌 브라우저에서는 이번 방문 동안만 세요)
  const quota = {
    mem: { day: '', n: 0 },
    read() {
      const day = new Date().toISOString().slice(0, 10);
      let q = this.mem;
      try { q = JSON.parse(localStorage.getItem('cp-ai-quota')) || q; } catch { /* 저장 불가 */ }
      return q.day === day ? q : { day, n: 0 };
    },
    take() {
      const q = this.read();
      if (q.n >= DAILY_LIMIT) return false;
      q.n += 1;
      this.mem = q;
      try { localStorage.setItem('cp-ai-quota', JSON.stringify(q)); } catch { /* 저장 불가 */ }
      return true;
    },
  };

  const AI = {
    online: null, // null: 확인 전 · true: AI 사용 가능 · false: 예시 데이터
    model: '',
    async check() {
      if (!/^https?:$/.test(location.protocol)) {
        this.online = false;
      } else {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 5000);
        try {
          const r = await fetch('/api/status', { cache: 'no-store', signal: ctrl.signal });
          const j = await r.json();
          this.online = Boolean(j.ai);
          this.model = String(j.model || '');
        } catch {
          this.online = false;
        } finally {
          clearTimeout(t);
        }
      }
      updateAiBadge();
      return this.online;
    },
    async ready() {
      return this.online === null ? this.check() : this.online;
    },
    async post(path, plan, ms) {
      if (!quota.take()) throw new Error('LIMIT');
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), ms);
      try {
        const r = await fetch(path, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ plan: planForAI(plan) }),
          signal: ctrl.signal,
        });
        if (r.status === 429) throw new Error('LIMIT');
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) throw new Error('FAIL');
        return j.data;
      } catch (e) {
        throw new Error(e && e.name === 'AbortError' ? 'TIMEOUT' : (e && e.message) || 'FAIL');
      } finally {
        clearTimeout(t);
      }
    },
    // 의뢰 화면: 정해진 의뢰 시나리오(예시 데이터)를 그대로 써요
    async getClientRequest() {
      return D.request;
    },
    // 팀 회의: AI 팀원이 학생 기획서에 맞춘 질문을 써요 → 실패하면 예시 질문
    async getMeetingQuestions(plan) {
      if (!(await this.ready())) return { meeting: D.meeting, source: 'example' };
      try {
        return { meeting: mergeMeeting(await this.post('/api/meeting', plan, AI_TIMEOUT.meeting)), source: 'ai' };
      } catch (e) {
        return { meeting: D.meeting, source: 'fallback', reason: e.message };
      }
    },
    // 미리보기: AI 개발자가 버튼 동작 문장을 읽고 연결할 화면을 정해요 → 실패하면 기본 규칙
    async interpretPlan(plan) {
      if (!(await this.ready())) return { actions: null, source: 'example' };
      try {
        const d = await this.post('/api/interpret', plan, AI_TIMEOUT.interpret);
        const toIndex = { screen1: 0, screen2: 1, screen3: 2 };
        const actions = {};
        ['home', 'schedule', 'map'].forEach((k) => {
          const v = d[k] || {};
          actions[k] = { target: k in d && v.target in toIndex ? toIndex[v.target] : -1, reason: String(v.reason || '') };
        });
        return { actions, source: 'ai' };
      } catch (e) {
        return { actions: null, source: 'fallback', reason: e.message };
      }
    },
    // 기본 규칙(예비용): 문장에 화면 이름이 들어 있으면 그 화면으로 이동
    interpretAction(text, screenNames, currentIndex) {
      const t = (text || '').replace(/\s+/g, '');
      if (!t) return { type: 'empty' };
      for (let i = 0; i < screenNames.length; i++) {
        if (i === currentIndex) continue;
        const n = screenNames[i].replace(/\s+/g, '');
        if (n && t.includes(n)) return { type: 'navigate', target: i };
      }
      return { type: 'unclear' };
    },
  };

  // AI에게 보낼 기획서 (학생이 쓴 내용만)
  function planForAI(plan) {
    return {
      purpose: plan.purpose,
      target: plan.target,
      screenNames: screenNames(plan),
      screens: plan.screens.map((x) => ({ desc: x.desc })),
      actions: { ...plan.actions },
    };
  }

  // AI가 쓴 문구를 예시 회의 틀에 끼워 넣기 (빈틈 종류와 선택지 효과는 그대로)
  function mergeMeeting(r) {
    const m = JSON.parse(JSON.stringify(D.meeting));
    if (Array.isArray(r.intro) && r.intro.length) m.intro = r.intro.map((x) => ({ by: x.by === 'designer' ? 'designer' : 'developer', text: String(x.text) }));
    m.questions.forEach((q) => {
      const a = r[q.id];
      if (!a) return;
      if (a.text) { q.text = String(a.text); delete q.textIfClear; }
      if (a.short) q.short = String(a.short);
      if (a.lesson) q.lesson = String(a.lesson);
      q.options.forEach((o) => {
        const x = a.options && a.options[o.id];
        if (x) ['label', 'desc', 'planText'].forEach((k) => { if (x[k]) o[k] = String(x[k]); });
      });
    });
    if (r.outro) m.outro = { by: m.outro.by, text: String(r.outro) };
    return m;
  }

  // 화면 아래쪽에 지금 AI 상태 표시
  function updateAiBadge() {
    const el = document.getElementById('aiBadge');
    if (!el) return;
    el.textContent = AI.online ? `AI 연결됨 · ${AI.model}` : '예시 데이터로 실행 중';
    el.classList.toggle('on', Boolean(AI.online));
  }

  // AI 결과를 어디서 가져왔는지 쉬운 말로
  function aiNote(kind, source, reason) {
    if (source === 'ai') return kind === 'interpret' ? 'AI 개발자 코디가 기획서 문장을 읽고 버튼을 연결했어요.' : 'AI 팀원이 내 기획서를 읽고 쓴 질문이에요.';
    if (source === 'example') return kind === 'interpret' ? 'AI 서버에 연결되지 않아 기본 규칙으로 버튼을 연결했어요.' : 'AI 서버에 연결되지 않아 예시 질문을 보여 드려요.';
    const why = reason === 'LIMIT' ? 'AI 사용 횟수를 다 써서' : reason === 'TIMEOUT' ? 'AI 응답이 늦어서' : 'AI 응답을 받지 못해서';
    return kind === 'interpret' ? `${why} 기본 규칙으로 버튼을 연결했어요.` : `${why} 예시 질문을 보여 드려요.`;
  }

  /* ---------- 작은 도우미 ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

  /* ---------- 선 아이콘 ----------
   * 직접 그린 SVG (24×24 격자 · 선 두께 1.75 · 표시 크기 20px로 통일)
   * 인터넷에서 불러오지 않고 코드 안에 들어 있어요. 색은 글자색을 따라가요. */
  const ICON_PATHS = {
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
    arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    check: '<path d="M5.5 12.5l4 4 9-9"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    circle: '<circle cx="12" cy="12" r="8.5"/>',
    checkCircle: '<circle cx="12" cy="12" r="8.5"/><path d="M8.2 12.3l2.6 2.6 5-5.3"/>',
    alert: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.8v5M12 16.2v.01"/>',
    home: '<path d="M4.5 10.5L12 4.5l7.5 6V19a1 1 0 0 1-1 1H15v-5.5H9V20H5.5a1 1 0 0 1-1-1z"/>',
    calendar: '<rect x="4.5" y="5.5" width="15" height="14" rx="2.5"/><path d="M4.5 10h15M9 3.5v4M15 3.5v4"/>',
    map: '<path d="M9 4.5L4 6.5v13l5-2 6 2 5-2v-13l-5 2z"/><path d="M9 4.5v13M15 6.5v13"/>',
    signal: '<path d="M5 18v-1.5M9.7 18v-4.5M14.3 18v-7.5M19 18V7.5"/>',
    battery: '<rect x="3" y="8" width="15.5" height="8" rx="2.5"/><path d="M21.5 11v2M6.5 12h6.5"/>',
  };
  const TAB_ICONS = ['home', 'calendar', 'map'];
  function icon(name) {
    return `<svg class="ic" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON_PATHS[name]}</svg>`;
  }

  function blankPlan() {
    return {
      purpose: '',
      target: '',
      screens: D.planForm.screens.slots.map(() => ({ name: '', desc: '' })),
      actions: { home: '', schedule: '', map: '' },
    };
  }
  function examplePlan() {
    const F = D.planForm;
    const p = blankPlan();
    p.purpose = F.purpose.example;
    p.target = F.target.example;
    p.screens = F.screens.slots.map((s) => ({ name: s.defaultName, desc: s.example }));
    F.actions.items.forEach((it) => (p.actions[it.key] = it.example));
    return p;
  }
  function screenName(plan, i) {
    return (plan.screens[i].name || '').trim() || D.planForm.screens.slots[i].defaultName;
  }
  function screenNames(plan) {
    return [0, 1, 2].map((i) => screenName(plan, i));
  }
  // {s1} {s2} {s3}를 학생이 정한 화면 이름으로 바꾸기
  function fill(text, plan = state.plan) {
    const n = screenNames(plan);
    return String(text).replace(/\{s([123])\}/g, (_, d) => n[d - 1]);
  }
  function homeResolved(plan = state.plan) {
    if (plan === state.plan && state.aiActions) return state.aiActions.home.target === 1;
    const r = AI.interpretAction(plan.actions.home, screenNames(plan), 0);
    return r.type === 'navigate' && r.target === 1;
  }
  const MEET = () => state.meeting || D.meeting; // AI가 쓴 회의가 있으면 그것, 없으면 예시
  const findQ = (id) => MEET().questions.find((q) => q.id === id);
  const findOpt = (q, id) => q.options.find((o) => o.id === id);

  /* =========================================================
   * 휴대폰 미리보기 (축제 앱)
   * ========================================================= */
  class Phone {
    constructor(el, opts) {
      this.el = el;
      this.o = opts; // { getPlan, getFixes, onLog }
      this.s = { screen: 0, day: D.festival.days[0].id, booth: null, page: null, highlight: false };
      this.timer = null;
      el.addEventListener('click', (e) => this.onClick(e));
      this.render();
    }
    get plan() { return this.o.getPlan(); }
    get fixes() { return (this.o.getFixes && this.o.getFixes()) || {}; }
    days() {
      const all = D.festival.days;
      return this.fixes.q2 === 'hide' ? all.filter((d) => d.performances.length) : all;
    }

    render() {
      const days = this.days();
      if (!days.some((d) => d.id === this.s.day)) this.s.day = days[0].id;
      const n = screenNames(this.plan);
      
      this.el.innerHTML = `
        <div class="phone">
          <div class="phone-island"></div>
          <div class="phone-screen">
            <div class="status"><span>9:41</span><span class="status-icons">${icon('signal')}${icon('battery')}</span></div>
            <div class="app-body">${this.body()}</div>
            <nav class="app-tabs">
              ${n.map((nm, i) => `<button type="button" class="tab ${this.s.screen === i ? 'on' : ''}" data-tab="${i}"><span class="tab-ico">${icon(TAB_ICONS[i])}</span><span class="tab-label">${esc(nm)}</span></button>`).join('')}
            </nav>
            ${this.sheet()}
            <div class="toast" role="status" aria-live="polite"></div>
          </div>
        </div>`;
    }

    body() {
      if (this.s.page) return this.boothPage();
      return [this.home, this.schedule, this.map][this.s.screen].call(this);
    }

    home() {
      const f = D.festival;
      const perfCount = f.days.reduce((n, d) => n + d.performances.length, 0);
      return `
        <div class="a-hero">
          <span class="a-badge">${esc(f.name)}</span>
          <h3>${esc(f.title)}</h3>
          <div class="a-ticket">
            <div><small>기간</small><b>${esc(f.period)}</b></div>
            <div><small>장소</small><b>${esc(f.place)}</b></div>
          </div>
        </div>
        <div class="a-stats">
          <div><b>${perfCount}</b><small>공연</small></div>
          <div><b>${f.booths.length}</b><small>부스</small></div>
          <div><b>${f.days.length}일</b><small>기간</small></div>
        </div>
        <button type="button" class="a-cta" data-act="home">오늘의 공연 보기</button>
        <div class="a-section"><h4>이 앱은요</h4><p class="a-muted">${esc(this.plan.purpose || '서비스 목적이 여기에 보여요.')}</p></div>
        <div class="a-section"><h4>공지</h4>${f.notices.map((t) => `<p class="a-notice">${esc(t)}</p>`).join('')}</div>`;
    }

    schedule() {
      const n = screenNames(this.plan);
      const fx = this.fixes;
      const days = this.days();
      const day = days.find((d) => d.id === this.s.day);
      const chips = days
        .map((d) => `<button type="button" class="a-chip ${d.id === day.id ? 'on' : ''}" data-day="${d.id}">${d.label}<small>${d.date}</small></button>`)
        .join('');
      let list;
      if (!day.performances.length) {
        list =
          fx.q2 === 'message'
            ? `<div class="a-empty"><b>${esc(day.label)}에는 공연이 없어요</b><p>${esc(day.note)}</p><button type="button" class="a-btn" data-day="${days[0].id}">${esc(days[0].label)} 공연 보기</button></div>`
            : `<div class="a-blank"></div>`;
      } else {
        const isToday = day.id === D.festival.todayDayId;
        list = day.performances
          .map((pf) => {
            const now = fx.q1 === 'now' && isToday && pf.id === D.festival.nowPlayingId;
            const pulse = now && this.s.highlight ? ' pulse' : '';
            return `<button type="button" class="a-perf ${now ? 'now' : ''}${pulse}" data-act="schedule" data-id="${pf.id}">
              <span class="a-time">${pf.time}</span>
              <span class="a-perf-info"><b>${esc(pf.title)}</b><small>${esc(pf.stage)}</small></span>
              ${now ? '<span class="a-live">공연 중</span>' : ''}
            </button>`;
          })
          .join('');
      }
      return `<h3 class="a-title">${esc(n[1])}</h3><div class="a-chips">${chips}</div><div class="a-list">${list}</div>`;
    }

    map() {
      const n = screenNames(this.plan);
      const f = D.festival;
      const zones = f.zones
        .map((z) => `<div class="a-zone" style="left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%"><span>${esc(z.name)}</span></div>`)
        .join('');
      const pins = f.booths
        .map((b, i) => {
          const sel = this.s.booth === b.id ? ' sel' : '';
          return `<button type="button" class="a-pin${sel}" style="left:${b.x}%;top:${b.y}%" data-act="map" data-id="${b.id}" aria-label="${i + 1}번 ${esc(b.name)}">${i + 1}</button>`;
        })
        .join('');
      return `<h3 class="a-title">${esc(n[2])}</h3><p class="a-muted a-small">부스 표시를 눌러 보세요</p><div class="a-map">${zones}${pins}</div>
        <div class="a-legend">${f.booths.map((b, i) => `<span><i>${i + 1}</i>${esc(b.name)}</span>`).join('')}</div>`;
    }

    boothInfo(b) {
      return `<div class="a-booth-head"><span class="a-booth-no">${D.festival.booths.indexOf(b) + 1}</span><div><span class="a-badge soft">${esc(b.category)}</span><h4>${esc(b.name)}</h4></div></div>
        <dl class="a-info"><div><dt>위치</dt><dd>${esc(b.place)}</dd></div><div><dt>운영</dt><dd>${esc(b.hours)}</dd></div></dl>
        <div class="a-tags">${b.items.map((i) => `<span>${esc(i)}</span>`).join('')}</div>`;
    }

    sheet() {
      if (this.fixes.q3 !== 'sheet' || !this.s.booth || this.s.screen !== 2) return '';
      const b = D.festival.booths.find((x) => x.id === this.s.booth);
      return `<div class="a-dim" data-act="close"></div><div class="a-sheet"><div class="a-grip"></div>${this.boothInfo(b)}<button type="button" class="a-btn full" data-act="close">닫기</button></div>`;
    }

    boothPage() {
      const b = D.festival.booths.find((x) => x.id === this.s.page);
      return `<div class="a-pagebar"><button type="button" class="a-back" data-act="back">${icon('chevronLeft')}뒤로</button><span>부스 정보</span></div>
        <div class="a-detail">${this.boothInfo(b)}<p class="a-muted a-small">지도에서 ${esc(b.place)} 위치를 찾아가세요.</p></div>`;
    }

    /* 화면 이동·알림 */
    go(i) {
      Object.assign(this.s, { screen: i, page: null, booth: null, highlight: false });
      this.render();
    }
    show({ screen = 0, day } = {}) {
      Object.assign(this.s, { screen, page: null, booth: null, highlight: false });
      if (day) this.s.day = day;
      this.render();
      const body = $('.app-body', this.el);
      if (body) body.scrollTop = 0;
    }
    toast(msg) {
      const t = $('.toast', this.el);
      if (!t) return;
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(this.timer);
      this.timer = setTimeout(() => t.classList.remove('show'), 3400);
    }
    log(key, where, what, kind) {
      if (this.o.onLog) this.o.onLog({ key, where, what, kind });
    }

    // 학생이 쓴 문장대로 버튼을 움직이기 (수정 전 동작)
    runAction(key, where) {
      const names = screenNames(this.plan);
      const text = (this.plan.actions[key] || '').trim();
      const ai = this.plan === state.plan && state.aiActions ? state.aiActions[key] : null;
      let target = -1;
      if (ai) target = ai.target === this.s.screen ? -1 : ai.target;
      else {
        const r = AI.interpretAction(text, names, this.s.screen);
        if (r.type === 'navigate') target = r.target;
      }
      if (target >= 0) {
        this.go(target);
        this.log(key, where, `${names[target]} 화면으로 이동`, 'ok');
      } else {
        this.toast(
          ai && ai.reason
            ? `AI 개발자 코디: ${ai.reason}`
            : text
              ? `기획서에는 “${text}”라고만 적혀 있어요. 어떤 화면을 보여 줄지 정해지지 않아 아무 일도 일어나지 않았어요.`
              : '이 버튼을 누르면 어떻게 되는지 기획서에 적혀 있지 않아요.'
        );
        this.log(key, where, '아무 일도 일어나지 않음', 'gap');
      }
    }

    onClick(e) {
      const t = e.target.closest('[data-tab],[data-day],[data-act]');
      if (!t || !this.el.contains(t)) return;
      const fx = this.fixes;
      const names = screenNames(this.plan);

      if (t.dataset.tab != null) return this.go(+t.dataset.tab);

      if (t.dataset.day != null) {
        this.s.day = t.dataset.day;
        this.s.highlight = false;
        this.render();
        const day = D.festival.days.find((d) => d.id === this.s.day);
        if (!day.performances.length) {
          if (fx.q2 === 'message') this.log('emptyDay', `${names[1]} › ${day.label}`, '안내 문구가 보임', 'ok');
          else this.log('emptyDay', `${names[1]} › ${day.label}`, '텅 빈 화면만 보임', 'gap');
        }
        return;
      }

      const act = t.dataset.act;
      if (act === 'home') {
        const where = `${names[0]} › 오늘의 공연 보기`;
        if (fx.q1) {
          this.go(1);
          const days = this.days();
          this.s.day = fx.q1 === 'now' && days.some((d) => d.id === D.festival.todayDayId) ? D.festival.todayDayId : days[0].id;
          this.s.highlight = fx.q1 === 'now';
          this.render();
          const body = $('.app-body', this.el);
          const now = $('.a-perf.now', this.el);
          if (body) body.scrollTop = now ? Math.max(0, now.offsetTop - 80) : 0;
          this.log('home', where, fx.q1 === 'now' ? '지금 공연 중인 공연이 강조됨' : `${names[1]} 맨 위로 이동`, 'ok');
        } else {
          this.runAction('home', where);
        }
      } else if (act === 'schedule') {
        this.runAction('schedule', `${names[1]} › 공연 카드`);
      } else if (act === 'map') {
        const b = D.festival.booths.find((x) => x.id === t.dataset.id);
        const where = `${names[2]} › ${b.name}`;
        if (fx.q3 === 'sheet') {
          this.s.booth = b.id;
          this.render();
          this.log('map', where, '정보 카드가 올라옴', 'ok');
        } else if (fx.q3 === 'page') {
          this.s.page = b.id;
          this.render();
          this.log('map', where, '부스 상세 화면으로 이동', 'ok');
        } else {
          this.runAction('map', where);
        }
      } else if (act === 'close') {
        this.s.booth = null;
        this.render();
      } else if (act === 'back') {
        this.s.page = null;
        this.render();
      }
    }
  }

  /* =========================================================
   * 앱 전체 흐름
   * ========================================================= */
  const STEPS = [
    { id: 'start', label: '시작' },
    { id: 'request', label: '의뢰' },
    { id: 'plan', label: '기획서' },
    { id: 'preview', label: '미리보기' },
    { id: 'meeting', label: '팀 회의' },
    { id: 'revise', label: '수정' },
    { id: 'result', label: '결과' },
  ];

  const state = {
    step: 0,
    maxStep: 0,
    plan: blankPlan(),
    answers: {}, // { q1: 'now', ... }
    memos: {},
    log: [],
    missions: {},
    seenRequest: false,
    seenMeeting: false,
  };

  const viewEl = $('#view');
  const stepperEl = $('#stepper');

  // 화면이 바뀔 때 부드럽게 전환 (지원하는 브라우저는 View Transitions 사용)
  const canTransition = !!document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function goTo(n) {
    state.step = n;
    state.maxStep = Math.max(state.maxStep, n);
    const run = () => {
      renderStepper();
      const r = [renderStart, renderRequest, renderPlan, renderPreview, renderMeeting, renderRevise, renderResult][n]();
      window.scrollTo(0, 0);
      return r;
    };
    if (canTransition) document.startViewTransition(run);
    else run();
  }

  function view(html) {
    viewEl.innerHTML = html;
    if (canTransition) return;
    viewEl.classList.remove('enter');
    void viewEl.offsetWidth;
    viewEl.classList.add('enter');
  }

  // 화면 제목: 왼쪽 큰 제목, 오른쪽 짧은 설명과 단계 번호
  function head(stepNo, title, desc) {
    return `<header class="screen-head">
      <span class="eyebrow">STEP ${stepNo} · ${STEPS[stepNo].label}</span>
      <h2>${title}</h2>
      <p>${desc}</p>
    </header>`;
  }


  function renderStepper() {
    stepperEl.hidden = state.step === 0;
    // 얇은 막대 6칸 + 현재 단계 글자 하나
    const total = STEPS.length - 1;
    const bars = STEPS.slice(1)
      .map((s, idx) => {
        const i = idx + 1;
        const cls = i === state.step ? 'cur' : i <= state.maxStep ? 'done' : '';
        const dis = i > state.maxStep ? 'disabled' : '';
        return `<button type="button" class="st ${cls}" data-go="${i}" ${dis} aria-label="${i}단계 ${s.label}" ${i === state.step ? 'aria-current="step"' : ''}></button>`;
      })
      .join('');
    stepperEl.innerHTML = `<span class="st-text"><b>${STEPS[state.step].label}</b> ${state.step}/${total}</span><div class="st-bar">${bars}</div>`;
  }

  /* ---------- 메신저(카카오톡 스타일) 채팅 ---------- */
  const chatTime = (i) => `오후 4:${String(10 + Math.floor(i / 2)).padStart(2, '0')}`;
  // 같은 사람이 연달아 말하면 프로필을 한 번만 보여 줘요
  function bubble(m, i, list) {
    const p = D.team[m.by];
    const cont = i > 0 && list[i - 1].by === m.by;
    return `<div class="msg msg-${m.by}${cont ? ' cont' : ''}">
      <div class="avatar" style="background:${p.color}" aria-hidden="true">${cont ? '' : p.avatar}</div>
      <div class="msg-main">
        ${cont ? '' : `<div class="who">${esc(p.role)} <b>${esc(p.name)}</b></div>`}
        <div class="msg-row"><div class="bubble">${m.html}</div><time>${chatTime(i)}</time></div>
      </div>
    </div>`;
  }
  // 채팅방 틀: 위쪽 방 이름, 가운데 대화, 아래쪽 입력창
  function room(id, title, members) {
    return `<div class="room">
      <div class="room-head">
        <span class="room-back" aria-hidden="true">${icon('chevronLeft')}</span>
        <div class="room-title"><b>${title}</b><small id="${id}Status">${members}</small></div>
        <span class="room-menu" aria-hidden="true">${icon('menu')}</span>
      </div>
      <div class="chat" id="${id}" role="log" aria-live="polite"></div>
      <div class="room-foot" id="${id}Foot"><div class="fake-input">대화를 지켜보는 중이에요</div><span class="send" aria-hidden="true">${icon('arrowUp')}</span></div>
    </div>`;
  }
  // 말풍선을 하나씩 보여 주기 (입력 중 표시 포함)
  function playChat(box, msgs, { instant = false, onDone, statusEl, statusText = '' } = {}) {
    const day = '<div class="day-pill">2026년 11월 5일 목요일</div>';
    const toBottom = () => (box.scrollTop = box.scrollHeight);
    if (instant) {
      box.innerHTML = day + msgs.map(bubble).join('');
      toBottom();
      onDone && onDone();
      return;
    }
    box.innerHTML = day;
    let i = 0;
    const next = () => {
      if (!box.isConnected) return;
      if (i >= msgs.length) {
        if (statusEl) statusEl.textContent = statusText;
        return onDone && onDone();
      }
      const idx = i++;
      const m = msgs[idx];
      const p = D.team[m.by];
      const cont = idx > 0 && msgs[idx - 1].by === m.by;
      const typing = document.createElement('div');
      typing.className = `msg msg-${m.by}${cont ? ' cont' : ''}`;
      typing.innerHTML = `<div class="avatar" style="background:${p.color}" aria-hidden="true">${cont ? '' : p.avatar}</div>
        <div class="msg-main">${cont ? '' : `<div class="who">${esc(p.role)} <b>${esc(p.name)}</b></div>`}
          <div class="msg-row"><div class="bubble typing" aria-label="입력 중"><i></i><i></i><i></i></div></div></div>`;
      box.appendChild(typing);
      if (statusEl) statusEl.textContent = `${p.name} 님이 입력 중…`;
      toBottom();
      setTimeout(() => {
        if (!box.isConnected) return;
        const holder = document.createElement('div');
        holder.innerHTML = bubble(m, idx, msgs);
        typing.replaceWith(holder.firstElementChild);
        toBottom();
        setTimeout(next, 350);
      }, Math.min(1500, 600 + m.html.length * 6));
    };
    setTimeout(next, 300);
  }

  /* ---------- 1. 시작 (스크롤 모션) ---------- */
  function renderStart() {
    const s = D.service;
    const st = s.story;
    const f = D.festival;
    const today = f.days.find((d) => d.id === f.todayDayId);
    const perfs = today.performances.slice(0, 2);
    const emptyDay = f.days.find((d) => !d.performances.length);
    const tabs = D.planForm.screens.slots.map((x) => x.defaultName);
    const sentence = st.sentence
      .map((part) => {
        const chars = [...part.t].map((c) => `<span class="ch">${esc(c)}</span>`).join('');
        return part.k ? `<span class="kw" data-k="${part.k}">${chars}</span>` : chars;
      })
      .join('');
    view(`
      <section class="start">
        <section class="story" id="story">
          <div class="story-sticky">
            <div class="story-cap">
              <div class="cap cap-intro on">
                <span class="eyebrow">IT 기획자 첫 프로젝트 체험</span>
                <h1>${esc(s.name)}</h1>
                <p class="lead">${esc(s.tagline)}</p>
                <p class="sub">${esc(s.intro)}</p>
                <div class="start-actions">
                  <button type="button" class="btn primary lg" data-go="1">시작하기 ${icon('arrowRight')}</button>
                  <ul class="meta">${s.meta.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
                </div>
                <p class="scroll-hint">${icon('arrowDown')}스크롤하면 기획서가 앱이 돼요</p>
              </div>
              ${st.scenes
                .map((c, i) => `<div class="cap"><span class="cap-no">0${i + 1} / 06</span><h2>${esc(c.title)}</h2><p>${esc(c.desc)}</p></div>`)
                .join('')}
              <div class="cap cap-final">
                <span class="cap-no">06 / 06</span>
                <h2>${esc(st.final.title)}</h2>
                <p>${esc(st.final.desc)}</p>
                <button type="button" class="btn primary lg" data-go="1">${esc(st.final.button)} ${icon('arrowRight')}</button>
              </div>
              <div class="story-progress" aria-hidden="true"><i></i></div>
            </div>

            <div class="stage-fit" aria-hidden="true">
              <div class="stage">
                <div class="sd"><div class="sd-head"><b>기획서</b><small>버튼 동작</small></div><p class="sd-text">${sentence}</p></div>
                ${st.sentence.filter((x) => x.k).map((x) => `<span class="frag" data-k="${x.k}">${esc(x.t)}</span>`).join('')}
                <div class="sp">
                  <div class="sp-island"></div>
                  <div class="sp-screen">
                    <div class="c c-hero" data-o="0"><small>${esc(f.name)}</small><b>${esc(f.title)}</b></div>
                    <div class="c c-btn" data-c="btn" data-o="1"><span class="v0">오늘의 공연 보기</span><span class="v1">오늘의 공연 보기 ${icon('arrowRight')}</span></div>
                    <div class="c c-title" data-c="list" data-o="2">${esc(tabs[1])}</div>
                    ${perfs
                      .map((p, i) => {
                        const now = p.id === f.nowPlayingId;
                        return `<div class="c c-perf" data-o="${3 + i}"><span>${p.time}</span><b>${esc(p.title)}</b>${now ? '<em class="v1">공연 중</em><i class="hl"></i>' : ''}</div>`;
                      })
                      .join('')}
                    <div class="c c-empty" data-c="empty" data-o="5"><span class="v0">${esc(emptyDay.label)}</span><span class="v1">${esc(emptyDay.note)}</span></div>
                    <div class="c c-tabs" data-c="nav" data-o="6">${tabs.map((t, i) => `<span class="${i === 0 ? 'on' : ''}">${esc(t)}</span>`).join('')}</div>
                  </div>
                </div>
                ${st.bubbles
                  .map((b, i) => `<span class="mk" data-for="${b.for}"><span class="mk-n">${i + 1}</span><span class="mk-ok">${icon('check')}</span></span>`)
                  .join('')}
                ${st.bubbles
                  .map((b, i) => {
                    const p = D.team[b.by];
                    return `<div class="bb" data-for="${b.for}"><span class="avatar">${esc(p.avatar)}</span><div class="bb-main"><div class="who">${esc(p.role)} <b>${esc(p.name)}</b><span class="bb-tag">빈틈 ${i + 1}</span></div><div class="bubble">${esc(b.text)}</div></div></div>`;
                  })
                  .join('')}
              </div>
            </div>
          </div>
        </section>

        <h2 class="bento-title">이렇게 진행돼요</h2>
        <div class="bento">
          ${s.steps
            .map((x, i) => `<div class="tile t${i + 1}"><span class="tile-no">0${i + 1}</span><div><b>${esc(x.title)}</b><small>${esc(x.desc)}</small></div></div>`)
            .join('')}
        </div>
      </section>`);
    initStory($('#story'));
  }

  /* 스크롤 모션 엔진
   * 스크롤 위치 → 진행도(0~1) → 장면별 위치·투명도를 그때그때 계산해요.
   * 시간이 아니라 스크롤 위치로만 정해지므로, 위아래로 움직이면 정확히 앞뒤로 따라와요. */
  function initStory(root) {
    const all = (sel) => [...root.querySelectorAll(sel)];
    const sticky = $('.story-sticky', root);
    const capBox = $('.story-cap', root);
    const fit = $('.stage-fit', root);
    const stage = $('.stage', root);
    const doc = $('.sd', root);
    const bar = $('.story-progress i', root);
    const caps = all('.cap');
    const chars = all('.ch');
    const frags = all('.frag');
    const comps = all('.c');
    const marks = all('.mk');
    const bubbles = all('.bb');
    const kws = Object.fromEntries(all('.kw').map((el) => [el.dataset.k, el]));
    const target = Object.fromEntries(all('[data-c]').map((el) => [el.dataset.c, el]));
    const mqV = window.matchMedia('(max-width: 760px)');
    const mqR = window.matchMedia('(prefers-reduced-motion: reduce)');

    const clamp = (v) => Math.min(1, Math.max(0, v));
    const seg = (p, a, b) => clamp((p - a) / (b - a));
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const lerp = (a, b, t) => a + (b - a) * t;
    const pos = (el) => {
      let x = 0, y = 0;
      while (el && el !== stage) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
      return { x, y };
    };
    const center = (el) => { const p = pos(el); return { x: p.x + el.offsetWidth / 2, y: p.y + el.offsetHeight / 2 }; };

    // 장면 경계 (진행도 기준)
    const CUT = [0.04, 0.18, 0.34, 0.5, 0.68, 0.84];
    let geo = { frags: [], marks: [] };
    let vertical = false, still = false, lastN = -1, lastCap = -1, raf = 0;

    function measure() {
      vertical = mqV.matches;
      still = mqR.matches;
      root.classList.toggle('static', still);
      stage.classList.toggle('v', vertical);
      stage.classList.toggle('h', !vertical);
      caps.forEach((c) => c.classList.remove('on'));
      caps[0].classList.add('on');
      lastCap = -1;
      lastN = -1;

      // 무대를 화면 크기에 맞게 줄이기
      const natW = stage.offsetWidth, natH = stage.offsetHeight;
      const availW = fit.clientWidth || natW;
      let availH = Infinity;
      if (!still) availH = vertical ? sticky.clientHeight - capBox.offsetHeight - 48 : sticky.clientHeight - 48;
      const k = Math.max(0.3, Math.min(1, availW / natW, availH / natH));
      stage.style.transform = `translate(${(availW - natW * k) / 2}px, 0) scale(${k})`;
      fit.style.height = `${natH * k}px`;

      // 조각이 출발하고 도착할 자리, 빈틈 표시 자리
      geo = {
        frags: frags.map((el) => ({ from: center(kws[el.dataset.k]), to: center(target[el.dataset.k]), w: el.offsetWidth, h: el.offsetHeight })),
        marks: marks.map((el) => {
          const t = target[el.dataset.for];
          const p = pos(t);
          return { x: p.x + t.offsetWidth - el.offsetWidth / 2 - 4, y: p.y - el.offsetHeight / 2 + 4 };
        }),
      };
      // 넓은 화면: 말풍선을 해당 빈틈 높이에 맞춰 두기
      bubbles.forEach((el, i) => {
        if (vertical) { el.style.top = ''; return; }
        const h = el.offsetHeight;
        el.style.top = `${Math.max(0, Math.min(stage.offsetHeight - h, geo.marks[i].y + 14 - h / 2))}px`;
      });
      render(progress());
    }

    function progress() {
      if (still) return 1;
      const r = root.getBoundingClientRect();
      const top = parseFloat(getComputedStyle(sticky).top) || 0; // 고정되는 위치(상단 바 바로 아래)
      const total = r.height - sticky.offsetHeight;
      return total > 0 ? clamp((top - r.top) / total) : 0;
    }

    function render(p) {
      // 왼쪽 문구
      if (!still) {
        let ci = 0;
        while (ci < CUT.length && p >= CUT[ci]) ci++;
        if (ci !== lastCap) { caps.forEach((c, i) => c.classList.toggle('on', i === ci)); lastCap = ci; }
        bar.style.width = `${p * 100}%`;
      }

      // 장면 1: 한 글자씩 입력
      const n = still ? chars.length : Math.round(seg(p, 0.04, 0.16) * chars.length);
      if (n !== lastN) {
        chars.forEach((c, i) => { c.classList.toggle('on', i < n); c.classList.toggle('caret', i === n - 1 && n < chars.length); });
        lastN = n;
      }
      doc.style.opacity = still ? 1 : 1 - seg(p, 0.5, 0.56);

      // 장면 2: 핵심 단어가 조각으로 분리되어 휴대폰으로 이동
      frags.forEach((el, i) => {
        const g = geo.frags[i];
        const kw = kws[el.dataset.k];
        const t = ease(seg(p, 0.18 + i * 0.03, 0.3 + i * 0.03));
        const show = still ? 0 : Math.min(seg(p, 0.17, 0.19), 1 - seg(p, 0.36 + i * 0.03, 0.41 + i * 0.03));
        el.style.opacity = show;
        el.style.transform = `translate(${lerp(g.from.x, g.to.x, t) - g.w / 2}px, ${lerp(g.from.y, g.to.y, t) - g.h / 2}px)`;
        kw.classList.toggle('mark', !still && p >= 0.17);
        kw.style.opacity = still ? 1 : 1 - 0.65 * seg(p, 0.18 + i * 0.03, 0.22 + i * 0.03);
      });

      // 장면 3: 버튼과 카드로 조립
      comps.forEach((el) => {
        const i = +el.dataset.o;
        const o = still ? 1 : ease(seg(p, 0.34 + i * 0.02, 0.42 + i * 0.02));
        el.style.opacity = o;
        el.style.transform = vertical || still ? '' : `translateY(${(1 - o) * 8}px)`;
      });

      // 장면 4: 빈틈 표시와 AI 말풍선
      marks.forEach((el, i) => {
        const o = still ? 1 : seg(p, 0.52 + i * 0.06, 0.55 + i * 0.06);
        const m = geo.marks[i];
        el.style.opacity = o;
        el.style.transform = `translate(${m.x}px, ${m.y}px) scale(${0.85 + 0.15 * o})`;
      });
      bubbles.forEach((el, i) => {
        const o = still ? 0 : Math.min(seg(p, 0.54 + i * 0.06, 0.58 + i * 0.06), 1 - seg(p, 0.7, 0.75));
        el.style.opacity = o;
        el.style.visibility = o > 0 ? 'visible' : 'hidden';
        el.style.transform = vertical ? '' : `translateY(${(1 - o) * 8}px)`;
      });

      // 장면 5: 답변 반영 → 더 좋은 버전 (0 → 1로 서서히 바뀜)
      stage.style.setProperty('--after', String(still ? 1 : ease(seg(p, 0.7, 0.8))));
    }

    const onScroll = () => {
      if (!root.isConnected) return cleanup();
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(progress()); });
    };
    const onResize = () => (root.isConnected ? measure() : cleanup());
    function cleanup() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      mqV.removeEventListener('change', onResize);
      mqR.removeEventListener('change', onResize);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    mqV.addEventListener('change', onResize);
    mqR.addEventListener('change', onResize);
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => root.isConnected && measure());
  }

  /* ---------- 2. 의뢰 ---------- */
  async function renderRequest() {
    const req = await AI.getClientRequest();
    view(`
      <section class="screen">
        ${head(1, '새 의뢰가 도착했어요', '의뢰인이 무엇을 원하는지 파악해 보세요.')}
        <div class="two-col">
          ${room('reqChat', `${esc(D.team.client.avatar)} ${esc(D.team.client.name)}`, '1:1 의뢰 대화')}
          <aside class="card brief" id="brief">
            <h3>의뢰서 요약</h3>
            <dl>${req.brief.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
            <p class="small brief-note">기획자의 첫 일 = 의뢰인의 <b>불편함</b>을 정확히 아는 것</p>
            <div class="brief-actions">
              <button type="button" class="btn ghost" data-go="0">${icon('arrowLeft')}처음으로</button>
              <button type="button" class="btn primary" data-go="2">의뢰 수락하고 기획서 쓰기 ${icon('arrowRight')}</button>
            </div>
          </aside>
        </div>
      </section>`);
    const msgs = req.messages.map((m) => ({ by: 'client', html: m.strong ? `<strong>${esc(m.text)}</strong>` : esc(m.text) }));
    playChat($('#reqChat'), msgs, {
      instant: state.seenRequest,
      statusEl: $('#reqChatStatus'),
      statusText: '1:1 의뢰 대화',
      onDone: () => {
        state.seenRequest = true;
        const foot = $('#reqChatFoot');
        if (foot) foot.innerHTML = `<div class="fake-input">의뢰를 다 읽었다면 오른쪽에서 수락해 주세요</div><span class="send on" aria-hidden="true">${icon('arrowUp')}</span>`;
      },
    });
  }

  /* ---------- 3. 기획서 작성 ---------- */
  function renderPlan() {
    const F = D.planForm;
    const p = state.plan;
    const textField = (no, key) => {
      const f = F[key];
      return `<fieldset class="f-block" data-field="${key}">
        <legend><span class="num">${no}</span>${esc(f.label)}</legend>
        <label class="f-q" for="f-${key}">${esc(f.question)}</label>
        <textarea id="f-${key}" name="${key}" rows="2" placeholder="${esc(f.placeholder)}">${esc(p[key])}</textarea>
        <p class="f-hint">${esc(f.hint)}</p>
      </fieldset>`;
    };
    view(`
      <section class="screen">
        ${head(2, '기획서를 써 볼까요?', '네 칸을 채우면, 그대로 앱이 돼요.')}
        <div class="plan-layout">
          <form class="plan-form card" id="planForm" novalidate>
            <div class="form-tools">
              <button type="button" class="btn soft sm" id="fillExample">예시로 채워 보기</button>
              <span class="muted small">처음이라면 예시를 채운 뒤 내 말로 고쳐 보세요.</span>
            </div>
            ${textField(1, 'purpose')}
            ${textField(2, 'target')}
            <fieldset class="f-block" data-field="screens">
              <legend><span class="num">3</span>${esc(F.screens.label)}</legend>
              <p class="f-q">${esc(F.screens.question)}</p>
              ${F.screens.slots
                .map(
                  (sl, i) => `<div class="screen-row">
                    <span class="slot">${i + 1}</span>
                    <input name="screen-name-${i}" value="${esc(p.screens[i].name)}" placeholder="${esc(sl.defaultName)}" maxlength="10" aria-label="${i + 1}번 화면 이름">
                    <input name="screen-desc-${i}" value="${esc(p.screens[i].desc)}" placeholder="${esc(sl.descPlaceholder)}" aria-label="${i + 1}번 화면 설명">
                  </div>`
                )
                .join('')}
              <p class="f-hint">${esc(F.screens.hint)}</p>
            </fieldset>
            <fieldset class="f-block" data-field="actions">
              <legend><span class="num">4</span>${esc(F.actions.label)}</legend>
              <p class="f-q">${esc(F.actions.question)}</p>
              ${F.actions.items
                .map(
                  (it) => `<div class="action-row" data-action="${it.key}">
                    <label for="action-${it.key}"><span class="pill" data-screen-label="${it.screenIndex}">${esc(screenName(p, it.screenIndex))}</span> 화면의 <b>${esc(it.button)}</b>을(를) 누르면…</label>
                    <textarea id="action-${it.key}" name="action-${it.key}" rows="2" placeholder="${esc(it.placeholder)}">${esc(p.actions[it.key])}</textarea>
                  </div>`
                )
                .join('')}
              <p class="f-hint">${esc(F.actions.hint)}</p>
            </fieldset>
            <div class="form-error" id="formError" role="alert" hidden></div>
            <div class="form-actions">
              <button type="button" class="btn ghost" data-go="1">${icon('arrowLeft')}의뢰 다시 보기</button>
              <button type="submit" class="btn primary">기획서로 앱 만들기 ${icon('arrowRight')}</button>
            </div>
          </form>
          <aside class="card tips sticky">
            <div class="meter">
              <div class="meter-top"><small>기획서 완성도</small><b id="meterNum">0/4</b></div>
              <div class="meter-bar"><i id="meterBar"></i></div>
              <ol class="meter-list" id="meterList">
                ${[['purpose', F.purpose.label], ['target', F.target.label], ['screens', F.screens.label], ['actions', F.actions.label]]
                  .map(([k, l], i) => `<li data-k="${k}"><span class="ic-off">${icon('circle')}</span><span class="ic-on">${icon('checkCircle')}</span>${esc(l)}</li>`)
                  .join('')}
              </ol>
            </div>
            <h3>처음 쓰는 기획서 팁</h3>
            <ul>${F.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
            <div class="mini-brief"><small>의뢰 한 줄 요약</small><b>대학생용 축제 앱 · 화면 3개</b><span>공연 일정과 부스 위치를 쉽게!</span></div>
          </aside>
        </div>
      </section>`);

    const form = $('#planForm');
    const sync = () => {
      const fd = new FormData(form);
      p.purpose = fd.get('purpose').trim();
      p.target = fd.get('target').trim();
      p.screens.forEach((s, i) => {
        s.name = fd.get(`screen-name-${i}`).trim();
        s.desc = fd.get(`screen-desc-${i}`).trim();
      });
      F.actions.items.forEach((it) => (p.actions[it.key] = fd.get(`action-${it.key}`).trim()));
      form.querySelectorAll('[data-screen-label]').forEach((el) => (el.textContent = screenName(p, +el.dataset.screenLabel)));
      // 완성도 패널 갱신
      const done = {
        purpose: !!p.purpose,
        target: !!p.target,
        screens: p.screens.some((s) => s.desc),
        actions: F.actions.items.every((it) => p.actions[it.key]),
      };
      const n = Object.values(done).filter(Boolean).length;
      $('#meterNum').textContent = `${n}/4`;
      $('#meterBar').style.width = `${n * 25}%`;
      document.querySelectorAll('#meterList li').forEach((li) => li.classList.toggle('ok', done[li.dataset.k]));
    };
    sync();
    form.addEventListener('input', (e) => {
      sync();
      e.target.closest('.f-block')?.classList.remove('invalid');
    });
    $('#fillExample').addEventListener('click', () => {
      const hasText = form.querySelector('textarea:not(:placeholder-shown), input:not(:placeholder-shown)');
      if (hasText && !confirm('지금 쓴 내용이 예시로 바뀌어요. 계속할까요?')) return;
      state.plan = examplePlan();
      renderPlan();
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.dataset.busy) return;
      sync();
      const missing = [];
      const mark = (key, label) => {
        missing.push(label);
        form.querySelector(`[data-field="${key}"]`).classList.add('invalid');
      };
      if (!p.purpose) mark('purpose', '서비스 목적');
      if (!p.target) mark('target', '대상 사용자');
      if (F.actions.items.some((it) => !p.actions[it.key])) mark('actions', '버튼 동작');
      const err = $('#formError');
      if (missing.length) {
        err.hidden = false;
        err.textContent = `아직 비어 있어요: ${missing.join(', ')}. 짧게라도 적어 주세요!`;
        form.querySelector('.invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      state.log = [];
      state.missions = {};

      // 로딩 표시: AI 개발자가 기획서를 읽는 동안
      const btn = form.querySelector('[type="submit"]');
      form.dataset.busy = '1';
      btn.disabled = true;
      btn.innerHTML = '<span class="spin" aria-hidden="true"></span>AI 개발자가 기획서를 읽는 중…';
      const snapshot = JSON.parse(JSON.stringify(p));
      const res = await AI.interpretPlan(snapshot);
      state.aiActions = res.actions;
      state.aiActionsNote = aiNote('interpret', res.source, res.reason);
      // 회의 질문은 미리 요청해 두고, 회의 화면에서 받아 써요
      state.meeting = null;
      state.meetingNote = '';
      state.seenMeeting = false;
      state.meetingPromise = AI.getMeetingQuestions(snapshot);
      if (form.isConnected) goTo(3);
    });
  }

  /* ---------- 4. 앱 미리보기 ---------- */
  function renderPreview() {
    view(`
      <section class="screen">
        ${head(3, '내 기획서가 앱이 됐어요', '적힌 문장 그대로 움직여요. 눌러 보며 이상한 곳을 찾아보세요.')}
        <div class="preview-layout">
          <div class="phone-col"><div id="phone"></div><p class="caption ai-note">${esc(state.aiActionsNote || '')}</p></div>
          <aside class="side">
            <div class="card"><h3>이렇게 눌러 보세요</h3><ul class="missions" id="missions"></ul></div>
            <div class="card"><h3>눌러 본 기록</h3><ol class="log" id="log"></ol></div>
            <div class="card note">
              <b>이상한 점을 찾았나요?</b>
              <p class="muted small">AI 디자이너와 개발자도 같은 앱을 눌러 봤어요. 회의에서 함께 이야기해 봐요.</p>
              <div class="note-actions">
                <button type="button" class="btn ghost" data-go="2">${icon('arrowLeft')}기획서 고치기</button>
                <button type="button" class="btn primary" data-go="4">AI 팀 회의 열기 ${icon('arrowRight')}</button>
              </div>
            </div>
          </aside>
        </div>
      </section>`);
    const drawSide = () => {
      $('#missions').innerHTML = D.preview.missions
        .map((m) => `<li class="${state.missions[m.key] ? 'ok' : ''}"><span class="check">${icon(state.missions[m.key] ? 'checkCircle' : 'circle')}</span>${esc(fill(m.text))}</li>`)
        .join('');
      $('#log').innerHTML = state.log.length
        ? state.log.map((l) => `<li class="${l.kind}"><span>${esc(l.where)}</span><b>${icon(l.kind === 'gap' ? 'alert' : 'checkCircle')}${esc(l.what)}</b></li>`).join('')
        : '<li class="empty">아직 눌러 본 버튼이 없어요. 휴대폰 화면을 눌러 보세요!</li>';
    };
    drawSide();
    new Phone($('#phone'), {
      getPlan: () => state.plan,
      getFixes: () => ({}),
      onLog: (l) => {
        state.missions[l.key] = true;
        state.log.unshift(l);
        state.log = state.log.slice(0, 6);
        drawSide();
      },
    });
  }

  /* ---------- 5. AI 팀 회의 ---------- */
  function questionHtml(q) {
    const clear = q.id === 'q1' && homeResolved();
    const quote = getPath(state.plan, q.quote);
    return `<span class="gap-tag">빈틈 ${q.gapNo} · ${esc(q.gapTitle)}</span>
      <p>${esc(fill(clear && q.textIfClear ? q.textIfClear : q.text))}</p>
      <div class="quote"><small>기획서에 적힌 내용 · ${esc(fill(q.quoteLabel))}</small>“${esc(quote || '(비어 있음)')}”</div>`;
  }

  function renderMeeting() {
    view(`
      <section class="screen">
        ${head(4, 'AI 팀 회의', '팀원들이 기획의 빈틈을 질문해요.')}
        <div class="meeting-layout">
          ${room('meetChat', '축제 앱 기획팀 <span class="count">3</span>', '디자이너 · 개발자 · 나')}
          <aside class="card team">
            <h3>오늘 회의 참석자</h3>
            <ul>
              ${['designer', 'developer']
                .map((k) => `<li><span class="avatar" style="background:${D.team[k].color}">${D.team[k].avatar}</span><div><b>${esc(D.team[k].role)} ${esc(D.team[k].name)}</b><small>${k === 'designer' ? '화면이 어떻게 보일지 그려요' : '버튼이 어떻게 움직일지 만들어요'}</small></div></li>`)
                .join('')}
              <li><span class="avatar me">나</span><div><b>나 (기획자)</b><small>무엇을 만들지 정해요</small></div></li>
            </ul>
            <p class="small team-note">질문은 꾸중이 아니에요.<br><b>빈틈을 함께 찾는 과정</b>이에요.</p>
            <p class="small ai-note" id="meetNote"></p>
            <button type="button" class="btn ghost sm" id="skipChat">대화 한 번에 보기</button>
          </aside>
        </div>
      </section>`);
    // 로딩 표시: AI 팀원이 기획서를 읽는 동안
    const box0 = $('#meetChat');
    const status0 = $('#meetChatStatus');
    if (!state.meeting) {
      box0.innerHTML = `<div class="day-pill">2026년 11월 5일 목요일</div><div class="msg msg-developer"><div class="avatar" aria-hidden="true">${esc(D.team.developer.avatar)}</div><div class="msg-main"><div class="msg-row"><div class="bubble typing" aria-label="입력 중"><i></i><i></i><i></i></div></div></div></div>`;
      status0.textContent = 'AI 팀원이 기획서를 읽는 중…';
      $('#skipChat').hidden = true;
    }
    const pending = state.meeting
      ? Promise.resolve({ meeting: state.meeting, note: state.meetingNote })
      : (state.meetingPromise || AI.getMeetingQuestions(state.plan)).then((r) => {
          state.meeting = r.meeting;
          state.meetingNote = aiNote('meeting', r.source, r.reason);
          state.meetingPromise = null;
          return { meeting: r.meeting, note: state.meetingNote };
        });
    pending.then(({ meeting, note }) => {
      if (!box0.isConnected) return;
      $('#skipChat').hidden = false;
      $('#meetNote').textContent = note || '';
      startMeetingChat(meeting);
    });
  }

  function startMeetingChat(m) {
    const msgs = [
      ...m.intro.map((x) => ({ by: x.by, html: esc(fill(x.text)) })),
      ...m.questions.map((q) => ({ by: q.by, html: questionHtml(q) })),
      { by: m.outro.by, html: esc(fill(m.outro.text)) },
    ];
    const done = () => {
      state.seenMeeting = true;
      const foot = $('#meetChatFoot');
      if (foot) foot.innerHTML = `<button type="button" class="btn primary full" data-go="5">질문 3개에 답하러 가기 ${icon('arrowRight')}</button>`;
      const sk = $('#skipChat');
      if (sk) sk.hidden = true;
    };
    const box = $('#meetChat');
    const chatOpts = { statusEl: $('#meetChatStatus'), statusText: '디자이너 · 개발자 · 나', onDone: done };
    playChat(box, msgs, { ...chatOpts, instant: state.seenMeeting });
    $('#skipChat').addEventListener('click', () => {
      const fresh = box.cloneNode(false); // 진행 중인 애니메이션 멈추기
      box.replaceWith(fresh);
      playChat(fresh, msgs, { ...chatOpts, instant: true });
      $('#meetChatStatus').textContent = chatOpts.statusText;
    });
  }

  /* ---------- 6. 수정 ---------- */
  function renderRevise() {
    const qs = MEET().questions;
    let mode = 'after';
    const qCard = (q) => {
      const p = D.team[q.by];
      const clear = q.id === 'q1' && homeResolved();
      return `<article class="card q-card ${state.answers[q.id] ? 'done' : ''}" data-q="${q.id}">
        <header>
          <span class="avatar" style="background:${p.color}">${p.avatar}</span>
          <div><span class="gap-tag">빈틈 ${q.gapNo} · ${esc(q.gapTitle)}</span><p class="q-text">${esc(fill(clear && q.textIfClear ? q.textIfClear : q.text))}</p></div>
        </header>
        <div class="options" role="radiogroup" aria-label="빈틈 ${q.gapNo} 답변">
          ${q.options
            .map(
              (o) => `<label class="opt">
                <input type="radio" name="ans-${q.id}" value="${o.id}" ${state.answers[q.id] === o.id ? 'checked' : ''}>
                <span class="opt-body"><b>${esc(o.label)}</b><small>${esc(fill(o.desc))}</small></span>
              </label>`
            )
            .join('')}
        </div>
        <label class="memo">내 말로 덧붙이기 <span class="muted">(선택)</span>
          <textarea name="memo-${q.id}" rows="2" placeholder="예: 공연 시작 10분 전에는 '곧 시작'이라고 표시하기">${esc(state.memos[q.id] || '')}</textarea>
        </label>
      </article>`;
    };
    view(`
      <section class="screen">
        ${head(5, '답을 고르면 앱이 바로 바뀌어요', '질문마다 하나씩 골라 보세요.')}
        <div class="revise-layout">
          <div class="questions" id="questions">${qs.map(qCard).join('')}</div>
          <div class="phone-col sticky">
            <div class="seg" role="group" aria-label="미리보기 전환">
              <button type="button" data-mode="after" class="on">수정 후</button>
              <button type="button" data-mode="before">수정 전</button>
            </div>
            <div id="phone"></div>
            <p class="caption" id="progress"></p>
          </div>
        </div>
        <div class="form-error" id="reviseError" role="alert" hidden></div>
        <div class="form-actions">
          <button type="button" class="btn ghost" data-go="4">${icon('arrowLeft')}회의 다시 보기</button>
          <button type="button" class="btn primary" id="toResult">결과 보기 ${icon('arrowRight')}</button>
        </div>
      </section>`);

    const phone = new Phone($('#phone'), {
      getPlan: () => state.plan,
      getFixes: () => (mode === 'after' ? state.answers : {}),
    });
    const setMode = (m) => {
      mode = m;
      document.querySelectorAll('.seg button').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
      phone.render();
    };
    const progress = () => {
      const n = qs.filter((q) => state.answers[q.id]).length;
      $('#progress').textContent = `${n} / ${qs.length}개 반영됨 · 휴대폰을 눌러 확인해 보세요`;
    };
    progress();

    document.querySelector('.seg').addEventListener('click', (e) => {
      const b = e.target.closest('[data-mode]');
      if (b) setMode(b.dataset.mode);
    });
    const qBox = $('#questions');
    qBox.addEventListener('change', (e) => {
      if (e.target.type !== 'radio') return;
      const id = e.target.name.replace('ans-', '');
      const q = findQ(id);
      state.answers[id] = e.target.value;
      e.target.closest('.q-card').classList.add('done');
      $('#reviseError').hidden = true;
      mode = 'after';
      setMode('after');
      if (id === 'q1') phone.show({ screen: 0 });
      if (id === 'q2') phone.show({ screen: 1, day: state.answers.q2 === 'hide' ? 'd1' : 'd3' });
      if (id === 'q3') phone.show({ screen: 2 });
      const hint = { q1: "'오늘의 공연 보기'를 눌러 보세요", q2: '날짜 탭을 눌러 보세요', q3: '부스를 눌러 보세요' }[id];
      phone.toast(`반영했어요: ${findOpt(q, e.target.value).label}. ${hint}!`);
      progress();
      if (window.matchMedia('(max-width: 900px)').matches) $('#phone').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    qBox.addEventListener('input', (e) => {
      if (e.target.tagName === 'TEXTAREA') state.memos[e.target.name.replace('memo-', '')] = e.target.value.trim();
    });
    $('#toResult').addEventListener('click', () => {
      const left = qs.filter((q) => !state.answers[q.id]);
      if (left.length) {
        const err = $('#reviseError');
        err.hidden = false;
        err.textContent = `빈틈 ${left.map((q) => q.gapNo).join(', ')}번에 아직 답하지 않았어요.`;
        $(`[data-q="${left[0].id}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      goTo(6);
    });
  }

  /* ---------- 7. 결과 ---------- */
  function revisedRows() {
    const p = state.plan;
    const n = screenNames(p);
    const ans = (id) => findOpt(findQ(id), state.answers[id]);
    const memo = (id) => (state.memos[id] ? ` (덧붙임: ${state.memos[id]})` : '');
    return [
      { label: '서비스 목적', before: p.purpose },
      { label: '대상 사용자', before: p.target },
      { label: '주요 화면', before: p.screens.map((s, i) => `${n[i]}${s.desc ? ` – ${s.desc}` : ''}`).join(' / ') },
      { label: `${n[0]} › '오늘의 공연 보기'`, before: p.actions.home, after: fill(ans('q1').planText) + memo('q1') },
      { label: `${n[1]} › 공연 카드`, before: p.actions.schedule },
      { label: `${n[1]} › 공연이 없는 날`, before: '(기획서에 없음)', after: fill(ans('q2').planText) + memo('q2') },
      { label: `${n[2]} › 부스 표시`, before: p.actions.map, after: fill(ans('q3').planText) + memo('q3') },
    ];
  }

  function planAsText() {
    const lines = ['[눌러보는 기획서] 대학생용 축제 앱 기획서', ''];
    revisedRows().forEach((r) => lines.push(`■ ${r.label}`, `  ${r.after || r.before}`, ''));
    lines.push('■ AI 팀 회의에서 찾은 빈틈');
    MEET().questions.forEach((q) => lines.push(`  ${q.gapNo}. ${q.gapTitle} – ${q.short}`));
    return lines.join('\n');
  }

  function renderResult() {
    const qs = MEET().questions;
    const clear = homeResolved();
    view(`
      <section class="screen result">
        <header class="card result-hero">
          
          <div>
            <span class="eyebrow">STEP 6 · 결과</span>
            <h2>첫 기획서를 완성했어요!</h2>
            <p><b>빈틈 3개</b>를 찾아 고쳤어요. 실제 기획자도 이렇게 팀과 기획서를 다듬어요.</p>
          </div>
          <dl class="hero-stats">
            <div><dt>발견한 빈틈</dt><dd>${qs.length}</dd></div>
            <div><dt>고친 기획</dt><dd>${Object.keys(state.answers).length}</dd></div>
            <div><dt>기획한 화면</dt><dd>${state.plan.screens.length}</dd></div>
          </dl>
        </header>

        <h3 class="sec-title">수정 전후 비교</h3>
        <p class="muted">두 앱을 똑같이 눌러 보며 무엇이 달라졌는지 확인해 보세요.</p>
        <div class="compare">
          <figure><figcaption class="tag before">수정 전</figcaption><div id="phoneBefore"></div></figure>
          <div class="compare-arrow" aria-hidden="true">${icon('arrowRight')}</div>
          <figure><figcaption class="tag after">수정 후</figcaption><div id="phoneAfter"></div></figure>
        </div>

        <h3 class="sec-title">발견한 빈틈 3개</h3>
        <div class="gaps">
          ${qs
            .map((q) => {
              const o = findOpt(q, state.answers[q.id]);
              return `<article class="card gap">
                <div class="gap-no">${q.gapNo}</div>
                <h4>${esc(q.gapTitle)}</h4>
                <p class="gap-q">“${esc(q.short)}”</p>
                <div class="ba"><span class="tag before">전</span><p>${esc(q.id === 'q1' && clear ? q.beforeIfClear : q.before)}</p></div>
                <div class="ba"><span class="tag after">후</span><p>${esc(o.label)}${state.memos[q.id] ? `<br><small>덧붙임: ${esc(state.memos[q.id])}</small>` : ''}</p></div>
                <p class="lesson"><span>기억할 점</span>${esc(q.lesson)}</p>
              </article>`;
            })
            .join('')}
        </div>

        <h3 class="sec-title">달라진 기획서</h3>
        <div class="card doc">
          ${revisedRows()
            .map(
              (r) => `<div class="doc-row ${r.after ? 'changed' : ''}">
                <div class="doc-label">${esc(r.label)}${r.after ? '<span class="badge">수정됨</span>' : ''}</div>
                <div class="doc-val">${r.after ? `<del>${esc(r.before)}</del><ins>${esc(r.after)}</ins>` : esc(r.before)}</div>
              </div>`
            )
            .join('')}
        </div>

        <div class="card next"><b>다음에 더 살펴볼 곳</b><p>${esc(fill(D.result.nextLook))}</p></div>

        <div class="form-actions">
          <button type="button" class="btn ghost" data-go="5">${icon('arrowLeft')}답 바꿔 보기</button>
          <div class="right">
            <button type="button" class="btn soft" id="copyPlan">기획서 복사</button>
            <button type="button" class="btn primary" id="restart">처음부터 다시</button>
          </div>
        </div>
      </section>`);

    new Phone($('#phoneBefore'), { getPlan: () => state.plan, getFixes: () => ({}) });
    new Phone($('#phoneAfter'), { getPlan: () => state.plan, getFixes: () => state.answers });

    $('#copyPlan').addEventListener('click', async (e) => {
      const text = planAsText();
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { ok = document.execCommand('copy'); } catch { ok = false; }
        ta.remove();
      }
      e.target.textContent = ok ? '복사했어요' : '복사하지 못했어요';
      setTimeout(() => (e.target.textContent = '기획서 복사'), 2000);
    });
    $('#restart').addEventListener('click', () => {
      if (!confirm('지금까지 쓴 기획서가 지워져요. 처음부터 다시 할까요?')) return;
      Object.assign(state, { maxStep: 0, plan: blankPlan(), answers: {}, memos: {}, log: [], missions: {}, seenRequest: false, seenMeeting: false, aiActions: null, aiActionsNote: '', meeting: null, meetingNote: '', meetingPromise: null });
      goTo(0);
    });
  }

  /* ---------- 공통: data-go 버튼으로 화면 이동 ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (!b || b.disabled) return;
    goTo(+b.dataset.go);
  });

  AI.check(); // AI 서버 연결 상태 확인 (화면 아래쪽 표시)

  // 확인용 바로가기: 주소 끝에 #step=3 처럼 붙이면 예시 답이 채워진 채로 그 단계가 열려요
  const jump = /step=(\d)/.exec(location.hash);
  if (jump && +jump[1] >= 1 && +jump[1] <= 6) {
    state.plan = examplePlan();
    D.meeting.questions.forEach((q) => (state.answers[q.id] = q.options[0].id));
    Object.assign(state, { maxStep: +jump[1], seenRequest: true, seenMeeting: true });
    goTo(+jump[1]);
  } else {
    goTo(0);
  }
})();
