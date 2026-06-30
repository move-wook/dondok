import { supabase } from './supabase';

// 현재 활성 시즌 (status=ONGOING 중 최신 시작)
export async function getActiveSeason() {
  const { data, error } = await supabase
    .from('season')
    .select('*')
    .eq('status', 'ONGOING')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// 내 프로필 + 소속 팀 (FK 미사용 → 수동 조인)
export async function getMyProfile(userId) {
  const { data: profile, error } = await supabase
    .from('profile')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;

  if (profile.team_id) {
    const { data: team, error: tErr } = await supabase
      .from('team')
      .select('*')
      .eq('team_id', profile.team_id)
      .maybeSingle();
    if (tErr) throw tErr;
    profile.team = team ?? null;
  } else {
    profile.team = null;
  }
  return profile;
}

// 팀 랭킹 (RPC)
export async function getRanking(seasonId) {
  const { data, error } = await supabase.rpc('team_ranking', { p_season_id: seasonId });
  if (error) throw error;
  return data ?? [];
}

// 내 인바디 히스토리(시즌 내, 측정일 오름차순)
export async function getMyInbody(userId, seasonId) {
  const { data, error } = await supabase
    .from('inbody_history')
    .select('*')
    .eq('user_id', userId)
    .eq('season_id', seasonId)
    .order('measured_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// 같은 팀 멤버 목록
export async function getTeamMembers(teamId) {
  const { data, error } = await supabase.from('profile').select('id, nickname').eq('team_id', teamId);
  if (error) throw error;
  return data ?? [];
}

// Storage 서명 URL 일괄 생성 (비공개 버킷 표시용)
async function signedUrlMap(paths) {
  const valid = paths.filter(Boolean);
  if (!valid.length) return {};
  const { data } = await supabase.storage.from('cert-images').createSignedUrls(valid, 3600);
  const map = {};
  (data ?? []).forEach((d) => { if (d.signedUrl) map[d.path] = d.signedUrl; });
  return map;
}

// 인증 등록 (사진 경로/메모/식사시간) + 보너스 판정 호출
export async function addCertification({ userId, seasonId, certType, mealTime, imagePath, memo, certDate }) {
  const { error } = await supabase.from('certification').insert({
    user_id: userId,
    season_id: seasonId,
    cert_type: certType,
    meal_time: certType === 'MEAL' ? mealTime : null,
    image_path: imagePath ?? null,
    memo: memo || null,
    cert_date: certDate,
  });
  if (error) throw error;
  // 전원 풀인증이면 보너스 1행 적재(중복은 RPC 내부에서 무시)
  await supabase.rpc('award_team_bonus', { p_season_id: seasonId, p_date: certDate });
}

// 우리 팀 피드 (FK 미사용 → 수동 조인 + 서명 URL)
export async function getTeamFeed(seasonId) {
  const { data: certs, error } = await supabase
    .from('certification')
    .select('*')
    .eq('season_id', seasonId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  if (!certs.length) return [];

  const certIds = certs.map((c) => c.cert_id);
  const [{ data: profiles }, { data: reactions }, { data: comments }, urlMap] = await Promise.all([
    supabase.from('profile').select('id, nickname'), // 전체(소규모) — 작성자+반응자+댓글러 모두 커버
    supabase.from('cert_reaction').select('cert_id, emoji, user_id').in('cert_id', certIds),
    supabase.from('cert_comment').select('comment_id, cert_id, user_id, content, created_at').in('cert_id', certIds).order('created_at', { ascending: true }),
    signedUrlMap(certs.map((c) => c.image_path)),
  ]);
  const nameById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.nickname]));
  const reByCert = {};
  (reactions ?? []).forEach((r) => {
    (reByCert[r.cert_id] ??= []).push({ ...r, nickname: nameById[r.user_id] ?? '회원' });
  });
  const coByCert = {};
  (comments ?? []).forEach((c) => {
    (coByCert[c.cert_id] ??= []).push({ ...c, nickname: nameById[c.user_id] ?? '회원' });
  });

  return certs.map((c) => ({
    ...c,
    nickname: nameById[c.user_id] ?? '회원',
    imageUrl: c.image_path ? urlMap[c.image_path] ?? null : null,
    reactions: reByCert[c.cert_id] ?? [],
    comments: coByCert[c.cert_id] ?? [],
  }));
}

// 댓글 작성 / 삭제
export async function addComment(certId, userId, content) {
  const { error } = await supabase.from('cert_comment').insert({ cert_id: certId, user_id: userId, content });
  if (error) throw error;
}
export async function deleteComment(commentId) {
  const { error } = await supabase.from('cert_comment').delete().eq('comment_id', commentId);
  if (error) throw error;
}

// 리액션 토글 (있으면 삭제, 없으면 추가)
export async function toggleReaction(certId, userId, emoji) {
  const { data: existing, error } = await supabase
    .from('cert_reaction')
    .select('reaction_id')
    .eq('cert_id', certId).eq('user_id', userId).eq('emoji', emoji)
    .maybeSingle();
  if (error) throw error;
  if (existing) {
    await supabase.from('cert_reaction').delete().eq('reaction_id', existing.reaction_id);
    return false;
  }
  await supabase.from('cert_reaction').insert({ cert_id: certId, user_id: userId, emoji });
  return true;
}

// 특정 사용자의 월별 인증(달력용) + 서명 URL
export async function getMonthCerts(userId, seasonId, fromDate, toDate) {
  const { data, error } = await supabase
    .from('certification')
    .select('cert_id, cert_date, cert_type, meal_time, image_path')
    .eq('user_id', userId).eq('season_id', seasonId)
    .gte('cert_date', fromDate).lte('cert_date', toDate)
    .order('cert_id', { ascending: false }); // 최신 인증이 앞 → 달력 썸네일은 그날 "최근" 사진
  if (error) throw error;
  const urlMap = await signedUrlMap((data ?? []).map((c) => c.image_path));
  return (data ?? []).map((c) => ({ ...c, imageUrl: c.image_path ? urlMap[c.image_path] ?? null : null }));
}

// 팀 스트릭 + 주간 공동목표 (RPC)
export async function getTeamProgress(teamId, seasonId) {
  const [streakRes, weekRes] = await Promise.all([
    supabase.rpc('team_streak', { p_team_id: teamId, p_season_id: seasonId }),
    supabase.rpc('team_week_progress', { p_team_id: teamId, p_season_id: seasonId }),
  ]);
  if (streakRes.error) throw streakRes.error;
  if (weekRes.error) throw weekRes.error;
  // team_week_progress 는 단일 행(done,goal) 반환
  const week = Array.isArray(weekRes.data) ? weekRes.data[0] : weekRes.data;
  return { streak: streakRes.data ?? 0, week: week ?? { done: 0, goal: 0 } };
}
