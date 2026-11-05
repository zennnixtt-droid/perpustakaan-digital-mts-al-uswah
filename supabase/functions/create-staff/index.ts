
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  const out = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        ...cors,
        "Content-Type": "application/json",
      },
    });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "POST") {
    return out({ error: "Method tidak diizinkan." }, 405);
  }

  try {
    const auth = req.headers.get("Authorization");

    if (!auth) {
      return out({ error: "Token login tidak ditemukan." }, 401);
    }

    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !anon || !service) {
      return out({ error: "Konfigurasi server belum lengkap." }, 500);
    }

    // Verifikasi sesi pemanggil
    const caller = createClient(url, anon, {
      global: {
        headers: { Authorization: auth },
      },
    });

    const { data: { user }, error: authError } =
      await caller.auth.getUser();

    if (authError || !user) {
      return out({ error: "Sesi tidak valid." }, 401);
    }

    // Client admin untuk operasi database
    const admin = createClient(url, service);

    // Pastikan pemanggil adalah admin
    const { data: profile, error: profileError } =
      await admin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError || profile?.role !== "admin") {
      return out({
        error: "Hanya admin yang dapat membuat akun petugas.",
      }, 403);
    }

    // Baca dan validasi data
    const body = await req.json();

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const full_name = String(body.full_name ?? "").trim();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 8 ||
      !full_name
    ) {
      return out({
        error: "Nama, email valid, dan password minimal 8 karakter wajib diisi.",
      }, 400);
    }

    // Buat akun Auth
    const { data, error } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

    if (error || !data.user) {
      return out({
        error: error?.message ?? "Gagal membuat akun.",
      }, 400);
    }

    const newUserId = data.user.id;

    // Simpan profil petugas
    const { error: insertError } =
      await admin
        .from("profiles")
        .upsert(
          {
            id: newUserId,
            full_name,
            role: "petugas",
          },
          { onConflict: "id" }
        );

    // Bersihkan akun Auth jika profil gagal disimpan
    if (insertError) {
      await admin.auth.admin.deleteUser(newUserId);

      return out({
        error: "Gagal menyimpan profil petugas: " +
          insertError.message,
      }, 500);
    }

    return out({
      success: true,
      message: "Akun petugas berhasil dibuat.",
      user_id: newUserId,
    });

  } catch (error) {
    return out({
      error: error instanceof Error
        ? error.message
        : "Kesalahan server.",
    }, 500);
  }
});
