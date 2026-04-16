import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vexwycoarshkfbpzdbns.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZleHd5Y29hcnNoa2ZicHpkYm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzI1ODUsImV4cCI6MjA5MTc0ODU4NX0.ZnIUKLs7kqpGKM25C-agcBDBNf5-ZL60OLCMfcGkacw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
