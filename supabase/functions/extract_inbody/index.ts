// 돈독 — 인바디 사진 OCR Edge Function (Deno / Supabase)
// 배포: supabase functions deploy extract_inbody
// 시크릿: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 런타임에 자동 주입됨)
//
// 입력:  { "path": "{user_id}/inbody/xxx.jpg" }  (cert-images 버킷 경로)
// 출력:  { weightKg, skeletalMuscleKg, bodyFatKg, bodyFatPercent, confidence }

import { createClient } from "jsr:@supabase/supabase-js@2";
import { encodeBase64 } from "jsr:@std/encoding/base64";
import Anthropic from "npm:@anthropic-ai/sdk@0.69.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

// 추출 결과 스키마 (구조화 출력으로 JSON 강제)
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    weightKg: { type: "number" },
    skeletalMuscleKg: { type: "number" },
    bodyFatKg: { type: "number" },
    bodyFatPercent: { type: "number" },
    confidence: { type: "string", enum: ["high", "low"] },
  },
  required: ["weightKg", "skeletalMuscleKg", "bodyFatKg", "bodyFatPercent", "confidence"],
};

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
    const mediaType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp";

    // 2) 비전 모델로 수치 추출 (기본 claude-opus-4-8 — 비용 절감 시 claude-haiku-4-5 로 교체 가능)
    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
    const msg = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            {
              type: "text",
              text:
                "이 InBody(인바디) 결과지 사진에서 다음 수치를 읽어 JSON으로 반환해줘: " +
                "체중(weightKg, kg), 골격근량(skeletalMuscleKg, kg), 체지방량(bodyFatKg, kg), 체지방률(bodyFatPercent, %). " +
                "확실히 읽히면 confidence=\"high\", 흐리거나 인바디 결과지가 아니면 읽은 값을 0으로 두고 confidence=\"low\".",
            },
          ],
        },
      ],
    });

    const text = msg.content.find((b) => b.type === "text")?.text ?? "{}";
    return json(JSON.parse(text), 200);
  } catch (e) {
    // 실패 시에도 200 + confidence:low 로 반환 → 프론트는 수기 입력으로 폴백
    return json({ error: String(e), confidence: "low" }, 200);
  }
});
