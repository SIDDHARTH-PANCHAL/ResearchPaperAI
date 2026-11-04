import os
from dotenv import load_dotenv
from fastapi import HTTPException
from groq import Groq
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss

load_dotenv()

# =========================
# GROQ API CONFIGURATION
# =========================

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


# =========================
# EMBEDDING MODEL
# =========================


# =========================
# EMBEDDING MODEL
# =========================

embedding_model = None


def get_embedding_model():
    global embedding_model

    if embedding_model is None:
        print("Loading Sentence Transformer model...")

        embedding_model = SentenceTransformer(
            "all-MiniLM-L6-v2"
        )

        print("Sentence Transformer model loaded!")

    return embedding_model



# =========================
# GENERATE AI TEXT
# =========================

def generate_text(prompt: str) -> str:

    if groq_client is None:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY missing. Please add it to backend/.env"
        )

    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an academic research assistant. "
                        "Answer accurately using the provided research paper context. "
                        "Do not invent facts or citations."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2
        )

        answer = response.choices[0].message.content

        if not answer:
            return "No response generated."

        return answer.strip()

    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"Groq API error: {str(error)}"
        )


# =========================
# TEXT CHUNKING
# =========================

def split_into_chunks(pages, chunk_size=1000, overlap=200):

    chunks = []

    for page in pages:

        text = page["text"]
        page_number = page["page_number"]

        start = 0

        while start < len(text):

            end = start + chunk_size

            chunk_text = text[start:end].strip()

            if chunk_text:
                chunks.append({
                    "text": chunk_text,
                    "page_number": page_number
                })

            start += chunk_size - overlap

    return chunks


# =========================
# GENERATE EMBEDDINGS
# =========================


# =========================
# GENERATE EMBEDDINGS
# =========================

def embed_texts(texts):

    if not texts:
        return np.empty((0, 384), dtype="float32")

    model = get_embedding_model()

    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False
    )

    return np.asarray(
        embeddings,
        dtype="float32"
    )


# =========================
# CREATE FAISS INDEX
# =========================

def create_faiss_index(embeddings):

    if len(embeddings) == 0:
        return None

    dimension = embeddings.shape[1]

    index = faiss.IndexFlatIP(dimension)

    index.add(embeddings)

    return index


# =========================
# RETRIEVE RELEVANT CHUNKS
# =========================

def retrieve(query, paper_id, top_k=5):

    from storage import papers

    paper = papers.get(paper_id)

    if paper is None:
        raise HTTPException(
            status_code=404,
            detail="Paper not found."
        )

    index = paper.get("index")
    chunks = paper.get("chunks", [])

    if index is None or not chunks:
        return []

    query_embedding = embed_texts([query])

    scores, indices = index.search(
        query_embedding,
        min(top_k, len(chunks))
    )

    results = []

    for score, index_position in zip(scores[0], indices[0]):

        if index_position == -1:
            continue

        chunk = chunks[index_position]

        results.append({
            "text": chunk["text"],
            "page_number": chunk["page_number"],
            "score": float(score)
        })

    return results