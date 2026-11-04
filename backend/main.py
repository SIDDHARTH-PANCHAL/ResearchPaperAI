import uuid

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from pdf_utils import extract_pdf_pages

from ai_utils import (
    split_into_chunks,
    embed_texts,
    create_faiss_index
)

from paper_utils import (
    summarize_paper,
    answer_question,
    compare_papers,
    find_research_gaps
)

from storage import papers


# =========================
# FASTAPI APPLICATION
# =========================

app = FastAPI(
    title="Research Paper Intelligence & Innovation Finder",
    description="AI-powered research paper analysis using RAG and Groq.",
    version="1.0.0"
)


# =========================
# CORS CONFIGURATION
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# REQUEST MODELS
# =========================

class QuestionRequest(BaseModel):

    paper_id: str

    question: str = Field(
        min_length=1,
        max_length=2000
    )


class CompareRequest(BaseModel):

    paper_ids: list[str] = Field(
        min_length=2,
        max_length=5
    )


# =========================
# HOME ROUTE
# =========================

@app.get("/")
def home():

    return {
        "message": "Research Paper Intelligence API is running!",
        "docs": "/docs"
    }


# =========================
# UPLOAD PDF
# =========================

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Please select a PDF file."
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed."
        )

    pdf_bytes = await file.read()

    if not pdf_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )

    # Extract text from PDF
    pages = extract_pdf_pages(pdf_bytes)

    # Split extracted text into chunks
    chunks = split_into_chunks(pages)

    if not chunks:
        raise HTTPException(
            status_code=400,
            detail="Could not create text chunks from PDF."
        )

    # Generate embeddings
    texts = [chunk["text"] for chunk in chunks]

    embeddings = embed_texts(texts)

    # Create FAISS index
    index = create_faiss_index(embeddings)

    # Generate unique paper ID
    paper_id = str(uuid.uuid4())

    # Store paper temporarily
    papers[paper_id] = {
        "paper_id": paper_id,
        "title": file.filename,
        "filename": file.filename,
        "pages": pages,
        "chunks": chunks,
        "index": index
    }

    return {
        "message": "PDF uploaded and processed successfully!",
        "paper_id": paper_id,
        "paper_title": file.filename,
        "total_pages": len(pages),
        "total_chunks": len(chunks)
    }


# =========================
# GET ALL PAPERS
# =========================

@app.get("/papers")
def get_all_papers():

    result = []

    for paper_id, paper in papers.items():

        result.append({
            "paper_id": paper_id,
            "title": paper["title"],
            "total_pages": len(paper["pages"]),
            "total_chunks": len(paper["chunks"])
        })

    return {
        "total_papers": len(result),
        "papers": result
    }


# =========================
# DELETE PAPER
# =========================

@app.delete("/papers/{paper_id}")
def delete_paper(paper_id: str):

    if paper_id not in papers:
        raise HTTPException(
            status_code=404,
            detail="Paper not found."
        )

    del papers[paper_id]

    return {
        "message": "Paper deleted successfully.",
        "paper_id": paper_id
    }


# =========================
# SUMMARIZE PAPER
# =========================

@app.post("/summary/{paper_id}")
def get_summary(paper_id: str):

    return summarize_paper(paper_id)


# =========================
# ASK QUESTION
# =========================

@app.post("/ask")
def ask_question(request: QuestionRequest):

    return answer_question(
        paper_id=request.paper_id,
        question=request.question
    )


# =========================
# COMPARE PAPERS
# =========================

@app.post("/compare")
def compare_research_papers(request: CompareRequest):

    return compare_papers(
        paper_ids=request.paper_ids
    )


# =========================
# FIND RESEARCH GAPS
# =========================

@app.post("/research-gaps/{paper_id}")
def research_gaps(paper_id: str):

    return find_research_gaps(paper_id)