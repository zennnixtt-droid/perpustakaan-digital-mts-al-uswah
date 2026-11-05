
document.addEventListener("DOMContentLoaded", async () => {
  const x = await guard("admin");
  if (!x) return;

  const form = document.getElementById("create-staff-form");
  const message = document.getElementById("admin-message");
  const body = document.getElementById("staff-list");
  const refreshButton = document.getElementById("refresh-staff");
  const logoutButton = document.getElementById("logout");

  async function loadStaff() {
    body.innerHTML = '<tr><td colspan="4">Memuat data...</td></tr>';

    try {
      const { data, error } = await db()
        .from("profiles")
        .select("id,full_name,role,created_at")
        .eq("role", "petugas")
        .order("created_at", { ascending: false });

      if (error) throw error;

      body.innerHTML = data.length
        ? data.map(p => `
          <tr>
            <td>${esc(p.full_name)}</td>
            <td>${esc(p.id)}</td>
            <td>PETUGAS</td>
            <td>${new Date(p.created_at).toLocaleDateString("id-ID")}</td>
          </tr>
        `).join("")
        : '<tr><td colspan="4">Belum ada akun petugas.</td></tr>';

    } catch (error) {
      console.error("Load staff error:", error);
      body.innerHTML = `
        <tr><td colspan="4">${esc(error.message)}</td></tr>
      `;
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const button = form.querySelector("button");
    button.disabled = true;
    button.textContent = "Membuat akun...";

    try {
      const email = document.getElementById("staff-email").value.trim();
      const password = document.getElementById("staff-password").value;
      const fullName = document.getElementById("staff-name").value.trim();

      if (fullName.length < 2) {
        throw new Error("Nama petugas minimal 2 karakter.");
      }

      if (password.length < 8) {
        throw new Error("Password minimal 8 karakter.");
      }

      const { data: { session }, error: sessionError } =
        await db().auth.getSession();

      if (sessionError) throw sessionError;
      if (!session) throw new Error("Sesi admin berakhir. Silakan login kembali.");

      const { data, error } = await db().functions.invoke(
        "create-staff",
        {
          body: {
            email,
            password,
            full_name: fullName
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      msg(message, "Akun petugas berhasil dibuat.");
      form.reset();

      await loadStaff();

    } catch (error) {
      console.error("Create staff error:", error);
      msg(message, error.message || "Gagal membuat akun petugas.", true);

    } finally {
      button.disabled = false;
      button.textContent = "＋ Buat akun";
    }
  });

  refreshButton.addEventListener("click", loadStaff);

  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;

    try {
      await db().auth.signOut();
    } finally {
      location.replace("petugas.html");
    }
  });

  await loadStaff();
});
