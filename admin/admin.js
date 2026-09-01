const api = window.intoLife;
const $ = (id) => document.getElementById(id);
let users = [];
let missions = [];

const show = (id, visible = true) => $(id).classList.toggle('hidden', !visible);
const escapeHtml = (value = '') => String(value).replace(/[&<>"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
const localDate = (value) => value ? new Intl.DateTimeFormat('ja-JP').format(new Date(`${value}T00:00:00`)) : '—';
const localDateTimeInput = (value) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';

function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('show');
  setTimeout(() => $('toast').classList.remove('show'), 2200);
}

async function init() {
  if (!api.configured) { show('setup'); return; }
  const { data: { session } } = await api.supabase.auth.getSession();
  if (!session) { show('login'); return; }
  await enterDashboard(session.user);
  api.supabase.auth.onAuthStateChange((_event, nextSession) => {
    if (!nextSession) location.reload();
  });
}

async function enterDashboard(user) {
  // Use the same SECURITY DEFINER function as the RLS policies. Reading the
  // RLS-protected profiles table here made a failed query indistinguishable
  // from a genuine non-admin account.
  const { data: isAdmin, error: accessError } = await api.supabase.rpc('is_admin');
  if (accessError) {
    $('access-title').textContent = '管理者権限を確認できません';
    $('access-message').textContent = `Supabaseの権限確認に失敗しました: ${accessError.message}`;
    show('forbidden');
    show('sign-out');
    return;
  }
  if (isAdmin !== true) {
    $('access-title').textContent = '管理者権限がありません';
    $('access-message').innerHTML = '現在ログイン中のユーザーに対応する <code>profiles.role</code> を <code>admin</code> に設定してください。';
    show('forbidden');
    show('sign-out');
    return;
  }
  $('admin-email').textContent = user.email || '';
  show('sign-out');
  show('dashboard');
  await loadData();
}

async function loadData() {
  const [userResult, missionResult] = await Promise.all([
    api.supabase.from('profiles').select('id,email,display_name,role,created_at').order('created_at', { ascending: false }),
    api.supabase.from('missions').select('*,profiles(email,display_name)').order('mission_date', { ascending: false })
  ]);
  if (userResult.error || missionResult.error) {
    toast(userResult.error?.message || missionResult.error?.message || '読み込みに失敗しました');
    return;
  }
  users = userResult.data || [];
  missions = missionResult.data || [];
  renderUsers();
  renderMissions();
  $('user-id').innerHTML = '<option value="" disabled>選択してください</option>' + users.map((u) => {
    const name = escapeHtml(u.display_name || u.email || u.id);
    const email = escapeHtml(u.email || 'メール未設定');
    const role = u.role === 'admin' ? '管理者' : 'ユーザー';
    return `<option value="${u.id}">${name}（${email}・${role}）</option>`;
  }).join('');
}

function renderMissions() {
  const search = $('mission-search').value.trim().toLowerCase();
  const status = $('status-filter').value;
  const filtered = missions.filter((m) => {
    const haystack = `${m.title} ${m.profiles?.display_name || ''} ${m.profiles?.email || ''}`.toLowerCase();
    return (!search || haystack.includes(search)) && (!status || m.status === status);
  });
  $('missions-body').innerHTML = filtered.map((m) => `<tr>
    <td><div class="mission-name">${escapeHtml(m.title)}</div><div class="sub">${escapeHtml(m.meeting_place || '集合場所未設定')}</div></td>
    <td><div class="user-name">${escapeHtml(m.profiles?.display_name || '—')}</div><div class="sub">${escapeHtml(m.profiles?.email || '')}</div></td>
    <td>${localDate(m.mission_date)}</td>
    <td><select class="inline-status" data-id="${m.id}" aria-label="status"><option${m.status==='locked'?' selected':''}>locked</option><option${m.status==='hint'?' selected':''}>hint</option><option${m.status==='location_revealed'?' selected':''}>location_revealed</option><option${m.status==='revealed'?' selected':''}>revealed</option><option${m.status==='completed'?' selected':''}>completed</option></select></td>
    <td><input class="switch publish-toggle" type="checkbox" data-id="${m.id}" ${m.is_published ? 'checked' : ''} aria-label="公開状態"></td>
    <td><button class="edit" data-edit="${m.id}">編集</button></td>
  </tr>`).join('');
  show('missions-empty', filtered.length === 0);
  document.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => openMission(button.dataset.edit)));
  document.querySelectorAll('.inline-status').forEach((select) => select.addEventListener('change', () => quickUpdate(select.dataset.id, { status: select.value })));
  document.querySelectorAll('.publish-toggle').forEach((input) => input.addEventListener('change', () => quickUpdate(input.dataset.id, { is_published: input.checked })));
}

function renderUsers() {
  $('users-body').innerHTML = users.map((u) => {
    const count = missions.filter((m) => m.user_id === u.id).length;
    return `<tr><td><div class="user-name">${escapeHtml(u.display_name || '名前未設定')}</div><div class="sub">${escapeHtml(u.email || '')}</div></td><td><span class="status-pill">${escapeHtml(u.role)}</span></td><td>${new Intl.DateTimeFormat('ja-JP').format(new Date(u.created_at))}</td><td>${count}</td></tr>`;
  }).join('');
}

async function quickUpdate(id, values) {
  const { error } = await api.supabase.from('missions').update(values).eq('id', id);
  if (error) { toast(error.message); await loadData(); return; }
  Object.assign(missions.find((m) => m.id === id), values);
  toast(values.is_published === true ? '公開しました' : values.is_published === false ? '非公開にしました' : 'statusを更新しました');
}

function openMission(id = '') {
  const mission = missions.find((m) => m.id === id);
  $('mission-form').reset();
  $('mission-id').value = mission?.id || '';
  $('dialog-title').textContent = mission ? 'ミッション編集' : '新規ミッション';
  $('user-id').value = mission?.user_id || '';
  $('title').value = mission?.title || '';
  $('mission-date').value = mission?.mission_date || '';
  $('meeting-time').value = mission?.meeting_time?.slice(0, 5) || '';
  $('meeting-place').value = mission?.meeting_place || '';
  $('hint').value = mission?.hint || '';
  $('dress-code').value = mission?.dress_code || '';
  $('budget').value = mission?.budget ?? '';
  $('status').value = mission?.status || 'locked';
  $('reveal-at').value = localDateTimeInput(mission?.reveal_at);
  $('is-published').checked = mission?.is_published || false;
  $('full-description').value = mission?.full_description || '';
  $('form-error').textContent = '';
  show('delete-mission', Boolean(mission));
  $('mission-dialog').showModal();
}

async function saveMission(event) {
  event.preventDefault();
  const id = $('mission-id').value;
  const payload = {
    user_id: $('user-id').value,
    title: $('title').value.trim(),
    mission_date: $('mission-date').value,
    meeting_time: $('meeting-time').value || null,
    meeting_place: $('meeting-place').value.trim() || null,
    hint: $('hint').value.trim() || null,
    dress_code: $('dress-code').value.trim() || null,
    budget: $('budget').value === '' ? null : Number($('budget').value),
    full_description: $('full-description').value.trim() || null,
    status: $('status').value,
    reveal_at: $('reveal-at').value ? new Date($('reveal-at').value).toISOString() : null,
    is_published: $('is-published').checked
  };
  const query = id ? api.supabase.from('missions').update(payload).eq('id', id) : api.supabase.from('missions').insert(payload);
  const { error } = await query;
  if (error) { $('form-error').textContent = error.message; return; }
  $('mission-dialog').close();
  toast(id ? 'ミッションを更新しました' : 'ミッションを作成しました');
  await loadData();
}

async function deleteMission() {
  const id = $('mission-id').value;
  if (!id || !confirm('このミッションを削除しますか？この操作は取り消せません。')) return;
  const { error } = await api.supabase.from('missions').delete().eq('id', id);
  if (error) { $('form-error').textContent = error.message; return; }
  $('mission-dialog').close();
  toast('ミッションを削除しました');
  await loadData();
}

$('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('login-error').textContent = '';
  const { error } = await api.supabase.auth.signInWithPassword({ email: $('email').value, password: $('password').value });
  if (error) { $('login-error').textContent = 'ログインできませんでした。メールアドレスとパスワードを確認してください。'; return; }
  location.reload();
});
$('sign-out').addEventListener('click', () => api.supabase.auth.signOut());
document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((item) => item.classList.toggle('active', item === tab));
  show('missions-view', tab.dataset.tab === 'missions');
  show('users-view', tab.dataset.tab === 'users');
}));
$('new-mission').addEventListener('click', () => openMission());
$('mission-search').addEventListener('input', renderMissions);
$('status-filter').addEventListener('change', renderMissions);
$('mission-form').addEventListener('submit', saveMission);
$('close-dialog').addEventListener('click', () => $('mission-dialog').close());
$('cancel-dialog').addEventListener('click', () => $('mission-dialog').close());
$('delete-mission').addEventListener('click', deleteMission);

init();
