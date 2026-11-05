
document.addEventListener("DOMContentLoaded", async () => {
  // =====================================
  // 1. CEK LOGIN PETUGAS
  // =====================================

  const account = await guard("petugas");
  if (!account) return;

  const supabase = db();

  document.getElementById("staff-name").textContent =
    account.p.full_name || "Petugas";

  // =====================================
  // 2. AMBIL ELEMEN HTML
  // =====================================

  const bookForm = document.getElementById("book-form");
  const bookBody = document.getElementById("staff-books");
  const bookMessage = document.getElementById("staff-message");
  const refreshBooks = document.getElementById("refresh-books");

  const borrowingBody = document.getElementById("borrowing-list");
  const borrowingMessage = document.getElementById("borrowing-message");
  const refreshBorrowings = document.getElementById("refresh-borrowings");

  const logoutButton = document.getElementById("logout");

  // =====================================
  // 3. FORMAT TANGGAL
  // =====================================

  function formatDate(value) {
    if (!value) return "-";

    return new Date(value).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  }

  // =====================================
  // 4. MEMUAT KOLEKSI BUKU
  // =====================================

  async function loadBooks() {
    bookBody.innerHTML =
      '<tr><td colspan="5">Memuat koleksi buku...</td></tr>';

    try {
      const { data, error } = await supabase
        .from("books")
        .select("id,title,author,category,stock")
        .order("title", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        bookBody.innerHTML =
          '<tr><td colspan="5">Belum ada buku.</td></tr>';
        return;
      }

      bookBody.innerHTML = data.map(book => `
        <tr>
          <td>${esc(book.title)}</td>
          <td>${esc(book.author || "-")}</td>
          <td>${esc(book.category || "Lainnya")}</td>
          <td>${Number(book.stock)}</td>
          <td>
            <button
              type="button"
              class="delete"
              data-id="${esc(book.id)}">
              Hapus
            </button>
          </td>
        </tr>
      `).join("");

    } catch (error) {
      console.error("Load books error:", error);

      bookBody.innerHTML = `
        <tr>
          <td colspan="5">${esc(error.message)}</td>
        </tr>
      `;
    }
  }

  // =====================================
  // 5. TAMBAH BUKU
  // =====================================

  bookForm.addEventListener("submit", async event => {
    event.preventDefault();

    const button = bookForm.querySelector('button[type="submit"]');

    const title = document.getElementById("book-title").value.trim();
    const author = document.getElementById("book-author").value.trim();
    const category = document.getElementById("book-category").value;
    const stock = Number(document.getElementById("book-stock").value);
    const description =
      document.getElementById("book-description").value.trim();

    if (title.length < 1) {
      msg(bookMessage, "Judul buku wajib diisi.", true);
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      msg(bookMessage, "Stok harus berupa angka bulat minimal 0.", true);
      return;
    }

    button.disabled = true;
    button.textContent = "Menyimpan...";

    try {
      const { error } = await supabase
        .from("books")
        .insert({
          title,
          author,
          category,
          stock,
          description
        });

      if (error) throw error;

      msg(bookMessage, "Buku berhasil ditambahkan.");

      bookForm.reset();
      document.getElementById("book-stock").value = 1;

      await loadBooks();

    } catch (error) {
      console.error("Add book error:", error);
      msg(bookMessage, error.message || "Gagal menambahkan buku.", true);

    } finally {
      button.disabled = false;
      button.textContent = "＋ Simpan buku";
    }
  });

  // =====================================
  // 6. HAPUS BUKU
  // =====================================

  bookBody.addEventListener("click", async event => {
    const button = event.target.closest("button[data-id]");

    if (!button) return;

    const id = button.dataset.id;

    if (!confirm("Yakin ingin menghapus buku ini?")) return;

    button.disabled = true;

    try {
      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", id);

      if (error) throw error;

      msg(bookMessage, "Buku berhasil dihapus.");

      await loadBooks();

    } catch (error) {
      console.error("Delete book error:", error);

      msg(
        bookMessage,
        error.message.includes("foreign key")
          ? "Buku memiliki riwayat peminjaman dan tidak bisa dihapus."
          : error.message,
        true
      );

      button.disabled = false;
    }
  });

  // =====================================
  // 7. MEMUAT DATA PEMINJAMAN
  // =====================================

  async function loadBorrowings() {
    borrowingBody.innerHTML =
      '<tr><td colspan="6">Memuat data peminjaman...</td></tr>';

    try {
      const { data, error } = await supabase
        .from("borrowings")
        .select(`
          id,
          student_name,
          student_class,
          borrow_date,
          status,
          books(title)
        `)
        .eq("status", "dipinjam")
        .order("borrow_date", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        borrowingBody.innerHTML =
          '<tr><td colspan="6">Belum ada peminjaman aktif.</td></tr>';
        return;
      }

      borrowingBody.innerHTML = data.map(item => `
        <tr>
          <td>${esc(item.student_name)}</td>
          <td>${esc(item.student_class)}</td>
          <td>${esc(item.books?.title || "Buku tidak ditemukan")}</td>
          <td>${formatDate(item.borrow_date)}</td>
          <td>
            <span class="badge">Dipinjam</span>
          </td>
          <td>
            <button
              type="button"
              class="btn primary return-button"
              data-id="${esc(item.id)}">
              Kembalikan
            </button>
          </td>
        </tr>
      `).join("");

    } catch (error) {
      console.error("Load borrowings error:", error);

      borrowingBody.innerHTML = `
        <tr>
          <td colspan="6">${esc(error.message)}</td>
        </tr>
      `;
    }
  }

  // =====================================
  // 8. KONFIRMASI PENGEMBALIAN
  // =====================================

  borrowingBody.addEventListener("click", async event => {
    const button = event.target.closest(".return-button");

    if (!button) return;

    const id = button.dataset.id;

    if (!confirm(
      "Konfirmasi bahwa buku sudah dikembalikan oleh siswa?"
    )) return;

    button.disabled = true;
    button.textContent = "Memproses...";

    try {
      const { error } = await supabase.rpc("return_borrowing", {
        p_borrowing_id: id
      });

      if (error) throw error;

      msg(
        borrowingMessage,
        "Pengembalian berhasil. Stok buku sudah diperbarui."
      );

      await Promise.all([
        loadBorrowings(),
        loadBooks()
      ]);

    } catch (error) {
      console.error("Return borrowing error:", error);

      msg(
        borrowingMessage,
        error.message || "Pengembalian gagal diproses.",
        true
      );

      button.disabled = false;
      button.textContent = "Kembalikan";
    }
  });

  // =====================================
  // 9. TOMBOL MUAT ULANG
  // =====================================

  refreshBooks.addEventListener("click", loadBooks);
  refreshBorrowings.addEventListener("click", loadBorrowings);

  // =====================================
  // 10. LOGOUT
  // =====================================

  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      location.replace("petugas.html");

    } catch (error) {
      console.error("Logout error:", error);
      alert("Gagal logout: " + error.message);
      logoutButton.disabled = false;
    }
  });

  // =====================================
  // 11. JALANKAN DASHBOARD
  // =====================================

  await Promise.all([
    loadBooks(),
    loadBorrowings()
  ]);
});
