
document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("book-grid");
  const search = document.getElementById("search");
  const category = document.getElementById("category");
  const resultCount = document.getElementById("result-count");

  const borrowPanel = document.getElementById("borrow-panel");
  const selectedBookText = document.getElementById("selected-book");
  const studentName = document.getElementById("student-name");
  const studentClass = document.getElementById("student-class");
  const submitBorrow = document.getElementById("submit-borrow");
  const cancelBorrow = document.getElementById("cancel-borrow");
  const borrowMessage = document.getElementById("borrow-message");

  let books = [];
  let selectedBook = null;

  if (!grid || !search || !category || !resultCount) {
    console.error("[Catalog] Elemen katalog tidak lengkap.");
    return;
  }

  if (
    !borrowPanel ||
    !selectedBookText ||
    !studentName ||
    !studentClass ||
    !submitBorrow ||
    !cancelBorrow ||
    !borrowMessage
  ) {
    console.error("[Catalog] Elemen formulir peminjaman tidak lengkap.");
    return;
  }

  function showBorrowMessage(text, error = false) {
    borrowMessage.textContent = text;
    borrowMessage.className =
      "message " + (error ? "error" : "success");
  }

  async function loadBooks() {
    const { data, error } = await window.db()
      .from("books")
      .select("id,title,author,category,stock")
      .order("title", { ascending: true });

    if (error) throw error;

    books = data || [];
    render();
  }

  function render() {
    const query = search.value.trim().toLowerCase();
    const selectedCategory = category.value;

    const filtered = books.filter(book => {
      const matchesCategory =
        !selectedCategory || book.category === selectedCategory;

      const text =
        `${book.title} ${book.author || ""}`.toLowerCase();

      return matchesCategory && text.includes(query);
    });

    resultCount.textContent =
      `${filtered.length} buku ditemukan`;

    if (!filtered.length) {
      grid.innerHTML =
        '<p class="empty">Buku tidak ditemukan.</p>';
      return;
    }

    grid.innerHTML = filtered.map(book => {
      const stock = Number(book.stock);
      const available = stock > 0;

      return `
        <article class="book-card">
          <div class="book-cover">
            📘
            <small>${window.esc(book.category || "Lainnya")}</small>
          </div>

          <div class="book-info">
            <h3>${window.esc(book.title)}</h3>
            <p>${window.esc(
              book.author || "Penulis tidak dicantumkan"
            )}</p>

            <b>
              ${available
                ? `Stok tersedia: ${stock}`
                : "Stok habis"}
            </b>

            <button
              type="button"
              class="btn primary borrow-button"
              data-book-id="${window.esc(String(book.id))}"
              ${available ? "" : "disabled"}
              style="width:100%;margin-top:12px">
              ${available ? "Pinjam Buku" : "Stok Habis"}
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  function openBorrowForm(book) {
    selectedBook = book;

    selectedBookText.textContent =
      `Buku: ${book.title} | Penulis: ${book.author || "-"}`;

    studentName.value = "";
    studentClass.value = "";

    showBorrowMessage("");

    submitBorrow.disabled = false;
    submitBorrow.textContent = "Ajukan Peminjaman";

    borrowPanel.classList.remove("hidden");

    borrowPanel.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    studentName.focus();
  }

  function closeBorrowForm() {
    borrowPanel.classList.add("hidden");

    selectedBook = null;
    studentName.value = "";
    studentClass.value = "";

    showBorrowMessage("");
  }

  grid.addEventListener("click", event => {
    const button = event.target.closest(".borrow-button");

    if (!button || button.disabled) return;

    const book = books.find(
      item => String(item.id) === button.dataset.bookId
    );

    if (book) openBorrowForm(book);
  });

  cancelBorrow.addEventListener("click", closeBorrowForm);

  submitBorrow.addEventListener("click", async () => {
    if (!selectedBook) return;

    const name = studentName.value.trim();
    const className = studentClass.value.trim();

    if (name.length < 2 || name.length > 100) {
      showBorrowMessage(
        "Nama harus terdiri dari 2 sampai 100 karakter.",
        true
      );
      return;
    }

    if (className.length < 1 || className.length > 30) {
      showBorrowMessage("Masukkan kelas dengan benar.", true);
      return;
    }

    submitBorrow.disabled = true;
    submitBorrow.textContent = "Memproses...";
    showBorrowMessage("");

    try {
      const { error } = await window.db().rpc(
        "request_borrowing",
        {
          p_book_id: selectedBook.id,
          p_student_name: name,
          p_student_class: className
        }
      );

      if (error) throw error;

      // Peminjaman sudah berhasil di database.
      showBorrowMessage(
        "Peminjaman berhasil! Silakan ambil buku di perpustakaan."
      );

      submitBorrow.textContent = "Berhasil";

      // Muat ulang katalog tanpa membatalkan status keberhasilan.
      try {
        await loadBooks();
      } catch (refreshError) {
        console.error(
          "[Catalog] Gagal memperbarui stok:",
          refreshError
        );
      }

      submitBorrow.disabled = true;

      setTimeout(closeBorrowForm, 2200);

    } catch (error) {
      console.error("[Borrowing] Error:", error);

      showBorrowMessage(
        error.message || "Peminjaman gagal. Silakan coba lagi.",
        true
      );

      submitBorrow.disabled = false;
      submitBorrow.textContent = "Ajukan Peminjaman";
    }
  });

  search.addEventListener("input", render);
  category.addEventListener("change", render);

  try {
    await loadBooks();
    console.log("[Catalog] Katalog berhasil dimuat.");
  } catch (error) {
    console.error("[Catalog] Gagal memuat:", error);

    grid.innerHTML =
      `<p class="empty">${window.esc(error.message)}</p>`;

    resultCount.textContent = "Katalog gagal dimuat.";
  }
});
