#!/usr/bin/env python3
"""
Test script to verify the authentication fix
"""
import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_debug_endpoint():
    """Test the debug cookies endpoint"""
    try:
        # Test without cookies
        response = requests.get(f"{API_BASE_URL}/auth/debug-cookies")
        print("Debug endpoint (no cookies):", response.status_code)
        print("Response:", response.json())
        
        # Test with sample cookies
        cookies = {
            'access_token': 'sample_access_token',
            'refresh_token': 'sample_refresh_token'
        }
        response = requests.get(f"{API_BASE_URL}/auth/debug-cookies", cookies=cookies)
        print("\nDebug endpoint (with cookies):", response.status_code)
        print("Response:", response.json())
        
    except Exception as e:
        print(f"Debug endpoint test failed: {e}")

def test_refresh_endpoint():
    """Test the refresh endpoint with empty body"""
    try:
        # Test refresh with empty body (this was causing the issue)
        response = requests.post(f"{API_BASE_URL}/auth/refresh", json={})
        print(f"\nRefresh endpoint (empty body): {response.status_code}")
        print("Response:", response.text)
        
        # Test with sample cookies
        cookies = {
            'refresh_token': 'invalid_token_for_testing'
        }
        response = requests.post(f"{API_BASE_URL}/auth/refresh", json={}, cookies=cookies)
        print(f"\nRefresh endpoint (with cookie): {response.status_code}")
        print("Response:", response.text)
        
    except Exception as e:
        print(f"Refresh endpoint test failed: {e}")

if __name__ == "__main__":
    print("Testing authentication endpoints...")
    test_debug_endpoint()
    test_refresh_endpoint()