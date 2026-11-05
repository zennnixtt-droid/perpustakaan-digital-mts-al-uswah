
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("login-form");
  const message = document.getElementById("login-message");

  if (!form || !message) {
    console.error("Elemen login tidak ditemukan.");
    return;
  }

  const button = form.querySelector('button[type="submit"], button');

  // Periksa sesi yang sudah ada
  try {
    const { data: { session } } = await db().auth.getSession();

    if (session) {
      const { p } = await profile();

      if (p?.role === "admin") {
        location.replace("admin.html");
        return;
      }

      if (p?.role === "petugas") {
        location.replace("dashboard-petugas.html");
        return;
      }

      await db().auth.signOut();
    }
  } catch (error) {
    console.error("Pengecekan sesi gagal:", error);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    button.disabled = true;
    button.textContent = "Memproses...";

    try {
      const supabase = db();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      const { p } = await profile();

      if (!p || !["admin", "petugas"].includes(p.role)) {
        await supabase.auth.signOut();
        throw new Error("Role akun tidak valid. Hubungi administrator.");
      }

      msg(message, "Login berhasil. Mengalihkan halaman...");

      location.replace(
        p.role === "admin"
          ? "admin.html"
          : "dashboard-petugas.html"
      );

    } catch (error) {
      console.error("Login error:", error);
      msg(message, error.message || "Login gagal.", true);
    } finally {
      button.disabled = false;
      button.textContent = "Masuk ke Dashboard →";
    }
  });
});
