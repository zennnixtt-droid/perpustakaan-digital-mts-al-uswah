
window.SUPABASE_URL = "https://dqaavvbxflqguvdkdjyy.supabase.co";

window.SUPABASE_ANON_KEY = "sb_publishable_-DBOan94gyiBgtKYBP20LQ_xi2w9yEU";

window.sb = null;

window.addEventListener("DOMContentLoaded", () => {
  if (
    window.SUPABASE_URL.startsWith("https://") &&
    window.SUPABASE_ANON_KEY.length > 20 &&
    window.supabase?.createClient
  ) {
    window.sb = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );

    console.log("Supabase berhasil diinisialisasi.");
  } else {
    console.error("Supabase gagal diinisialisasi. Periksa URL, key, dan CDN.");
  }
});
