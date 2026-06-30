// 돈독 — 인바디 사진 OCR Edge Function (Deno / Supabase) — Google Gemini(무료 티어)
// 배포: npx supabase functions deploy extract_inbody
// 시크릿: npx supabase secrets set GEMINI_API_KEY=...   (aistudio.google.com 무료 키)
//   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 런타임 자동 주입)
//
// 입력:  { "path": "{user_id}/inbody/xxx.jpg" }  (cert-images 버킷 경로)
// 출력:  { weightKg, skeletalMuscleKg, bodyFatKg, bodyFatPercent, confidence }

import { createClient } from "jsr:@supabase/supabase-js@2";
import { encodeBase64 } from "jsr:@std/encoding/base64";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

// 무료 티어 Flash 모델. 필요시 "gemini-2.0-flash" 로 교체 가능.
const MODEL = "gemini-2.5-flash";

const PROMPT =
  "이 InBody(인바디) 결과지 사진에서 다음을 읽어 JSON으로만 답해줘. " +
  "키는 정확히: weightKg(체중,kg), skeletalMuscleKg(골격근량,kg), bodyFatKg(체지방량,kg), " +
  "bodyFatPercent(체지방률,%), confidence(\"high\" 또는 \"low\"). " +
  "선명히 읽히면 confidence=\"high\". 흐리거나 인바디 결과지가 아니면 수치는 0, confidence=\"low\". " +
  "숫자는 number 타입으로.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { path } = await req.json();
    if (!path) return json({ error: "path required", confidence: "low" }, 400);

    // 1) Storage 에서 인바디 사진 다운로드 (service role)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: file, error } = await supabase.storage.from("cert-images").download(path);
    if (error || !file) return json({ error: "download failed", confidence: "low" }, 400);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const base64 = encodeBase64(bytes);
    const mimeType = file.type || "image/jpeg";

    // 2) Gemini 비전 호출 (JSON 강제)
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return json({ error: "GEMINI_API_KEY missing", confidence: "low" }, 200);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
    const reqBody = {
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: PROMPT },
          ],
        },
      ],
      generationConfig: { responseMimeType: "application/json", temperature: 0 },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    });
    if (!res.ok) {
      const t = await res.text();
      return json({ error: "gemini error: " + t, confidence: "low" }, 200);
    }
    const out = await res.json();
    const text = out?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    return json(JSON.parse(text), 200);
  } catch (e) {
    // 실패 시에도 200 + confidence:low → 프론트는 수기 입력으로 폴백
    return json({ error: String(e), confidence: "low" }, 200);
  }
});
