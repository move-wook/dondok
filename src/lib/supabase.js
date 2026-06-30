import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // 개발 중 .env 누락을 빠르게 알아채기 위함
  console.warn('[돈독] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 설정되지 않았습니다 (.env 확인)');
}

export const supabase = createClient(url, anon);
