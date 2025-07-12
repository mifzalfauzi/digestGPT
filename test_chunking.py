#!/usr/bin/env python3
"""
Test script for document chunking and analysis functionality
"""

import requests
import json
import time

def test_chunking_functionality():
    """Test the chunking functionality with a long document"""
    
    print("🧠 Testing Document Chunking and Analysis System")
    print("=" * 60)
    
    # Create a long test document that will trigger chunking
    test_document = """
    This is a comprehensive test document designed to test the chunking functionality of the DocuChat system.
    
    The document analysis system should automatically detect when a document is too long and split it into manageable chunks.
    Each chunk should be analyzed separately by Claude 4 Sonnet, and the results should be combined intelligently.
    
    This paragraph contains important information about document processing capabilities.
    The system should be able to handle documents of various lengths and complexities.
    Key features include automatic chunking, parallel analysis, and intelligent result aggregation.
    
    There are several potential risks that should be identified during analysis.
    Large documents may take longer to process and could exceed API rate limits.
    Chunking might miss context between sections if not implemented carefully.
    Token limits could affect the quality of analysis for very long documents.
    
    Key concepts in this document include:
    - Document Chunking: The process of splitting large documents into smaller sections
    - Parallel Analysis: Analyzing multiple chunks simultaneously for efficiency
    - Result Aggregation: Combining insights from multiple chunks into a coherent analysis
    - Context Preservation: Maintaining document context across chunk boundaries
    
    This section discusses the technical implementation details of the chunking system.
    The system uses paragraph boundaries as primary splitting points to maintain context.
    When paragraphs are too long, the system falls back to sentence-level splitting.
    Overlap between chunks helps preserve context and avoid missing important information.
    
    The analysis process involves several steps:
    1. Document preprocessing and text extraction
    2. Word count calculation and chunking decision
    3. Chunk creation with appropriate overlap
    4. Parallel analysis of individual chunks
    5. Result aggregation and synthesis
    6. Final analysis presentation to the user
    
    Quality assurance measures include:
    - Duplicate detection and removal
    - Result ranking and prioritization
    - Context validation across chunks
    - Fallback mechanisms for failed analyses
    
    Performance considerations are important for large documents.
    The system should provide progress updates during analysis.
    Users should be informed about the chunking process and expected duration.
    Results should be cached to avoid re-analysis of the same content.
    
    Security and privacy considerations include:
    - Secure transmission of document content
    - Temporary storage of analysis results
    - Proper cleanup of sensitive data
    - Compliance with data protection regulations
    
    The user experience should be seamless regardless of document size.
    Short documents should be processed quickly without unnecessary chunking.
    Long documents should provide clear progress indicators.
    Results should be presented in a consistent format regardless of processing method.
    
    Future enhancements could include:
    - Adaptive chunking based on document structure
    - Machine learning for optimal chunk size determination
    - Advanced synthesis algorithms for better result combination
    - Real-time collaboration features for document analysis
    
    This concludes the test document content.
    The system should now process this document using the chunking functionality.
    """ * 5  # Repeat to make it longer
    
    print(f"📄 Test document created: {len(test_document)} characters")
    print(f"📊 Estimated word count: {len(test_document.split())}")
    
    try:
        print("\n🚀 Sending document for analysis...")
        start_time = time.time()
        
        response = requests.post(
            "http://localhost:8000/analyze-text",
            data={"text": test_document},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Analysis completed successfully!")
            print(f"⏱️ Processing time: {processing_time:.2f} seconds")
            
            # Display analysis metadata
            print(f"\n📊 Analysis Metadata:")
            print(f"  Document ID: {result.get('document_id')}")
            print(f"  Text Length: {result.get('text_length')}")
            print(f"  Word Count: {result.get('word_count')}")
            print(f"  Chunk Count: {result.get('chunk_count')}")
            print(f"  Analysis Method: {result.get('analysis_method')}")
            
            # Display analysis results
            analysis = result.get('analysis', {})
            print(f"\n📋 Analysis Results:")
            print(f"  Summary: {analysis.get('summary', 'N/A')}")
            print(f"  Key Points: {len(analysis.get('key_points', []))}")
            print(f"  Risk Flags: {len(analysis.get('risk_flags', []))}")
            print(f"  Key Concepts: {len(analysis.get('key_concepts', []))}")
            
            # Verify chunking worked
            if result.get('chunk_count', 1) > 1:
                print("\n✅ Chunking functionality working correctly!")
                print(f"   Document was split into {result.get('chunk_count')} chunks")
                
                if result.get('analysis_method') == 'chunked_with_synthesis':
                    print("   Final synthesis was performed for optimal results")
                elif result.get('analysis_method') == 'chunked':
                    print("   Results were aggregated from individual chunks")
            else:
                print("\nℹ️ Document was processed as a single chunk")
            
            # Display some key points
            key_points = analysis.get('key_points', [])
            if key_points:
                print(f"\n🔑 Sample Key Points:")
                for i, point in enumerate(key_points[:3]):
                    print(f"  {i+1}. {point.get('text', 'N/A')}")
            
            # Display some risk flags
            risk_flags = analysis.get('risk_flags', [])
            if risk_flags:
                print(f"\n🚩 Sample Risk Flags:")
                for i, risk in enumerate(risk_flags[:2]):
                    print(f"  {i+1}. {risk.get('text', 'N/A')}")
                    
        else:
            print(f"❌ Analysis failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error during analysis: {e}")

def test_short_document():
    """Test with a short document that shouldn't trigger chunking"""
    
    print("\n📝 Testing Short Document (No Chunking)")
    print("=" * 40)
    
    short_document = """
    This is a short test document that should not trigger chunking.
    
    It contains a few paragraphs with basic information.
    The system should process this document as a single unit.
    
    Key points include:
    - Short document processing
    - Single analysis approach
    - Quick response times
    
    This document should be analyzed quickly without any chunking overhead.
    """
    
    try:
        response = requests.post(
            "http://localhost:8000/analyze-text",
            data={"text": short_document},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Short document analysis completed!")
            print(f"  Word Count: {result.get('word_count')}")
            print(f"  Chunk Count: {result.get('chunk_count')}")
            print(f"  Analysis Method: {result.get('analysis_method')}")
            
            if result.get('chunk_count') == 1:
                print("✅ Correctly processed as single chunk")
            else:
                print("⚠️ Unexpectedly chunked short document")
        else:
            print(f"❌ Short document analysis failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing short document: {e}")

if __name__ == "__main__":
    # Test chunking functionality
    test_chunking_functionality()
    
    # Test short document
    test_short_document()
    
    print("\n🎉 Testing complete!") 