#!/usr/bin/env python3
"""
Test script to verify improved summary generation
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.append('backend')

from main import analyze_document_with_claude, aggregate_chunk_analyses

async def test_summary_generation():
    """Test that summaries are user-friendly and not technical"""
    
    print("Testing improved summary generation...")
    
    # Test 1: Simple document
    simple_text = """
    This is a test document about artificial intelligence and machine learning.
    The document discusses various AI techniques including neural networks, 
    deep learning, and natural language processing. It also covers the 
    applications of AI in healthcare, finance, and transportation.
    """
    
    print("\n1. Testing simple document analysis...")
    try:
        result = await analyze_document_with_claude(simple_text)
        print(f"Summary: {result.get('summary', 'No summary')}")
        print(f"Key points: {len(result.get('key_points', []))}")
        print(f"Risk flags: {len(result.get('risk_flags', []))}")
        print(f"Key concepts: {len(result.get('key_concepts', []))}")
        
        # Check that summary doesn't contain technical error messages
        summary = result.get('summary', '').lower()
        bad_phrases = ['raw response', 'could not be parsed', 'json', 'error', 'failed']
        has_bad_phrases = any(phrase in summary for phrase in bad_phrases)
        
        if has_bad_phrases:
            print("❌ FAILED: Summary contains technical error messages")
            return False
        else:
            print("✅ PASSED: Summary is user-friendly")
            
    except Exception as e:
        print(f"❌ FAILED: Error in simple document analysis: {e}")
        return False
    
    # Test 2: Chunked document aggregation
    print("\n2. Testing chunked document aggregation...")
    
    # Simulate chunk analyses with problematic summaries
    chunk_analyses = [
        {
            "summary": "Document analyzed in 1 sections. Raw response could not be parsed as JSON.",
            "key_points": [
                {"text": "AI is transforming industries", "quote": "artificial intelligence"}
            ],
            "risk_flags": [],
            "key_concepts": []
        },
        {
            "summary": "Document analyzed in 1 sections. Raw response could not be parsed as JSON.",
            "key_points": [
                {"text": "Machine learning is powerful", "quote": "machine learning"}
            ],
            "risk_flags": [],
            "key_concepts": []
        }
    ]
    
    try:
        result = aggregate_chunk_analyses(chunk_analyses)
        print(f"Aggregated Summary: {result.get('summary', 'No summary')}")
        
        # Check that aggregated summary doesn't contain technical error messages
        summary = result.get('summary', '').lower()
        bad_phrases = ['raw response', 'could not be parsed', 'json', 'error', 'failed']
        has_bad_phrases = any(phrase in summary for phrase in bad_phrases)
        
        if has_bad_phrases:
            print("❌ FAILED: Aggregated summary contains technical error messages")
            return False
        else:
            print("✅ PASSED: Aggregated summary is user-friendly")
            
    except Exception as e:
        print(f"❌ FAILED: Error in chunk aggregation: {e}")
        return False
    
    # Test 3: Empty analysis fallback
    print("\n3. Testing empty analysis fallback...")
    
    empty_chunks = [
        {
            # Remove the summary field to trigger fallback
            # "summary": "Document analyzed in 1 sections. Raw response could not be parsed as JSON.",
            "key_points": [],
            "risk_flags": [],
            "key_concepts": []
        }
    ]
    
    try:
        result = aggregate_chunk_analyses(empty_chunks)
        print(f"Fallback Summary: {result.get('summary', 'No summary')}")
        
        # Check that fallback summary is meaningful
        summary = result.get('summary', '').lower()
        if 'comprehensive analysis' in summary or 'document covers' in summary:
            print("✅ PASSED: Fallback summary is meaningful")
        else:
            print("❌ FAILED: Fallback summary is not meaningful")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: Error in fallback test: {e}")
        return False
    
    print("\n🎉 All tests passed! Summary generation is now user-friendly.")
    return True

if __name__ == "__main__":
    success = asyncio.run(test_summary_generation())
    sys.exit(0 if success else 1) 