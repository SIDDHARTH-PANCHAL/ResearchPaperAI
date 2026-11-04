import fitz
from fastapi import HTTPException


def extract_pdf_pages(pdf_bytes):

    pages = []

    try:
        pdf_document = fitz.open(
            stream=pdf_bytes,
            filetype="pdf"
        )

        for page_number, page in enumerate(pdf_document, start=1):

            text = page.get_text("text").strip()

            if text:
                pages.append({
                    "page_number": page_number,
                    "text": text
                })

        pdf_document.close()

        if not pages:
            raise HTTPException(
                status_code=400,
                detail="PDF contains no extractable text. Scanned PDFs are not supported."
            )

        return pages

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Could not read PDF: {str(error)}"
        )