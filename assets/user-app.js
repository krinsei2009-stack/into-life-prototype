(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const USERNAME_KEY = 'into-life-username';
  const LEGACY_NAME_KEY = 'into-life-display-name';
  const GUEST_ID_KEY = 'into-life-guest-id';
  const PREFERENCES_KEY = 'into-life-preferences-v1';
  const SELECTED_MISSION_KEY = 'into-life-selected-mission-v2';
  const STATUS_RANK = { locked: 0, hint: 1, location_revealed: 2, revealed: 3, completed: 4 };
  const STATUS_COPY = {
    locked: { label: 'MISSION RECEIVED', message: 'ミッションを受信しました' },
    hint: { label: 'CLUE UNLOCKED', message: '新しい情報が届きました' },
    location_revealed: { label: 'LOCATION UNLOCKED', message: '集合場所を確認できます' },
    revealed: { label: 'MISSION REVEALED', message: 'ミッションを開封できます' },
    completed: { label: 'MISSION COMPLETE', message: 'ミッション完了' }
  };
  const VALID_DEMO_STATES = Object.keys(STATUS_RANK);
  let currentUser = null;
  let missions = [];
  let selectedMissionId = null;
  let onboardingStep = 0;

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' })[char]);
  const formatDate = (value, style = 'short') => {
    if (!value) return 'TBA';
    const date = new Date(`${value}T00:00:00`);
    return style === 'short'
      ? new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(date).toUpperCase()
      : new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(date);
  };
  const formatTime = (value) => value ? value.slice(0, 5) : 'TBA';
  const formatMoment = (value) => value ? new Intl.DateTimeFormat('ja-JP', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(value)) : '公開時刻は運営から通知';
  const missionNumber = (mission) => String(Number(String(mission.id).match(/\d+/)?.[0]) || 1).padStart(3, '0');
  const canHint = (status) => STATUS_RANK[status] >= STATUS_RANK.hint;
  const canLocate = (status) => STATUS_RANK[status] >= STATUS_RANK.location_revealed;
  const canReveal = (status) => STATUS_RANK[status] >= STATUS_RANK.revealed;

  function showToast(message) {
    $('toast').textContent = message;
    $('toast').classList.add('show');
    setTimeout(() => $('toast').classList.remove('show'), 2400);
  }

  function playSplash() {
    const splash = $('splash');
    if (sessionStorage.getItem('into-life-splash-seen')) {
      splash.classList.add('done');
      return Promise.resolve();
    }
    sessionStorage.setItem('into-life-splash-seen', '1');
    return new Promise((resolve) => setTimeout(() => { splash.classList.add('done'); resolve(); }, 1800));
  }

  function guestIdentity(name) {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      id = `guest-${crypto.randomUUID?.() || Date.now().toString(36)}`;
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    return { id, name, isGuest: true };
  }

  function dateFromOffset(offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function shiftedIso(date, time, hours) {
    const moment = new Date(`${date}T${time || '12:00:00'}`);
    moment.setHours(moment.getHours() + hours);
    return moment.toISOString();
  }

  function endTime(time, minutes) {
    const [hours, mins] = (time || '12:00:00').split(':').map(Number);
    const total = hours * 60 + mins + minutes;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  function requestedDemoStatus() {
    const requested = new URLSearchParams(location.search).get('mission_state');
    return VALID_DEMO_STATES.includes(requested) ? requested : 'locked';
  }

  function createAssignedMission() {
    const preferences = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}');
    const candidates = (window.INTO_LIFE_EVENT_CATALOG || []).map((event) => {
      const missionDate = dateFromOffset(event.offset);
      const ordinal = Number(event.id.match(/\d+/)?.[0]) || 1;
      const duration = event.duration_minutes || (ordinal % 4 === 0 ? 360 : ordinal % 3 === 0 ? 120 : event.mood === 'active' ? 180 : 150);
      const outdoor = event.stimulus === 'place';
      const foodProvided = ['EV-002', 'EV-012', 'EV-014'].includes(event.id);
      return {
        ...event,
        local_event: true,
        mission_date: missionDate,
        meeting_time: event.time,
        meeting_place: event.location,
        dress_code: event.notice,
        full_description: event.description,
        status: requestedDemoStatus(),
        is_published: true,
        created_at: shiftedIso(missionDate, event.time, -72),
        clue_reveal_at: shiftedIso(missionDate, event.time, -48),
        preparation_reveal_at: shiftedIso(missionDate, event.time, -36),
        location_reveal_at: shiftedIso(missionDate, event.time, -24),
        mission_reveal_at: shiftedIso(missionDate, event.time, 0),
        area: '名古屋市内',
        travel_area: '名古屋駅から30分圏内',
        nearest_station: '架空中央駅',
        duration_minutes: duration,
        end_time: endTime(event.time, duration),
        physical_level: event.mood === 'active' ? 'MODERATE' : 'LIGHT',
        environment: outdoor ? '屋外を含む' : '屋内中心',
        packing_list: 'スマートフォン、飲み物',
        safe_clue: event.notice,
        food: foodProvided ? '飲食提供あり（アレルギーは事前申告）' : '食事提供なし',
        allergy: foodProvided ? '食物アレルギーがある場合は前日までに連絡' : '飲食提供なし／特記事項なし',
        age_condition: '18歳以上',
        cancellation: '前日18:00まで無料。以降は参加費の100%',
        emergency_contact: 'アプリ内サポート（MVPデモ）',
        match_score: (event.mood === preferences.mood ? 2 : 0)
          + (event.stimulus === preferences.stimulus ? 4 : 0)
          + (event.unknown === preferences.unknown ? 3 : 0)
      };
    }).map((mission) => {
      const socialScore = preferences.social === 'social'
        ? (mission.stimulus === 'people' ? 3 : 0)
        : preferences.social === 'small'
          ? (mission.unknown === 'mid' ? 2 : 0)
          : (mission.stimulus !== 'people' ? 3 : 0);
      const durationScore = preferences.duration === 'short'
        ? (mission.duration_minutes <= 120 ? 3 : 0)
        : preferences.duration === 'full'
          ? (mission.duration_minutes >= 300 ? 3 : 0)
          : (mission.duration_minutes > 120 && mission.duration_minutes < 300 ? 3 : 0);
      return { ...mission, match_score: mission.match_score + socialScore + durationScore };
    }).sort((a, b) => b.match_score - a.match_score || a.offset - b.offset);
    const varied = [];
    for (const candidate of candidates) {
      if (!varied.some((mission) => mission.stimulus === candidate.stimulus)) varied.push(candidate);
      if (varied.length === 3) break;
    }
    return varied;
  }

  function stageKey(mission, stage = mission.status) {
    return `into-life-opened-${mission.id}-${stage}`;
  }

  function stageOpened(mission, stage = mission.status) {
    if (stage === 'locked' || mission.status === 'completed') return true;
    if (STATUS_RANK[mission.status] > STATUS_RANK[stage]) return true;
    return sessionStorage.getItem(stageKey(mission, stage)) === '1';
  }

  async function init() {
    const splashDone = playSplash();
    setupEvents();
    await splashDone;
    const currentUrl = new URL(location.href);
    if (currentUrl.searchParams.get('restart_survey') === '1') {
      localStorage.removeItem(PREFERENCES_KEY);
      localStorage.removeItem(SELECTED_MISSION_KEY);
      currentUrl.searchParams.delete('restart_survey');
      history.replaceState(null, '', currentUrl);
    }
    const savedName = (localStorage.getItem(USERNAME_KEY) || localStorage.getItem(LEGACY_NAME_KEY))?.trim();
    const hasPreferences = Boolean(localStorage.getItem(PREFERENCES_KEY));
    if (!hasPreferences) showOnboarding(0);
    else if (savedName) {
      localStorage.setItem(USERNAME_KEY, savedName);
      await enterApp(guestIdentity(savedName));
    } else showOnboarding(3);
  }

  function showOnboarding(step = 0) {
    $('app').classList.add('hidden');
    $('onboarding').classList.remove('hidden');
    goOnboarding(step);
  }

  function goOnboarding(step) {
    onboardingStep = Math.max(0, Math.min(3, step));
    document.querySelectorAll('.onboard-screen').forEach((screen) => screen.classList.toggle('active', Number(screen.dataset.onboard) === onboardingStep));
    window.scrollTo(0, 0);
  }

  function diagnose() {
    const selected = (group) => document.querySelector(`[data-choice="${group}"] .selected`)?.dataset.value;
    const mood = selected('mood'); const stimulus = selected('stimulus'); const unknown = selected('unknown');
    const social = selected('social'); const duration = selected('duration');
    let result = { code: 'LIGHT / UNKNOWN', name: '静かな探索者', description: '安心できる輪郭を残しながら、知らない場所へ踏み出す体験が合っています。' };
    if (stimulus === 'people') result = { code: 'SOCIAL / SIGNAL', name: '対話の観測者', description: '普段なら交わらない人との会話から、新しい価値観を発見する体験が合っています。' };
    if (stimulus === 'experience') result = { code: 'HANDS / UNKNOWN', name: '体験の実行者', description: '見るだけではなく、自分の手と身体を使う未知の体験が日常を変えそうです。' };
    if (unknown === 'high' || mood === 'active' && unknown === 'mid') result = { code: 'DEEP / UNKNOWN', name: '未知への越境者', description: '少し予測不能なくらいの出来事が、あなたの休日を記憶に残る物語へ変えます。' };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ mood, stimulus, unknown, social, duration }));
    localStorage.removeItem(SELECTED_MISSION_KEY);
    $('typeCode').textContent = result.code; $('typeName').textContent = result.name; $('typeDescription').textContent = result.description;
    goOnboarding(2);
  }

  async function enterApp(user) {
    currentUser = user;
    missions = createAssignedMission();
    const savedSelection = localStorage.getItem(SELECTED_MISSION_KEY);
    selectedMissionId = missions.some((mission) => mission.id === savedSelection) ? savedSelection : null;
    $('onboarding').classList.add('hidden');
    $('app').classList.remove('hidden');
    renderAll();
  }

  async function loadData(options = {}) {
    if (!currentUser) return;
    missions = createAssignedMission();
    renderAll();
    if (options.feedback) showToast('ミッション情報を更新しました');
  }

  function pickCurrentMission() {
    return missions.find((mission) => mission.status !== 'completed') || missions[0];
  }

  function renderAll() { renderHome(); }

  function renderHome() {
    if (!missions.length) {
      $('homeContent').innerHTML = '<div class="empty-state"><div><p class="signal">NEXT MISSION</p><h2>PREPARING...</h2><p>あなたの回答をもとに、次の体験を準備しています。</p></div></div>';
      return;
    }
    if (!selectedMissionId) {
      renderChoices();
      return;
    }
    const mission = missions.find((item) => item.id === selectedMissionId) || pickCurrentMission();
    selectedMissionId = mission.id;
    const opened = stageOpened(mission);
    const cta = primaryAction(mission, opened);
    const upcoming = nextUnlock(mission);
    const stateClass = detectUnlock(mission) ? ' unlocking' : '';
    $('homeContent').innerHTML = `<div class="home-shell${stateClass}">
      <div class="next-heading"><p class="signal">NEXT MISSION</p></div>
      <article class="mission-overview">
        <div class="overview-head"><span class="overview-number">MISSION ${missionNumber(mission)}</span><i class="state-dot"></i></div>
        <div class="overview-date"><strong>${formatDate(mission.mission_date)}</strong><span>${formatTime(mission.meeting_time)} START</span></div>
        <p class="essential-line">${escapeHtml(mission.area)} <i></i> 約${Math.round(mission.duration_minutes / 60 * 10) / 10}時間 <i></i> ${mission.budget ? `¥${Number(mission.budget).toLocaleString('ja-JP')}` : '追加費用なし'}</p>
        <div class="status-summary"><span>STATUS</span><strong>${STATUS_COPY[mission.status].label}</strong><p>${STATUS_COPY[mission.status].message}</p></div>
      </article>
      <div class="next-change"><span>${upcoming ? `${upcoming.label} UNLOCK` : 'INFORMATION'}</span><strong>${nextChangeCopy(mission)}</strong></div>
      <div class="primary-task"><button id="primaryMissionAction" class="main-cta" data-action="${cta.action}">${cta.label}<span>→</span></button></div>
      ${renderMissionDetail(mission)}
    </div>`;
    bindHomeEvents(mission);
  }

  function renderChoices() {
    $('homeContent').innerHTML = `<section class="choice-shell"><div class="choice-heading"><p class="signal">3 WEEKEND OPTIONS</p><h1>あなたに合う休日を、<br>3つに絞りました。</h1><p>体験の正体は、選んだ後も公開時刻まで秘密です。</p></div><div class="weekend-options">${missions.map((mission, index) => {
      return `<button class="weekend-option" data-select-mission="${mission.id}"><span>OPTION ${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(mission.category)}</strong><p>${escapeHtml(mission.notice)}</p><div><small>${formatDate(mission.mission_date)} / ${formatTime(mission.meeting_time)}</small><small>約${Math.round(mission.duration_minutes / 60 * 10) / 10}時間</small><small>${mission.budget ? `¥${Number(mission.budget).toLocaleString('ja-JP')}` : '追加費用なし'}</small></div><em>この休日を選ぶ →</em></button>`;
    }).join('')}</div></section>`;
    document.querySelectorAll('[data-select-mission]').forEach((button) => button.addEventListener('click', () => {
      selectedMissionId = button.dataset.selectMission;
      localStorage.setItem(SELECTED_MISSION_KEY, selectedMissionId);
      renderHome();
      window.scrollTo(0, 0);
    }));
  }

  function primaryAction(mission, opened) {
    if (mission.status === 'hint' && !opened) return { action: 'unlock', label: 'CLUEを見る' };
    if (mission.status === 'hint') return { action: 'detail', label: '準備情報を見る' };
    if (mission.status === 'location_revealed' && !opened) return { action: 'unlock', label: '集合場所を見る' };
    if (mission.status === 'location_revealed') return { action: 'detail', label: '集合場所を確認' };
    if (mission.status === 'revealed' && !opened) return { action: 'unlock', label: 'ミッションを開封する' };
    if (mission.status === 'revealed') return { action: 'detail', label: 'ミッション内容を見る' };
    if (mission.status === 'completed') return { action: 'detail', label: '完了したミッションを見る' };
    return { action: 'detail', label: '現在の情報を確認' };
  }

  function nextUnlock(mission) {
    if (mission.status === 'locked') return { label: 'CLUE', at: mission.clue_reveal_at };
    if (mission.status === 'hint') return stageOpened(mission) ? { label: 'LOCATION', at: mission.location_reveal_at } : { label: 'PREPARATION', at: mission.preparation_reveal_at };
    if (mission.status === 'location_revealed') return stageOpened(mission) ? { label: 'MISSION DETAILS', at: mission.mission_reveal_at } : { label: 'LOCATION', at: null };
    if (mission.status === 'revealed') return stageOpened(mission) ? { label: 'MISSION START', at: mission.mission_reveal_at } : { label: 'MISSION DETAILS', at: null };
    return null;
  }

  function nextChangeCopy(mission) {
    const next = nextUnlock(mission);
    if (!next) return 'ALL UNLOCKED';
    return next.at ? formatMoment(next.at) : 'NOW';
  }

  function renderMissionDetail(mission) {
    return `<section id="missionDetail" class="detail-section"><div class="detail-title"><p class="signal">CURRENT INFORMATION</p><h2>必要なことだけ。</h2></div>${renderKnownInfo(mission)}</section>`;
  }

  function renderKnownInfo(mission) {
    const hintVisible = canHint(mission.status) && stageOpened(mission, 'hint');
    const locationVisible = canLocate(mission.status) && stageOpened(mission, 'location_revealed');
    const missionVisible = mission.status === 'completed' || canReveal(mission.status) && stageOpened(mission, 'revealed');
    const currentPlace = locationVisible ? mission.meeting_place : hintVisible ? mission.travel_area : mission.area;
    const safetyRows = [
      ['日時', `${formatDate(mission.mission_date, 'long')} ${formatTime(mission.meeting_time)}〜${mission.end_time}頃`],
      ['場所', currentPlace],
      ['準備', mission.notice]
    ];
    const clue = hintVisible ? `<section class="unlocked-intel stage-reveal"><span>CLUE UNLOCKED</span><p>${escapeHtml(mission.safe_clue)}</p></section>` : '';
    const reveal = missionVisible ? `<section class="mission-reveal stage-reveal"><span>MISSION REVEALED</span><h2>${escapeHtml(mission.title)}</h2><p>${escapeHtml(mission.full_description || '').replace(/\n/g, '<br>')}</p></section>` : '';
    return `${clue}${reveal}<div class="known-info minimal-info">${safetyRows.map(([label, value]) => `<div class="info-row"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}</div>`;
  }

  function bindHomeEvents(mission) {
    $('primaryMissionAction')?.addEventListener('click', (event) => {
      const action = event.currentTarget.dataset.action;
      if (action === 'unlock') {
        sessionStorage.setItem(stageKey(mission), '1'); renderHome();
        showToast(`${STATUS_COPY[mission.status].label} — 新しい情報が届きました`);
        setTimeout(() => openMissionDetail(), 80); return;
      }
      openMissionDetail();
    });
  }

  function openMissionDetail() {
    const detail = $('missionDetail'); detail?.classList.add('open');
    detail?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function detectUnlock(mission) {
    const key = 'into-life-mission-statuses';
    const states = JSON.parse(localStorage.getItem(key) || '{}');
    const previous = states[mission.id]; states[mission.id] = mission.status;
    localStorage.setItem(key, JSON.stringify(states));
    return previous && STATUS_RANK[mission.status] > STATUS_RANK[previous];
  }

  function setupEvents() {
    document.querySelectorAll('[data-onboard-next]').forEach((button) => button.addEventListener('click', () => goOnboarding(onboardingStep + 1)));
    document.querySelectorAll('[data-onboard-prev]').forEach((button) => button.addEventListener('click', () => goOnboarding(onboardingStep - 1)));
    document.querySelectorAll('[data-choice]').forEach((group) => group.querySelectorAll('.choice').forEach((button) => button.addEventListener('click', () => { group.querySelectorAll('.choice').forEach((item) => item.classList.remove('selected')); button.classList.add('selected'); })));
    $('diagnoseButton').addEventListener('click', diagnose);
    $('completeDiagnosis').addEventListener('click', async () => {
      localStorage.setItem('into-life-diagnosed', '1');
      const savedName = (localStorage.getItem(USERNAME_KEY) || localStorage.getItem(LEGACY_NAME_KEY))?.trim();
      if (savedName) await enterApp(guestIdentity(savedName)); else goOnboarding(3);
    });
    $('nameForm').addEventListener('submit', async (event) => {
      event.preventDefault(); const name = $('username').value.trim(); if (!name) return;
      localStorage.setItem(USERNAME_KEY, name); localStorage.setItem('into-life-diagnosed', '1');
      await enterApp(guestIdentity(name));
    });
  }

  init();
})();
