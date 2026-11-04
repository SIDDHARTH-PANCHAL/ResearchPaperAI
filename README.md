# Research Paper Intelligence & Innovation Finder

A beginner-friendly full-stack GenAI project for analyzing research papers.

## Features

- Upload and process multiple text-based PDF papers.
- Extract text by page, split it into overlapping chunks, and create searchable embeddings.
- Generate a structured summary for a selected paper.
- Ask questions about a selected paper using retrieval-augmented generation (RAG), with cited page passages.
- Compare between two and five uploaded papers.
- Generate possible research gaps and future research directions. Treat these as hypotheses and verify them through a wider literature review.
- View and delete uploaded papers.

## Tech stack

- Frontend: HTML, CSS, and JavaScript
- Backend: FastAPI and Uvicorn
- Language model: Groq API (default model: `openai/gpt-oss-20b`)
- Embeddings and vector search: Sentence Transformers (`all-MiniLM-L6-v2`) and FAISS
- PDF text extraction: PyMuPDF

## Requirements

- Windows 10/11
- Python 3.10 or 3.11 recommended
- Internet access for the Groq API and the first-time embedding-model download
- A Groq API key from [Groq Console](https://console.groq.com/keys)

## Setup (Windows / VS Code)

### 1. Open the project

Open the `ResearchPaperAI` folder in VS Code, then open a terminal in the project root.

### 2. Create and activate a virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, you can run commands with the virtual environment's Python directly, for example:

```powershell
.\.venv\Scripts\python.exe -m pip install --upgrade pip
```

### 3. Install dependencies

```powershell
python -m pip install -r backend\requirements.txt
```

### 4. Configure the Groq API

Create `backend\.env` and add your Groq API key:

```env
GROQ_API_KEY=your_key_here
GROQ_MODEL=openai/gpt-oss-20b
```

`GROQ_MODEL` is optional; if omitted, the backend uses `openai/gpt-oss-20b`. Use a model ID available to your Groq account if that default is unavailable.

**Keep your API key in `backend\.env`. Never put it in frontend JavaScript or commit it to source control.**

### 5. Start the backend

```powershell
cd backend
python -m uvicorn main:app --reload
```

The API is available at <http://127.0.0.1:8000>, and interactive API documentation is at <http://127.0.0.1:8000/docs>.

### 6. Start the frontend

In VS Code, install the **Live Server** extension if needed:

- Right-click `frontend\index.html`.
- Choose **Open with Live Server**.

The frontend will usually open at <http://127.0.0.1:5500>. It sends requests to `http://127.0.0.1:8000`. The backend currently allows cross-origin requests from any origin.

## How to use

1. Start both the backend and frontend.
2. Upload one or more PDF research papers and wait for processing to finish.
3. Select a paper to generate its summary, ask questions, or find potential research gaps.
4. Select two to five papers in the comparison section to compare them.
5. Review the retrieved passages and page references shown with question answers.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/` | Check that the API is running |
| `POST` | `/upload` | Upload and process a PDF |
| `GET` | `/papers` | List uploaded papers |
| `DELETE` | `/papers/{paper_id}` | Delete an uploaded paper |
| `POST` | `/summary/{paper_id}` | Summarize a paper |
| `POST` | `/ask` | Ask a question about a paper |
| `POST` | `/compare` | Compare two to five papers |
| `POST` | `/research-gaps/{paper_id}` | Suggest research gaps and directions |

## Notes and limitations

- Uploaded paper metadata, chunks, and FAISS indexes are held in memory. Restarting the backend clears them; upload the PDFs again.
- The embedding model is downloaded the first time it is used. Groq API availability, model access, and rate limits depend on your account and may change.
- PDF extraction works best with text-based PDFs. OCR for scanned documents is not included.
- Large papers may be truncated for summaries and comparisons; question answering retrieves up to five relevant chunks from the selected paper.
- Research-gap suggestions are not evidence that a gap is novel. Verify them through a broader literature search.
- This is a college-project starter, not a production deployment. The API currently allows cross-origin requests from any origin and does not provide authentication, persistent storage, or upload-size limits. Add appropriate protections before public hosting.

## Backend structure

- `backend\main.py` — FastAPI application and endpoints
- `backend\pdf_utils.py` — PDF text extraction
- `backend\ai_utils.py` — Groq calls, chunking, embeddings, and RAG retrieval
- `backend\paper_utils.py` — Summarization, question answering, comparison, and research-gap suggestions
- `backend\storage.py` — In-memory paper data
- `frontend\index.html`, `frontend\style.css`, `frontend\script.js` — User interface
