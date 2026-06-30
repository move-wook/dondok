// 돈독 — 회원 탈퇴 Edge Function (service_role)
// 배포: npx supabase functions deploy delete_account
// (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY 자동 주입)
//
// 옵션 B: 팀 리더는 먼저 팀을 삭제해야 탈퇴 가능.

import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ ok: false, reason: "unauthorized" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 호출자 식별
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ ok: false, reason: "unauthorized" }, 401);
    const uid = user.id;

    const admin = createClient(url, service);

    // 옵션 B: 리더면 차단
    const { data: ledTeam } = await admin.from("team").select("team_id").eq("leader_id", uid).maybeSingle();
    if (ledTeam) return json({ ok: false, reason: "leader" }, 200);

    // 내 인증 + 그에 달린 리액션/댓글
    const { data: myCerts } = await admin.from("certification").select("cert_id, image_path").eq("user_id", uid);
    const certIds = (myCerts ?? []).map((c) => c.cert_id);
    if (certIds.length) {
      await admin.from("cert_reaction").delete().in("cert_id", certIds);
      await admin.from("cert_comment").delete().in("cert_id", certIds);
    }
    // 내가 남긴 리액션/댓글
    await admin.from("cert_reaction").delete().eq("user_id", uid);
    await admin.from("cert_comment").delete().eq("user_id", uid);
    // 내 인증/인바디
    await admin.from("certification").delete().eq("user_id", uid);
    await admin.from("inbody_history").delete().eq("user_id", uid);

    // 내 사진 정리 (best-effort)
    try {
      for (const sub of ["cert", "inbody"]) {
        const { data: files } = await admin.storage.from("cert-images").list(`${uid}/${sub}`, { limit: 1000 });
        const paths = (files ?? []).map((f) => `${uid}/${sub}/${f.name}`);
        if (paths.length) await admin.storage.from("cert-images").remove(paths);
      }
    } catch { /* 사진 정리는 best-effort */ }

    // 프로필 + auth 계정 삭제
    await admin.from("profile").delete().eq("id", uid);
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) return json({ ok: false, reason: delErr.message }, 500);

    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, reason: String(e) }, 500);
  }
});
