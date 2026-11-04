window.SUPABASE_URL = "https://dqaavvbxflqguvdkdjyy.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_-DBOan94gyiBgtKYBP20LQ_xi2w9yEU";
window.sb = null;
window.addEventListener("DOMContentLoaded", () => {
  const ready = window.SUPABASE_URL.startsWith("https://") && !window.SUPABASE_URL.includes("YOUR-PROJECT") && window.SUPABASE_ANON_KEY.length > 20 && !window.SUPABASE_ANON_KEY.includes("YOUR_");
  if (ready && window.supabase?.createClient) window.sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
});
