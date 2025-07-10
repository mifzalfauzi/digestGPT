Build a full-stack web app where users can upload a PDF or DOCX document, and the backend uses OpenAI's GPT-4 to:
1. Summarize what the document is about.
2. List key important points.
3. Flag risky or confusing clauses using 🚩 emojis.

### Requirements:

🖥 Frontend:
- A clean single-page app (React)
- A file upload input (PDF or DOCX)
- Optionally: a text area to paste content instead
- A "Submit" button
- A results section showing:
  - Summary
  - Key Points
  - Risk Flags 🚩
- Add loading spinner while waiting for GPT response

🧠 Backend:
- Use Python with FastAPI or Flask (your choice)
- Accept file uploads and parse the text from:
  - PDFs using `pdfplumber` or `PyMuPDF`
  - DOCX using `python-docx`
- If file can't be read, return an error
- Send parsed text to OpenAI API using GPT-4 with a prompt like:

"""
You are an AI assistant that helps explain documents clearly. 
Given this document, do the following:
1. Explain what the document is about in 1–2 sentences.
2. Summarize key important points as bullet points.
3. Highlight any risky or confusing parts with 🚩 emoji and explain why.
"""

- Return the GPT response to the frontend as JSON

🔐 Extra (optional):
- Add usage tracking (one per IP/day)
- Add a basic API key check or password for protection

📦 Bonus:
- Show how to deploy the backend to Render.com
- Host frontend on Vercel

Use minimal dependencies. The code should be clean, modular, and readable. Create the entire project structure.

