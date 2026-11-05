window.SUPABASE_URL = "https://dqaavvbxflqguvdkdjyy.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_SBK1opnErKWQSvXxjIw34g_NcGP5yph";
window.sb = null;
window.addEventListener("DOMContentLoaded", () => {
  const ready = window.SUPABASE_URL.startsWith("https://") && !window.SUPABASE_URL.includes("https://dqaavvbxflqguvdkdjyy.supabase.co") && window.SUPABASE_ANON_KEY.length > 20 && !window.SUPABASE_ANON_KEY.includes("sb_publishable_SBK1opnErKWQSvXxjIw34g_NcGP5yph");
  if (ready && window.supabase?.createClient) window.sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
});
