
window.SUPABASE_URL = "https://dqaavvbxflqguvdkdjyy.supabase.co";

window.SUPABASE_ANON_KEY = "sb_publishable_-DBOan94gyiBgtKYBP20LQ_xi2w9yEU";

window.sb = null;

try {
  if (!window.supabase?.createClient) {
    throw new Error("Supabase CDN tidak berhasil dimuat.");
  }

  if (
    !window.SUPABASE_URL.startsWith("https://") ||
    !window.SUPABASE_ANON_KEY.startsWith("sb_publishable_")
  ) {
    throw new Error("URL atau publishable key tidak valid.");
  }

  window.sb = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );

  console.log("[Supabase] Berhasil terhubung.");
} catch (error) {
  console.error("[Supabase] Gagal:", error);
}
