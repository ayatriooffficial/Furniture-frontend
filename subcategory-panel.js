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
    item.innerHTML = `<span>📄 ${file.name} (${(file.size / 1024).toFixed(
      2
    )} KB)</span><button type="button" data-index="${index}">Remove</button>`;
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
  .getElementById("subcategoryForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const messageDiv = document.getElementById("subcategoryMessage");
    const loadingDiv = document.getElementById("subcategoryLoading");
    const fileInput = document.getElementById("subcategoryImages");
    if (messageDiv) {
      messageDiv.className = "message";
      messageDiv.textContent = "";
      messageDiv.classList.remove("show");
    }
    if (loadingDiv) loadingDiv.style.display = "none";
    try {
      const formData = new FormData();
      formData.append("name", form.querySelector('[name="name"]').value);
      formData.append(
        "category",
        form.querySelector('[name="category"]').value
      );
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
      const descriptionStructured = collectDescriptionStructured();
      if (Object.keys(descriptionStructured).length > 0) {
        formData.append(
          "descriptionStructured",
          JSON.stringify(descriptionStructured)
        );
      }

      if (fileInput && fileInput.files && fileInput.files.length > 0)
        for (let i = 0; i < fileInput.files.length; i++)
          formData.append("images", fileInput.files[i]);

      const featureNodes = document.querySelectorAll(
        "#subcategoryFeaturesList .feature-item input"
      );
      const features = [];
      featureNodes.forEach((node) => {
        const value = node.value.trim();
        if (value) features.push(value);
      });
      if (features.length)
        formData.append("features", JSON.stringify(features));

      const colorNodes = document.querySelectorAll(
        "#subcategoryColorsList .color-item input"
      );
      const colors = [];
      colorNodes.forEach((node) => {
        const value = node.value.trim();
        if (value) colors.push(value);
      });
      if (colors.length) formData.append("colors", JSON.stringify(colors));

      const materialNodes = document.querySelectorAll(
        "#subcategoryMaterialsList .material-item input"
      );
      const materials = [];
      materialNodes.forEach((node) => {
        const value = node.value.trim();
        if (value) materials.push(value);
      });
      if (materials.length)
        formData.append("materials", JSON.stringify(materials));

      const faqNodes = document.querySelectorAll(
        "#subcategoryFaqList .faq-item"
      );
      const faqs = [];
      faqNodes.forEach((node) => {
        const q = node.querySelector(".faq-question")?.value?.trim();
        const a = node.querySelector(".faq-answer")?.value?.trim();
        if (q || a) faqs.push({ question: q, answer: a });
      });
      if (faqs.length) formData.append("faqs", JSON.stringify(faqs));
      if (loadingDiv) loadingDiv.style.display = "block";
      const res = await fetch(`${API_BASE_URL}/subcategories`, {
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
        const fileListEl = document.getElementById("subcategoryFileList");
        if (fileListEl) fileListEl.innerHTML = "";
        try {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (e) {}
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
async function loadCategoriesIntoSelect() {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`);
    const json = await res.json();
    if (json.success && json.data) {
      const sel = document.getElementById("subcategoryCategory");
      json.data.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat._id;
        opt.textContent = cat.name;
        sel.appendChild(opt);
      });
    }
  } catch (err) {
    console.error("Error loading categories", err);
  }
}

function collectDescriptionStructured() {
  const structured = {};
  const guidanceNodes = document.querySelectorAll(
    "#buyingGuidanceList .guidance-item"
  );
  const buyingGuidance = [];
  guidanceNodes.forEach((node) => {
    const question = node.querySelector(".guidance-question")?.value?.trim();
    const answer = node.querySelector(".guidance-answer")?.value?.trim();
    if (question || answer) {
      buyingGuidance.push({ question, answer });
    }
  });
  if (buyingGuidance.length > 0) {
    structured.buyingGuidance = buyingGuidance;
  }

  return structured;
}
document.addEventListener("DOMContentLoaded", () => {
  setupFileHandlers("#subcategoryImages", "#subcategoryFileList");
  loadCategoriesIntoSelect();
  setupDescriptionStructured();
  const faqList = document.getElementById("subcategoryFaqList");
  const addFaqBtn = document.getElementById("addSubcategoryFaq");
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
  const featureList = document.getElementById("subcategoryFeaturesList");
  const addFeatureBtn = document.getElementById("addSubcategoryFeature");
  if (featureList && addFeatureBtn) {
    function createFeatureRow() {
      const wrap = document.createElement("div");
      wrap.className = "file-item feature-item";
      wrap.style.display = "flex";
      wrap.style.gap = "8px";
      wrap.innerHTML = `
        <input type="text" placeholder="e.g., Solid Wood, Hand-finished, Eco-friendly" style="flex: 1;" />
        <button type="button" class="remove-feature">Remove</button>
      `;
      wrap
        .querySelector(".remove-feature")
        .addEventListener("click", () => wrap.remove());
      featureList.appendChild(wrap);
    }
    addFeatureBtn.addEventListener("click", (e) => {
      e.preventDefault();
      createFeatureRow();
    });
    createFeatureRow();
  }
  const colorList = document.getElementById("subcategoryColorsList");
  const addColorBtn = document.getElementById("addSubcategoryColor");
  if (colorList && addColorBtn) {
    function createColorRow() {
      const wrap = document.createElement("div");
      wrap.className = "file-item color-item";
      wrap.style.display = "flex";
      wrap.style.gap = "8px";
      wrap.innerHTML = `
        <input type="text" placeholder="e.g., Oak, Walnut, Black, White" style="flex: 1;" />
        <button type="button" class="remove-color">Remove</button>
      `;
      wrap
        .querySelector(".remove-color")
        .addEventListener("click", () => wrap.remove());
      colorList.appendChild(wrap);
    }
    addColorBtn.addEventListener("click", (e) => {
      e.preventDefault();
      createColorRow();
    });
    createColorRow();
  }
  const materialList = document.getElementById("subcategoryMaterialsList");
  const addMaterialBtn = document.getElementById("addSubcategoryMaterial");
  if (materialList && addMaterialBtn) {
    function createMaterialRow() {
      const wrap = document.createElement("div");
      wrap.className = "file-item material-item";
      wrap.style.display = "flex";
      wrap.style.gap = "8px";
      wrap.innerHTML = `
        <input type="text" placeholder="e.g., Oak, Walnut, Leather, Fabric" style="flex: 1;" />
        <button type="button" class="remove-material">Remove</button>
      `;
      wrap
        .querySelector(".remove-material")
        .addEventListener("click", () => wrap.remove());
      materialList.appendChild(wrap);
    }
    addMaterialBtn.addEventListener("click", (e) => {
      e.preventDefault();
      createMaterialRow();
    });
    createMaterialRow();
  }
});
function setupDescriptionStructured() {
  const addGuidanceBtn = document.getElementById("addBuyingGuidance");
  const guidanceList = document.getElementById("buyingGuidanceList");
  if (addGuidanceBtn && guidanceList) {
    addGuidanceBtn.addEventListener("click", (e) => {
      e.preventDefault();
      createGuidanceRow(guidanceList);
    });
  }
}

function createGuidanceRow(container) {
  const wrap = document.createElement("div");
  wrap.className = "guidance-item";
  wrap.style.display = "grid";
  wrap.style.gridTemplateColumns = "1fr 1fr auto";
  wrap.style.gap = "8px";
  wrap.innerHTML = `
    <input type="text" class="guidance-question" placeholder="Question" />
    <input type="text" class="guidance-answer" placeholder="Answer" />
    <button type="button" class="remove-btn">Remove</button>
  `;
  wrap
    .querySelector(".remove-btn")
    .addEventListener("click", () => wrap.remove());
  container.appendChild(wrap);
}
