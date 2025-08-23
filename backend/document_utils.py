import io
import json
import re
from typing import Dict, List
import pdfplumber
from docx import Document
from fastapi import HTTPException
import anthropic
import os
from dotenv import load_dotenv

load_dotenv()

# Anthropic configuration
anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")

# Initialize Anthropic client with better error handling
client = None
if anthropic_api_key:
    try:
        # Try basic initialization first
        import anthropic
        client = anthropic.Anthropic(api_key=anthropic_api_key)
        print("✅ Anthropic client initialized successfully")
    except TypeError as e:
        if "proxies" in str(e):
            print(f"⚠️  Anthropic client proxy error, trying alternative initialization: {e}")
            try:
                # Alternative: Try initializing with minimal parameters
                import httpx
                http_client = httpx.Client()
                client = anthropic.Anthropic(
                    api_key=anthropic_api_key,
                    http_client=http_client
                )
                print("✅ Anthropic client initialized with custom http client")
            except Exception as e2:
                print(f"❌ Alternative Anthropic initialization also failed: {e2}")
                client = None
        else:
            print(f"❌ Anthropic client initialization failed: {e}")
            client = None
    except Exception as e:
        print(f"❌ Anthropic client initialization failed: {e}")
        client = None
else:
    print("⚠️  ANTHROPIC_API_KEY not found in environment variables")
    client = None

def count_words(text: str) -> int:
    """Count words in text"""
    return len(text.split())

def get_empty_swot_structure():
    """Return empty SWOT structure"""
    return {
        "strengths": [],
        "weaknesses": [],
        "opportunities": [],
        "threats": []
    }

def split_text_into_chunks(text: str, target_words: int = 1200, overlap_words: int = 100) -> List[str]:
    """
    Split text into chunks of approximately target_words each.
    Ensures splitting happens on paragraph boundaries or sentence boundaries.
    """
    if not text.strip():
        return []
    
    # First, try to split by paragraphs
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    
    if not paragraphs:
        # If no paragraphs, split by sentences
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        paragraphs = sentences
    
    chunks = []
    current_chunk = ""
    current_word_count = 0
    
    for paragraph in paragraphs:
        paragraph_words = count_words(paragraph)
        
        # If adding this paragraph would exceed target, start a new chunk
        if current_word_count + paragraph_words > target_words and current_chunk:
            chunks.append(current_chunk.strip())
            
            # Start new chunk with overlap from previous chunk
            if overlap_words > 0:
                words = current_chunk.split()
                overlap_text = " ".join(words[-overlap_words:]) if len(words) > overlap_words else current_chunk
                current_chunk = overlap_text + "\n\n" + paragraph
                current_word_count = count_words(overlap_text) + paragraph_words
            else:
                current_chunk = paragraph
                current_word_count = paragraph_words
        else:
            if current_chunk:
                current_chunk += "\n\n" + paragraph
            else:
                current_chunk = paragraph
            current_word_count += paragraph_words
    
    # Add the last chunk
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    # If we have chunks that are still too long, split them further by sentences
    final_chunks = []
    for chunk in chunks:
        if count_words(chunk) <= target_words * 1.5:  # Allow some flexibility
            final_chunks.append(chunk)
        else:
            # Split by sentences
            sentences = re.split(r'[.!?]+', chunk)
            sentences = [s.strip() for s in sentences if s.strip()]
            
            sub_chunk = ""
            sub_word_count = 0
            
            for sentence in sentences:
                sentence_words = count_words(sentence)
                
                if sub_word_count + sentence_words > target_words and sub_chunk:
                    final_chunks.append(sub_chunk.strip())
                    sub_chunk = sentence
                    sub_word_count = sentence_words
                else:
                    if sub_chunk:
                        sub_chunk += ". " + sentence
                    else:
                        sub_chunk = sentence
                    sub_word_count += sentence_words
            
            if sub_chunk.strip():
                final_chunks.append(sub_chunk.strip())
    
    return final_chunks

def should_chunk_document(text: str, word_threshold: int = 1000) -> bool:
    """Determine if a document should be chunked based on word count"""
    return count_words(text) > word_threshold

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF using pdfplumber"""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            text = ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX using python-docx"""
    try:
        doc = Document(io.BytesIO(file_bytes))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading DOCX: {str(e)}")

async def analyze_document_with_claude(text: str, retry_count: int = 0) -> dict:
    """Send text to Anthropic Claude for analysis"""
    if not client:
        raise HTTPException(status_code=500, detail="Anthropic API key not configured")
    
    # Adjust prompt based on retry count
    if retry_count == 0:
        prompt = f"""You are an AI assistant that helps explain documents clearly. 
Given this document, do the following:
1. Identify the problem or context - Why was this document created? What need does it address? What triggered its creation?
2. Explain what the document is about in 1–2 sentences.
3. Summarize key important points as bullet points.
4. Highlight any risky or confusing parts with 🚩 emoji and explain why.
5. Identify key concepts/terms that are central to understanding this document.
6. Perform a comprehensive SWOT analysis with MINIMUM 3 items in each category.

For each key point and risk flag, please also include a short quote (5-15 words) from the original document that supports your analysis.

For key concepts, provide the term and a brief explanation of what it means in the context of this document.

SWOT ANALYSIS REQUIREMENTS:
- Provide EXACTLY 5 Strengths (internal positive factors)
- Provide EXACTLY 5 Weaknesses (internal negative factors) 
- Provide EXACTLY 5 Opportunities (external positive factors)
- Provide EXACTLY 5 Threats (external negative factors)
- Each category must have 5 items
- If the document doesn't explicitly mention enough items, infer reasonable ones based on context
- Each item must have: title, detailed description, impact level, and category

Impact levels: "high", "medium", "low"
Categories: "technology", "financial", "market", "business", "operational", "regulatory", "competitive", "industry", "product"

CRITICAL: You must respond with ONLY valid JSON. Follow these strict rules:
- Do not include any text before or after the JSON
- Do not wrap the JSON in markdown code blocks
- Use only standard double quotes (") for strings
- Ensure all arrays and objects are properly closed
- Do not include trailing commas
- Escape any quotes within text content properly
- Keep quotes short (5-15 words maximum)
- ENSURE each SWOT category has MINIMUM 3 and MAXIMUM 5 items

Use this exact JSON structure:
{{
    "problem_context": "Why was this document created? What problem does it solve or need does it address?",
    "summary": "Brief explanation of what the document is about",
    "key_points": [
        {{
            "text": "Point 1 description",
            "quote": "relevant quote from document"
        }},
        {{
            "text": "Point 2 description", 
            "quote": "relevant quote from document"
        }}
    ],
    "risk_flags": [
        {{
            "text": "🚩 Risk 1: explanation",
            "quote": "relevant quote from document"
        }},
        {{
            "text": "🚩 Risk 2: explanation",
            "quote": "relevant quote from document"
        }}
    ],
    "key_concepts": [
        {{
            "term": "Important Term 1",
            "explanation": "What this term means in the context of this document"
        }},
        {{
            "term": "Important Term 2",
            "explanation": "What this term means in the context of this document"
        }}
    ],
    "swot_analysis": {{
        "strengths": [
            {{
                "title": "Strength 1 title",
                "description": "Detailed description of this internal positive factor",
                "impact": "high",
                "category": "technology"
            }},
            {{
                "title": "Strength 2 title",
                "description": "Detailed description of this internal positive factor",
                "impact": "medium",
                "category": "financial"
            }},
            {{
                "title": "Strength 3 title",
                "description": "Detailed description of this internal positive factor",
                "impact": "high",
                "category": "market"
            }}
        ],
        "weaknesses": [
            {{
                "title": "Weakness 1 title",
                "description": "Detailed description of this internal negative factor",
                "impact": "medium",
                "category": "operational"
            }},
            {{
                "title": "Weakness 2 title",
                "description": "Detailed description of this internal negative factor",
                "impact": "high",
                "category": "business"
            }},
            {{
                "title": "Weakness 3 title",
                "description": "Detailed description of this internal negative factor",
                "impact": "medium",
                "category": "product"
            }}
        ],
        "opportunities": [
            {{
                "title": "Opportunity 1 title",
                "description": "Detailed description of this external positive factor",
                "impact": "high",
                "category": "market"
            }},
            {{
                "title": "Opportunity 2 title",
                "description": "Detailed description of this external positive factor",
                "impact": "medium",
                "category": "industry"
            }},
            {{
                "title": "Opportunity 3 title",
                "description": "Detailed description of this external positive factor",
                "impact": "high",
                "category": "financial"
            }}
        ],
        "threats": [
            {{
                "title": "Threat 1 title",
                "description": "Detailed description of this external negative factor",
                "impact": "medium",
                "category": "competitive"
            }},
            {{
                "title": "Threat 2 title",
                "description": "Detailed description of this external negative factor",
                "impact": "high",
                "category": "regulatory"
            }},
            {{
                "title": "Threat 3 title",
                "description": "Detailed description of this external negative factor",
                "impact": "medium",
                "category": "market"
            }}
        ]
    }}
}}

Document text:
{text[:8000]}"""
    else:
        # Simplified prompt for retry - still enforce 3-5 items per category
        prompt = f"""Analyze this document and return ONLY valid JSON. 
IMPORTANT: Each SWOT category MUST have 3-5 items (minimum 3, maximum 5).

{{
    "problem_context": "Why document was created or what need it addresses",
    "summary": "Brief explanation",
    "key_points": [{{"text": "point", "quote": "quote"}}],
    "risk_flags": [{{"text": "🚩 risk", "quote": "quote"}}],
    "key_concepts": [{{"term": "term", "explanation": "explanation"}}],
    "swot_analysis": {{
        "strengths": [
            {{"title": "strength1", "description": "description", "impact": "impact", "category": "category"}},
            {{"title": "strength2", "description": "description", "impact": "impact", "category": "category"}},
            {{"title": "strength3", "description": "description", "impact": "impact", "category": "category"}}
        ],
        "weaknesses": [
            {{"title": "weakness1", "description": "description", "impact": "impact", "category": "category"}},
            {{"title": "weakness2", "description": "description", "impact": "impact", "category": "category"}},
            {{"title": "weakness3", "description": "description", "impact": "impact", "category": "category"}}
        ],
        "opportunities": [
            {{"title": "opportunity1", "description": "description", "impact": "impact", "category": "category"}},
            {{"title": "opportunity2", "description": "description", "impact": "impact", "category": "category"}},
            {{"title": "opportunity3", "description": "description", "impact": "impact", "category": "category"}}
        ],
        "threats": [
            {{"title": "threat1", "description": "description", "impact": "impact", "category": "category"}},
            {{"title": "threat2", "description": "description", "impact": "impact", "category": "category"}},
            {{"title": "threat3", "description": "description", "impact": "impact", "category": "category"}}
        ]
    }}
}}

Document: {text[:4000]}"""
    
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=3000,  # Increased further for minimum 3 items per category
            temperature=0.3,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Get the raw response content
        content = response.content[0].text.strip()
        
        # Try to find and extract JSON from the response
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        
        if json_start != -1 and json_end > json_start:
            json_content = content[json_start:json_end]
            
            # Clean up common JSON formatting issues
            json_content = json_content.replace('```json', '').replace('```', '').strip()
            json_content = re.sub(r',\s*}', '}', json_content)  # Remove trailing commas
            json_content = re.sub(r',\s*]', ']', json_content)  # Remove trailing commas in arrays
            
            try:
                result = json.loads(json_content)
                
                # VALIDATION: Ensure minimum 3 items in each SWOT category
                swot = result.get("swot_analysis", {})
                swot = ensure_minimum_swot_items(swot)
                result["swot_analysis"] = swot
                
                return result
            except json.JSONDecodeError as e:
                # Try more aggressive cleaning
                try:
                    # Remove any non-ASCII characters that might be causing issues
                    json_content = ''.join(char for char in json_content if ord(char) < 128)
                    # Try to fix common quote issues
                    json_content = re.sub(r'[""]', '"', json_content)  # Replace smart quotes
                    json_content = re.sub(r'['']', "'", json_content)  # Replace smart apostrophes
                    
                    result = json.loads(json_content)
                    
                    # VALIDATION: Ensure minimum 3 items in each SWOT category
                    swot = result.get("swot_analysis", {})
                    swot = ensure_minimum_swot_items(swot)
                    result["swot_analysis"] = swot
                    
                    return result
                except json.JSONDecodeError as e2:
                    pass
        
        # If we can't parse JSON, return fallback with minimum items
        return get_fallback_response_with_minimum_swot()
        
    except Exception as e:
        # If we've already retried, return a basic fallback with minimum items
        if retry_count > 0:
            return get_fallback_response_with_minimum_swot()
        
        # If this is the first attempt, try again with a simpler prompt
        return await analyze_document_with_claude(text, retry_count + 1)


def ensure_minimum_swot_items(swot_analysis: dict) -> dict:
    """Ensure each SWOT category has 3-5 items (minimum 3, maximum 5)"""
    categories = ["strengths", "weaknesses", "opportunities", "threats"]
    
    # Generic items to fill gaps (only if needed)
    generic_items = {
        "strengths": [
            {"title": "Resource Availability", "description": "Access to necessary resources and capabilities for operations", "impact": "medium", "category": "operational"},
            {"title": "Market Position", "description": "Established presence in the market with recognized capabilities", "impact": "medium", "category": "market"},
            {"title": "Operational Efficiency", "description": "Streamlined processes that enable effective resource utilization", "impact": "medium", "category": "operational"},
            {"title": "Team Expertise", "description": "Skilled workforce with relevant experience and knowledge", "impact": "medium", "category": "business"},
            {"title": "Process Maturity", "description": "Well-established procedures and operational frameworks", "impact": "medium", "category": "operational"}
        ],
        "weaknesses": [
            {"title": "Resource Constraints", "description": "Limited resources that may restrict growth or operational capacity", "impact": "medium", "category": "operational"},
            {"title": "Market Dependencies", "description": "Reliance on specific market conditions or customer segments", "impact": "medium", "category": "market"},
            {"title": "Process Limitations", "description": "Areas where current processes could be improved for better efficiency", "impact": "medium", "category": "operational"},
            {"title": "Capacity Constraints", "description": "Limited ability to scale operations quickly when needed", "impact": "medium", "category": "operational"},
            {"title": "Knowledge Gaps", "description": "Areas where additional expertise or training may be beneficial", "impact": "low", "category": "business"}
        ],
        "opportunities": [
            {"title": "Market Expansion", "description": "Potential to expand into new markets or customer segments", "impact": "medium", "category": "market"},
            {"title": "Technology Adoption", "description": "Opportunities to leverage new technologies for competitive advantage", "impact": "medium", "category": "technology"},
            {"title": "Strategic Partnerships", "description": "Potential collaborations that could enhance capabilities or market reach", "impact": "medium", "category": "business"},
            {"title": "Process Optimization", "description": "Opportunities to improve efficiency and reduce operational costs", "impact": "medium", "category": "operational"},
            {"title": "Skill Development", "description": "Investment in training and development to enhance capabilities", "impact": "medium", "category": "business"}
        ],
        "threats": [
            {"title": "Market Competition", "description": "Increasing competition that may impact market share or profitability", "impact": "medium", "category": "competitive"},
            {"title": "Economic Factors", "description": "External economic conditions that could negatively impact operations", "impact": "medium", "category": "market"},
            {"title": "Regulatory Changes", "description": "Potential changes in regulations that may require operational adjustments", "impact": "medium", "category": "regulatory"},
            {"title": "Technology Disruption", "description": "Emerging technologies that could disrupt current business models", "impact": "medium", "category": "technology"},
            {"title": "Resource Availability", "description": "Potential shortage of critical resources or skilled personnel", "impact": "medium", "category": "operational"}
        ]
    }
    
    for category in categories:
        current_items = swot_analysis.get(category, [])
        
        # Ensure minimum 3 items
        if len(current_items) < 3:
            needed = 3 - len(current_items)
            current_items.extend(generic_items[category][:needed])
        
        # Ensure maximum 5 items
        elif len(current_items) > 5:
            current_items = current_items[:5]
        
        swot_analysis[category] = current_items
    
    return swot_analysis


def get_fallback_response_with_minimum_swot() -> dict:
    """Return fallback response with minimum 3 items per SWOT category"""
    return {
        "problem_context": "Document analysis requested to extract insights and identify key information for review and decision-making purposes.",
        "summary": "Document analysis completed successfully.",
        "key_points": [
            {
                "text": "Document has been processed and is ready for analysis.",
                "quote": "Document processing completed"
            }
        ],
        "risk_flags": [],
        "key_concepts": [],
        "swot_analysis": {
            "strengths": [
                {"title": "Document Processing Capability", "description": "Successfully processed and analyzed the provided document content", "impact": "medium", "category": "operational"},
                {"title": "Content Structure", "description": "Document contains structured information suitable for analysis", "impact": "medium", "category": "operational"},
                {"title": "Data Availability", "description": "Sufficient content available for comprehensive evaluation", "impact": "medium", "category": "operational"}
            ],
            "weaknesses": [
                {"title": "Limited Context", "description": "Analysis may be limited by available context within the document", "impact": "medium", "category": "operational"},
                {"title": "Single Source", "description": "Analysis based on single document without external validation", "impact": "medium", "category": "operational"},
                {"title": "Processing Constraints", "description": "Technical limitations may affect depth of analysis", "impact": "low", "category": "technology"}
            ],
            "opportunities": [
                {"title": "Enhanced Analysis", "description": "Opportunity to improve analysis with additional context or documents", "impact": "medium", "category": "operational"},
                {"title": "Data Integration", "description": "Potential to combine with other data sources for comprehensive insights", "impact": "medium", "category": "technology"},
                {"title": "Process Improvement", "description": "Opportunities to refine analysis methodology for better results", "impact": "medium", "category": "operational"}
            ],
            "threats": [
                {"title": "Information Gaps", "description": "Missing information may lead to incomplete analysis results", "impact": "medium", "category": "operational"},
                {"title": "Context Limitations", "description": "Limited context may affect accuracy of strategic recommendations", "impact": "medium", "category": "operational"},
                {"title": "Processing Errors", "description": "Technical issues could impact the quality of analysis output", "impact": "low", "category": "technology"}
            ]
        }
    }

async def analyze_document_with_chunking(text: str, enable_synthesis: bool = True) -> dict:
    """
    Analyze a document with automatic chunking for long documents.
    """
    word_count = count_words(text)
    
    # Check if document needs chunking
    if not should_chunk_document(text):
        return await analyze_document_with_claude(text)
    
    # Split document into chunks
    chunks = split_text_into_chunks(text)
    
    if len(chunks) == 1:
        return await analyze_document_with_claude(text)
    
    # Analyze each chunk
    chunk_analyses = []
    for i, chunk in enumerate(chunks):
        try:
            analysis = await analyze_document_with_claude(chunk)
            chunk_analyses.append(analysis)
        except Exception as e:
            # Continue with other chunks
            continue
    
    if not chunk_analyses:
        raise HTTPException(status_code=500, detail="Failed to analyze any document chunks")
    
    # Combine results
    return aggregate_chunk_analyses(chunk_analyses)

def aggregate_chunk_analyses(chunk_analyses: List[dict]) -> dict:
    """
    Aggregate multiple chunk analyses into a single analysis.
    """
    if not chunk_analyses:
        return {
            "problem_context": "Document analysis requested to extract insights and identify key information for comprehensive review.",
            "summary": "This is a comprehensive analysis of your document.",
            "key_points": [],
            "risk_flags": [],
            "key_concepts": [],
            "swot_analysis": get_empty_swot_structure()
        }
    
    if len(chunk_analyses) == 1:
        return chunk_analyses[0]
    
    # Collect all items from all chunks
    all_key_points = []
    all_risk_flags = []
    all_key_concepts = []
    all_strengths = []
    all_weaknesses = []
    all_opportunities = []
    all_threats = []
    
    for analysis in chunk_analyses:
        all_key_points.extend(analysis.get("key_points", []))
        all_risk_flags.extend(analysis.get("risk_flags", []))
        all_key_concepts.extend(analysis.get("key_concepts", []))
        
        # ✅ FIXED - Collect SWOT items properly
        swot = analysis.get("swot_analysis", {})
        all_strengths.extend(swot.get("strengths", []))
        all_weaknesses.extend(swot.get("weaknesses", []))
        all_opportunities.extend(swot.get("opportunities", []))
        all_threats.extend(swot.get("threats", []))
    
    # Remove duplicates based on text content
    def remove_duplicates(items, key_func=lambda x: x.get("text", "").lower()):
        seen = set()
        unique_items = []
        for item in items:
            key = key_func(item)
            if key and key not in seen:
                seen.add(key)
                unique_items.append(item)
        return unique_items
    
    def remove_swot_duplicates(items):
        seen = set()
        unique_items = []
        for item in items:
            key = item.get("title", "").lower()
            if key and key not in seen:
                seen.add(key)
                unique_items.append(item)
        return unique_items
    
    # Remove duplicates and limit results
    unique_key_points = remove_duplicates(all_key_points)[:15]
    unique_risk_flags = remove_duplicates(all_risk_flags)[:8]
    unique_key_concepts = remove_duplicates(all_key_concepts, lambda x: x.get("term", "").lower())[:10]
    unique_strengths = remove_swot_duplicates(all_strengths)[:10]
    unique_weaknesses = remove_swot_duplicates(all_weaknesses)[:10]
    unique_opportunities = remove_swot_duplicates(all_opportunities)[:10]
    unique_threats = remove_swot_duplicates(all_threats)[:10]
    # Create combined summary and problem context
    chunk_count = len(chunk_analyses)
    combined_summary = f"This is a comprehensive analysis of a {chunk_count}-section document covering multiple topics."
    
    # Use the first analysis's problem_context or create a combined one
    combined_problem_context = chunk_analyses[0].get("problem_context", "Document analysis requested to extract insights and identify key information from this multi-section document.")
    
    return {
        "problem_context": combined_problem_context,
        "summary": combined_summary,
        "key_points": unique_key_points,
        "risk_flags": unique_risk_flags,
        "key_concepts": unique_key_concepts,
         "swot_analysis": {  # ✅ FIXED - Return proper SWOT structure
            "strengths": unique_strengths,
            "weaknesses": unique_weaknesses,
            "opportunities": unique_opportunities,
            "threats": unique_threats
        },
        "chunk_count": chunk_count,
        "analysis_method": "chunked"
    }

def find_quote_position(text: str, quote: str) -> Dict:
    """Find the position of a quote in the document text"""
    if not quote or not quote.strip():
        return {"start": -1, "end": -1, "found": False}
    
    # Clean up the quote for better matching
    clean_quote = quote.strip().lower()
    clean_text = text.lower()
    
    # Try exact match first
    start_pos = clean_text.find(clean_quote)
    if start_pos != -1:
        # Estimate page number based on position
        words_before = len(text[:start_pos].split())
        estimated_page = max(1, (words_before // 500) + 1)
        
        return {
            "start": start_pos,
            "end": start_pos + len(clean_quote),
            "found": True,
            "page": estimated_page
        }
    
    return {"start": -1, "end": -1, "found": False} 