const API_BASE_URL = "http://localhost:5000/api";
function setupFileHandlers(inputSelector, listSelector) {
  const fileInput = document.querySelector(inputSelector);
  const fileList = document.querySelector(listSelector);
  if (!fileInput) return;

  fileInput.addEventListener("change", function () {
    updateFileList(this.files, fileList, fileInput);
  });

  const label = fileInput.parentElement;
  label.addEventListener("dragover", (e) => {
    e.preventDefault();
    label.style.backgroundColor = "#ede7f6";
  });
  label.addEventListener("dragleave", () => {
    label.style.backgroundColor = "#f5f5f5";
  });
  label.addEventListener("drop", (e) => {
    e.preventDefault();
    label.style.backgroundColor = "#f5f5f5";
    fileInput.files = e.dataTransfer.files;
    updateFileList(fileInput.files, fileList, fileInput);
  });
}

function updateFileList(files, container, fileInput) {
  container.innerHTML = "";
  const maxFiles = 1;
  const allowedMime = ["image/avif", "image/webp"];
  const allowedExt = ["avif", "webp"];
  if (files.length > maxFiles) {
    alert(`Maximum ${maxFiles} file allowed`);
    fileInput.value = "";
    return;
  }
  for (let f of files) {
    const ext = (f.name || "").split(".").pop().toLowerCase();
    if (!allowedMime.includes(f.type) && !allowedExt.includes(ext)) {
      alert(
        "Only AVIF and WebP image formats are allowed. Please choose valid files."
      );
      fileInput.value = "";
      container.innerHTML = "";
      return;
    }
  }
  Array.from(files).forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "file-item";
    item.innerHTML = `
      <span>📄 ${file.name} (${(file.size / 1024).toFixed(2)} KB)</span>
      <button type="button" data-index="${index}">Remove</button>`;
    item.querySelector("button").addEventListener("click", () => {
      removeFile(fileInput, index);
      updateFileList(fileInput.files, container, fileInput);
    });
    container.appendChild(item);
  });
}

function removeFile(fileInput, index) {
  const dt = new DataTransfer();
  const files = fileInput.files;
  for (let i = 0; i < files.length; i++)
    if (i !== index) dt.items.add(files[i]);
  fileInput.files = dt.files;
}
document
  .getElementById("categoryForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const messageDiv = document.getElementById("categoryMessage");
    const loadingDiv = document.getElementById("categoryLoading");
    const fileInput = document.getElementById("categoryImages");
    if (messageDiv) {
      messageDiv.className = "message";
      messageDiv.textContent = "";
      messageDiv.classList.remove("show");
    }
    if (loadingDiv) loadingDiv.style.display = "none";

    try {
      const formData = new FormData();
      formData.append("name", form.querySelector('[name="name"]').value);
      formData.append("slug", form.querySelector('[name="slug"]').value);
      formData.append("h1Tag", form.querySelector('[name="h1Tag"]').value);
      formData.append(
        "metaTitle",
        form.querySelector('[name="metaTitle"]').value
      );
      formData.append(
        "metaDescription",
        form.querySelector('[name="metaDescription"]').value
      );
      formData.append(
        "description",
        form.querySelector('[name="description"]').value
      );
      if (fileInput && fileInput.files && fileInput.files.length > 0)
        for (let i = 0; i < fileInput.files.length; i++)
          formData.append("images", fileInput.files[i]);
      const faqNodes = document.querySelectorAll("#categoryFaqList .faq-item");
      const faqs = [];
      faqNodes.forEach((node) => {
        const q = node.querySelector(".faq-question")?.value?.trim();
        const a = node.querySelector(".faq-answer")?.value?.trim();
        if (q || a) faqs.push({ question: q, answer: a });
      });
      if (faqs.length) formData.append("faqs", JSON.stringify(faqs));
      const bgNodes = document.querySelectorAll(
        "#buyingGuidanceList .buying-guidance-item"
      );
      const buyingGuidance = [];
      bgNodes.forEach((node) => {
        const s = node
          .querySelector(".buying-guidance-specification")
          ?.value?.trim();
        const d = node.querySelector(".buying-guidance-detail")?.value?.trim();
        if (s || d) buyingGuidance.push({ specification: s, detail: d });
      });
      if (buyingGuidance.length)
        formData.append("buyingGuidance", JSON.stringify(buyingGuidance));

      if (loadingDiv) loadingDiv.style.display = "block";
      const res = await fetch(`${API_BASE_URL}/categories`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        if (messageDiv) {
          messageDiv.className = "message success";
          messageDiv.textContent = `✓ ${data.message}`;
          messageDiv.classList.add("show");
          setTimeout(() => {
            messageDiv.classList.remove("show");
          }, 3500);
        }
        form.reset();
        document.getElementById("categoryFileList").innerHTML = "";
      } else {
        if (messageDiv) {
          messageDiv.className = "message error";
          messageDiv.textContent = `✗ ${data.message || "Error"}`;
          messageDiv.classList.add("show");
        }
      }
    } catch (err) {
      if (messageDiv) {
        messageDiv.className = "message error";
        messageDiv.textContent = `✗ ${err.message}`;
        messageDiv.classList.add("show");
      }
      console.error(err);
    } finally {
      if (loadingDiv) loadingDiv.style.display = "none";
    }
  });
document.addEventListener("DOMContentLoaded", () => {
  setupFileHandlers("#categoryImages", "#categoryFileList");
  const faqList = document.getElementById("categoryFaqList");
  const addFaqBtn = document.getElementById("addCategoryFaq");
  function createFaqRow() {
    const wrap = document.createElement("div");
    wrap.className = "file-item faq-item";
    wrap.style.display = "grid";
    wrap.style.gridTemplateColumns = "1fr 1fr auto";
    wrap.style.gap = "8px";
    wrap.innerHTML = `
      <input class="faq-question" placeholder="Question" />
      <input class="faq-answer" placeholder="Answer" />
      <button type="button" class="remove-faq">Remove</button>
    `;
    wrap
      .querySelector(".remove-faq")
      .addEventListener("click", () => wrap.remove());
    faqList.appendChild(wrap);
  }
  addFaqBtn.addEventListener("click", (e) => {
    e.preventDefault();
    createFaqRow();
  });
  createFaqRow();
  const bgList = document.getElementById("buyingGuidanceList");
  const addBgBtn = document.getElementById("addBuyingGuidance");
  function createBuyingGuidanceRow() {
    const wrap = document.createElement("div");
    wrap.className = "file-item buying-guidance-item";
    wrap.style.display = "grid";
    wrap.style.gridTemplateColumns = "1fr 1fr auto";
    wrap.style.gap = "8px";
    wrap.innerHTML = `
      <input class="buying-guidance-specification" placeholder="Specification (e.g., Material)" />
      <input class="buying-guidance-detail" placeholder="Detail (e.g., Premium Oak Wood)" />
      <button type="button" class="remove-bg">Remove</button>
    `;
    wrap
      .querySelector(".remove-bg")
      .addEventListener("click", () => wrap.remove());
    bgList.appendChild(wrap);
  }
  addBgBtn.addEventListener("click", (e) => {
    e.preventDefault();
    createBuyingGuidanceRow();
  });
  createBuyingGuidanceRow();
  loadSidebarCategories();
});
async function loadSidebarCategories() {
  const container = document.getElementById("allCategoriesList");
  const loading = document.getElementById("allCategoriesLoading");
  if (!container) return;
  try {
    if (loading) loading.textContent = "Loading…";
    const res = await fetch(`${API_BASE_URL}/categories`);
    const json = await res.json();
    container.innerHTML = "";
    if (!res.ok || !json || !json.data) {
      const errEl = document.createElement("div");
      errEl.style.color = "#c02626";
      errEl.style.fontSize = "13px";
      errEl.textContent = "Failed to load categories";
      container.appendChild(errEl);
      return;
    }

    if (json.data.length === 0) {
      const none = document.createElement("div");
      none.style.color = "#64748b";
      none.style.fontSize = "13px";
      none.textContent = "No categories yet";
      container.appendChild(none);
      return;
    }

    json.data.forEach((cat) => {
      const row = document.createElement("a");
      row.href = `/index_decor/category/${cat.slug}`;
      row.className = "sidebar-category";

      const thumb = document.createElement("img");
      const imgSrc =
        (cat.images &&
          cat.images[0] &&
          (cat.images[0].thumb || cat.images[0].src)) ||
        "https://via.placeholder.com/44x44.png?text=Cat";
      thumb.src = imgSrc;
      thumb.alt = cat.name || "category";

      const label = document.createElement("span");
      label.textContent = cat.name;

      row.appendChild(thumb);
      row.appendChild(label);
      container.appendChild(row);
    });
  } catch (err) {
    container.innerHTML = "";
    const errEl = document.createElement("div");
    errEl.style.color = "#c02626";
    errEl.style.fontSize = "13px";
    errEl.textContent = "Error loading categories";
    container.appendChild(errEl);
    console.error("loadSidebarCategories error", err);
  }
}
