from fastapi import HTTPException

from ai_utils import generate_text, retrieve
from storage import papers


# =========================
# GET PAPER
# =========================

def get_paper(paper_id):

    paper = papers.get(paper_id)

    if paper is None:
        raise HTTPException(
            status_code=404,
            detail="Paper not found."
        )

    return paper


# =========================
# CREATE CONTEXT
# =========================

def create_context(chunks):

    context_parts = []

    for chunk in chunks:

        context_parts.append(
            f"[Page {chunk['page_number']}]\n{chunk['text']}"
        )

    return "\n\n".join(context_parts)


# =========================
# PAPER SUMMARY
# =========================

def summarize_paper(paper_id):

    paper = get_paper(paper_id)

    # Summary ke liye paper ke chunks ko use karenge.
    chunks = paper["chunks"]

    # Bahut bade papers ke liye context limit control.
    selected_chunks = chunks[:20]

    context = create_context(selected_chunks)

    prompt = f"""
You are an academic research assistant.

Summarize the following research paper in simple and clear language.

Include these sections:

1. Research Problem
2. Objective
3. Proposed Methodology
4. Dataset Used
5. Main Results
6. Conclusion
7. Limitations

Use only the information provided in the paper.
If any information is not available, clearly mention "Not specified in the paper".

Research Paper:
{context}
"""

    summary = generate_text(prompt)

    return {
        "paper_id": paper_id,
        "paper_title": paper["title"],
        "summary": summary
    }


# =========================
# QUESTION ANSWERING
# =========================

def answer_question(paper_id, question):

    paper = get_paper(paper_id)

    relevant_chunks = retrieve(
        query=question,
        paper_id=paper_id,
        top_k=5
    )

    if not relevant_chunks:
        raise HTTPException(
            status_code=400,
            detail="No relevant text found in the paper."
        )

    context = create_context(relevant_chunks)

    prompt = f"""
You are an academic research assistant.

Answer the user's question using ONLY the provided research paper context.

Rules:
- Do not invent facts.
- If the answer is not available, say so.
- Mention page numbers when possible.
- Keep the answer clear and understandable.

Research Paper: {paper['title']}

Context:
{context}

Question:
{question}
"""

    answer = generate_text(prompt)

    citations = []

    for chunk in relevant_chunks:

        citations.append({
            "page_number": chunk["page_number"],
            "text": chunk["text"][:300]
        })

    return {
        "paper_id": paper_id,
        "question": question,
        "answer": answer,
        "citations": citations
    }


# =========================
# COMPARE PAPERS
# =========================

def compare_papers(paper_ids):

    if len(paper_ids) < 2:
        raise HTTPException(
            status_code=400,
            detail="Please provide at least two paper IDs."
        )

    if len(paper_ids) > 5:
        raise HTTPException(
            status_code=400,
            detail="Maximum 5 papers can be compared at once."
        )

    paper_contexts = []

    for paper_id in paper_ids:

        paper = get_paper(paper_id)

        selected_chunks = paper["chunks"][:8]

        context = create_context(selected_chunks)

        paper_contexts.append(
            f"""
Paper Title: {paper['title']}

Content:
{context}
"""
        )

    all_context = "\n\n".join(paper_contexts)

    prompt = f"""
You are an academic research assistant.

Compare the following research papers.

Provide the comparison in these sections:

1. Research Problem
2. Objectives
3. Methodologies
4. Algorithms Used
5. Datasets
6. Results
7. Strengths
8. Limitations
9. Key Differences
10. Overall Comparison

Use only the provided paper content.
If information is missing, mention "Not specified".

Research Papers:
{all_context}
"""

    comparison = generate_text(prompt)

    return {
        "paper_ids": paper_ids,
        "comparison": comparison
    }


# =========================
# RESEARCH GAP FINDER
# =========================

def find_research_gaps(paper_id):

    paper = get_paper(paper_id)

    selected_chunks = paper["chunks"][:20]

    context = create_context(selected_chunks)

    prompt = f"""
You are an academic research assistant.

Analyze the following research paper and suggest possible research gaps.

Provide:

1. Existing Research Limitations
2. Possible Research Gaps
3. Potential Future Research Directions
4. Suggested Research Questions
5. Possible Improvements

Important:
- Do not claim that a gap is definitely unexplored.
- Treat research gaps as hypotheses that require literature review and verification.
- Use only the paper content for identifying its limitations.
- Clearly separate paper limitations from your suggested future research directions.

Research Paper:
{paper['title']}

Content:
{context}
"""

    gaps = generate_text(prompt)

    return {
        "paper_id": paper_id,
        "paper_title": paper["title"],
        "research_gaps": gaps,
        "note": "AI-generated research gap suggestions should be manually verified."
    }