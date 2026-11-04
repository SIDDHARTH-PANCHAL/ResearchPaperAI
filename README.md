# Research Paper Intelligence & Innovation Finder

A beginner-friendly full-stack GenAI minor project using:
- Frontend: HTML, CSS, JavaScript
- Backend: FastAPI
- LLM: Gemini API (free tier, subject to provider limits)
- RAG: Sentence Transformers + FAISS
- PDF extraction: PyMuPDF

## Features
1. Upload multiple PDF research papers.
2. Extract text page-by-page and create searchable chunks.
3. Summarize a selected paper.
4. Ask questions across uploaded papers using RAG.
5. Compare uploaded papers.
6. Suggest possible research gaps (AI suggestions; verify them manually).
7. Display retrieved source passages and page numbers.

## Requirements
- Windows 10/11
- Python 3.10 or 3.11 recommended
- Internet connection for Gemini API and first-time embedding-model download
- Google Gemini API key from https://aistudio.google.com/

## Setup (Windows / VS Code)

### 1. Open project folder
Extract the ZIP and open `ResearchPaperAI` in VS Code.

### 2. Create virtual environment
Open VS Code terminal in the project root:

```powershell
python -m venv .venv
.venv\Scripts\activate
```

If PowerShell blocks activation, use:
```powershell
.venv\Scripts\python.exe -m pip install --upgrade pip
```
You can also run commands using `.venv\Scripts\python.exe` without activating.

### 3. Install packages
```powershell
python -m pip install -r backend\requirements.txt
```

### 4. Configure Gemini API
Copy `backend\.env.example` to `backend\.env` and add your key:
```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```
The model name is configurable. If Google AI Studio no longer offers this model to your account, replace it with an available model ID from AI Studio.

**Never put the API key in frontend JavaScript or commit the `.env` file.**

### 5. Start FastAPI
```powershell
cd backend
python -m uvicorn main:app --reload
```
Backend: http://127.0.0.1:8000  
API docs: http://127.0.0.1:8000/docs

### 6. Start frontend
In VS Code, install the **Live Server** extension if needed.
- Right-click `frontend/index.html`
- Choose **Open with Live Server**
- Usually frontend opens at `http://127.0.0.1:5500`

The backend CORS configuration allows localhost ports 5500 and 5501. If Live Server uses a different port, update `allow_origins` in `backend/main.py`.

## How to use
1. Upload one or more research-paper PDFs.
2. Wait until processing finishes.
3. Select a paper and click **Summarize**.
4. Ask questions in the chat; retrieved snippets and page references appear below the answer.
5. Use **Compare Papers** or **Find Research Gaps**.

## Notes / limitations
- The vector index and uploaded-paper metadata are stored in memory. Restarting the backend clears uploaded papers; upload them again.
- Gemini free-tier quotas and model availability can change. API calls may fail when quotas are exhausted.
- Research-gap output is a hypothesis generator, not proof that a gap is novel. Verify claims through a wider literature review.
- PDF extraction works best with text-based PDFs. Scanned PDFs may need OCR, which is not included in this starter version.
- Keep paper uploads within the API/model and local resource limits. The code sends only relevant retrieved chunks to Gemini for Q&A.
- This is a college-project starter, not a production deployment. Add authentication, file-size limits, persistence, and stronger security before public hosting.


## Beginner-friendly backend structure
The original frontend, API paths, request/response format, and core prompts are preserved. Only backend responsibilities are separated:

- `main.py` — FastAPI routes/endpoints
- `pdf_utils.py` — PDF text extraction
- `ai_utils.py` — Gemini, chunking, embeddings, and RAG retrieval
- `paper_utils.py` — paper summary, comparison, research gaps
- `storage.py` — shared paper data and FAISS index

Start the backend from the `backend` directory with the same command:
`python -m uvicorn main:app --reload`
