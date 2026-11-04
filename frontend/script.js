// =====================================
// BACKEND API URL
// =====================================

const API_URL = "https://YOUR-RAILWAY-URL.up.railway.app";


// =====================================
// HTML ELEMENTS
// =====================================

const pdfInput = document.getElementById("pdfInput");
const chooseFileBtn = document.getElementById("chooseFileBtn");
const uploadBtn = document.getElementById("uploadBtn");
const uploadArea = document.getElementById("uploadArea");

const selectedFileName = document.getElementById("selectedFileName");
const uploadStatus = document.getElementById("uploadStatus");

const papersList = document.getElementById("papersList");
const paperSelect = document.getElementById("paperSelect");

const refreshPapersBtn = document.getElementById("refreshPapersBtn");

const summaryBtn = document.getElementById("summaryBtn");
const summaryResult = document.getElementById("summaryResult");

const questionInput = document.getElementById("questionInput");
const askBtn = document.getElementById("askBtn");
const answerResult = document.getElementById("answerResult");

const researchGapBtn = document.getElementById("researchGapBtn");
const researchGapResult = document.getElementById("researchGapResult");

const comparePaperList = document.getElementById("comparePaperList");
const compareBtn = document.getElementById("compareBtn");
const compareResult = document.getElementById("compareResult");


// =====================================
// SELECTED FILE
// =====================================

let selectedFile = null;


// =====================================
// HELPER: STATUS MESSAGE
// =====================================

function showStatus(element, message, type = "") {

  element.textContent = message;

  element.className = "status-message";

  if (type) {
    element.classList.add(type);
  }
}


// =====================================
// HELPER: RESULT DISPLAY
// =====================================

// =====================================
// MARKDOWN RENDERER
// =====================================

function renderMarkdown(content) {

  if (typeof content !== "string") {
    content = String(content ?? "");
  }

  // Markdown ko HTML mein convert karo
  const html = marked.parse(content, {
    gfm: true,
    breaks: true
  });

  // Unsafe HTML remove karo
  return DOMPurify.sanitize(html);
}


// =====================================
// SHOW RESULT WITH PROPER FORMATTING
// =====================================

function showResult(element, title, content) {

  element.replaceChildren();

  const heading = document.createElement("h3");

  heading.textContent = title;

  const output = document.createElement("div");

  output.className = "markdown-content";

  output.innerHTML = renderMarkdown(content);

  element.appendChild(heading);

  element.appendChild(output);

  element.classList.add("show");
}

// =====================================
// HELPER: ERROR MESSAGE
// =====================================

function getErrorMessage(errorData, fallback) {

  if (typeof errorData?.detail === "string") {
    return errorData.detail;
  }

  if (Array.isArray(errorData?.detail)) {
    return errorData.detail
      .map(item => item.msg || JSON.stringify(item))
      .join(", ");
  }

  return fallback;
}


// =====================================
// HELPER: API REQUEST
// =====================================

async function apiRequest(url, options = {}) {

  const response = await fetch(url, options);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {

    throw new Error(
      getErrorMessage(data, "Something went wrong.")
    );

  }

  return data;
}


// =====================================
// CHOOSE PDF
// =====================================

chooseFileBtn.addEventListener("click", () => {

  pdfInput.click();

});


// =====================================
// FILE SELECTION
// =====================================

pdfInput.addEventListener("change", () => {

  selectedFile = pdfInput.files[0] || null;

  if (!selectedFile) {

    selectedFileName.textContent = "";
    uploadBtn.disabled = true;

    return;
  }

  if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {

    showStatus(
      uploadStatus,
      "Please select a PDF file.",
      "error"
    );

    selectedFile = null;
    uploadBtn.disabled = true;

    return;
  }

  selectedFileName.textContent =
    "Selected: " + selectedFile.name;

  uploadBtn.disabled = false;

  showStatus(uploadStatus, "");

});


// =====================================
// DRAG AND DROP PDF
// =====================================

uploadArea.addEventListener("dragover", (event) => {

  event.preventDefault();

  uploadArea.classList.add("dragging");

});

uploadArea.addEventListener("dragleave", () => {

  uploadArea.classList.remove("dragging");

});

uploadArea.addEventListener("drop", (event) => {

  event.preventDefault();

  uploadArea.classList.remove("dragging");

  const file = event.dataTransfer.files[0];

  if (!file) {
    return;
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {

    showStatus(
      uploadStatus,
      "Please drop a PDF file.",
      "error"
    );

    return;
  }

  selectedFile = file;

  selectedFileName.textContent =
    "Selected: " + selectedFile.name;

  uploadBtn.disabled = false;

  showStatus(uploadStatus, "");

});


// =====================================
// UPLOAD PDF
// =====================================

uploadBtn.addEventListener("click", async () => {

  if (!selectedFile) {

    showStatus(
      uploadStatus,
      "Please select a PDF first.",
      "error"
    );

    return;
  }

  const formData = new FormData();

  formData.append("file", selectedFile);

  uploadBtn.disabled = true;

  showStatus(
    uploadStatus,
    "Uploading PDF and generating embeddings... Please wait.",
    "loading"
  );

  try {

    const data = await apiRequest(
      `${API_URL}/upload`,
      {
        method: "POST",
        body: formData
      }
    );

    showStatus(
      uploadStatus,
      `PDF uploaded successfully! Pages: ${data.total_pages}, Chunks: ${data.total_chunks}`,
      "success"
    );

    selectedFile = null;
    pdfInput.value = "";
    selectedFileName.textContent = "";

    await loadPapers();

  } catch (error) {

    showStatus(
      uploadStatus,
      error.message,
      "error"
    );

  } finally {

    uploadBtn.disabled = !selectedFile;

  }

});


// =====================================
// LOAD ALL PAPERS
// =====================================

async function loadPapers() {

  try {

    const data = await apiRequest(
      `${API_URL}/papers`
    );

    const papers = data.papers || [];

    // Reset paper dropdown
    paperSelect.replaceChildren();

    const defaultOption = document.createElement("option");

    defaultOption.value = "";
    defaultOption.textContent = "Select a research paper";

    paperSelect.appendChild(defaultOption);


    // Reset paper list
    papersList.replaceChildren();

    // Reset comparison list
    comparePaperList.replaceChildren();


    if (papers.length === 0) {

      const emptyMessage = document.createElement("p");

      emptyMessage.className = "empty-message";
      emptyMessage.textContent = "No papers uploaded yet.";

      papersList.appendChild(emptyMessage);

      comparePaperList.appendChild(
        emptyMessage.cloneNode(true)
      );

      return;

    }


    // Add uploaded papers
    papers.forEach((paper) => {

      // Dropdown option
      const option = document.createElement("option");

      option.value = paper.paper_id;
      option.textContent = paper.title;

      paperSelect.appendChild(option);


      // Paper list item
      const paperItem = document.createElement("div");

      paperItem.className = "paper-item";


      const paperInfo = document.createElement("div");

      paperInfo.className = "paper-info";


      const paperTitle = document.createElement("h3");

      paperTitle.textContent = paper.title;


      const paperDetails = document.createElement("p");

      paperDetails.textContent =
        `Pages: ${paper.total_pages} | Chunks: ${paper.total_chunks}`;


      paperInfo.appendChild(paperTitle);
      paperInfo.appendChild(paperDetails);


      // Delete button
      const deleteButton = document.createElement("button");

      deleteButton.className = "delete-btn";
      deleteButton.textContent = "Delete";

      deleteButton.addEventListener("click", () => {
        deletePaper(paper.paper_id);
      });


      paperItem.appendChild(paperInfo);
      paperItem.appendChild(deleteButton);

      papersList.appendChild(paperItem);


      // Comparison checkbox
      const compareItem = document.createElement("div");

      compareItem.className = "compare-item";


      const checkbox = document.createElement("input");

      checkbox.type = "checkbox";
      checkbox.value = paper.paper_id;
      checkbox.id = `compare-${paper.paper_id}`;


      const label = document.createElement("label");

      label.htmlFor = checkbox.id;
      label.textContent = paper.title;


      compareItem.appendChild(checkbox);
      compareItem.appendChild(label);

      comparePaperList.appendChild(compareItem);

    });

  } catch (error) {

    papersList.textContent =
      "Could not load papers: " + error.message;

  }

}


// =====================================
// REFRESH PAPERS
// =====================================

refreshPapersBtn.addEventListener("click", loadPapers);


// =====================================
// DELETE PAPER
// =====================================

async function deletePaper(paperId) {

  const confirmed = confirm(
    "Are you sure you want to delete this paper?"
  );

  if (!confirmed) {
    return;
  }

  try {

    await apiRequest(
      `${API_URL}/papers/${encodeURIComponent(paperId)}`,
      {
        method: "DELETE"
      }
    );

    await loadPapers();

    alert("Paper deleted successfully.");

  } catch (error) {

    alert(error.message);

  }

}


// =====================================
// GET SELECTED PAPER ID
// =====================================

function getSelectedPaperId() {

  const paperId = paperSelect.value;

  if (!paperId) {

    alert("Please select a research paper first.");

    return null;

  }

  return paperId;

}


// =====================================
// GENERATE SUMMARY
// =====================================

summaryBtn.addEventListener("click", async () => {

  const paperId = getSelectedPaperId();

  if (!paperId) {
    return;
  }

  summaryBtn.disabled = true;

  summaryResult.classList.remove("show");

  summaryResult.textContent = "Generating summary...";

  try {

    const data = await apiRequest(
      `${API_URL}/summary/${encodeURIComponent(paperId)}`,
      {
        method: "POST"
      }
    );

    showResult(
      summaryResult,
      "Research Paper Summary",
      data.summary
    );

  } catch (error) {

    showResult(
      summaryResult,
      "Error",
      error.message
    );

  } finally {

    summaryBtn.disabled = false;

  }

});


// =====================================
// ASK QUESTION
// =====================================

askBtn.addEventListener("click", async () => {

  const paperId = getSelectedPaperId();

  if (!paperId) {
    return;
  }

  const question = questionInput.value.trim();

  if (!question) {

    alert("Please enter a question.");

    return;

  }

  askBtn.disabled = true;

  answerResult.classList.remove("show");

  answerResult.textContent = "AI is answering your question...";

  try {

    const data = await apiRequest(
      `${API_URL}/ask`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          paper_id: paperId,
          question: question
        })
      }
    );


    answerResult.replaceChildren();

    const heading = document.createElement("h3");

    heading.textContent = "AI Answer";

    answerResult.appendChild(heading);


    const answer = document.createElement("div");

    answer.className = "markdown-content";

    answer.innerHTML = renderMarkdown(data.answer);

    answerResult.appendChild(answer);


    // Citation display
    if (data.citations && data.citations.length > 0) {

      const citationHeading = document.createElement("h4");

      citationHeading.textContent = "Source References";

      answerResult.appendChild(citationHeading);


      data.citations.forEach((citation) => {

        const citationText = document.createElement("p");

        citationText.textContent =
          `Page ${citation.page_number}: ${citation.text}`;

        answerResult.appendChild(citationText);

      });

    }

    answerResult.classList.add("show");

  } catch (error) {

    showResult(
      answerResult,
      "Error",
      error.message
    );

  } finally {

    askBtn.disabled = false;

  }

});


// =====================================
// RESEARCH GAP FINDER
// =====================================

researchGapBtn.addEventListener("click", async () => {

  const paperId = getSelectedPaperId();

  if (!paperId) {
    return;
  }

  researchGapBtn.disabled = true;

  researchGapResult.classList.remove("show");

  researchGapResult.textContent =
    "Analyzing research paper...";

  try {

    const data = await apiRequest(
      `${API_URL}/research-gaps/${encodeURIComponent(paperId)}`,
      {
        method: "POST"
      }
    );

    showResult(
      researchGapResult,
      "Potential Research Gaps",
      data.research_gaps
    );

  } catch (error) {

    showResult(
      researchGapResult,
      "Error",
      error.message
    );

  } finally {

    researchGapBtn.disabled = false;

  }

});


// =====================================
// COMPARE RESEARCH PAPERS
// =====================================

compareBtn.addEventListener("click", async () => {

  const checkboxes = document.querySelectorAll(
    "#comparePaperList input[type='checkbox']:checked"
  );

  const paperIds = Array.from(checkboxes).map(
    checkbox => checkbox.value
  );

  if (paperIds.length < 2) {

    alert("Please select at least two papers.");

    return;

  }

  if (paperIds.length > 5) {

    alert("You can compare a maximum of five papers.");

    return;

  }

  compareBtn.disabled = true;

  compareResult.classList.remove("show");

  compareResult.textContent = "Comparing research papers...";

  try {

    const data = await apiRequest(
      `${API_URL}/compare`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          paper_ids: paperIds
        })
      }
    );

    showResult(
      compareResult,
      "Research Paper Comparison",
      data.comparison
    );

  } catch (error) {

    showResult(
      compareResult,
      "Error",
      error.message
    );

  } finally {

    compareBtn.disabled = false;

  }

});


// =====================================
// INITIALIZE APPLICATION
// =====================================

document.addEventListener("DOMContentLoaded", () => {

  loadPapers();

});