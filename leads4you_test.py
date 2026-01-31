#!/usr/bin/env python3
"""
Leads4You Backend API Tests - Focused on Review Request Endpoints
Tests the specific endpoints mentioned in the review request:
1. Health Check: GET /api/ - Should return version and mode
2. Webhook Kiwify: GET /api/webhook/test - Should return status "ok"  
3. WhatsApp Status: GET /api/whatsapp/status?company_id=test123 - Can return DISCONNECTED
"""

import asyncio
import httpx
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Get backend URL from frontend .env
BACKEND_URL = "https://email-config-setup-2.preview.emergentagent.com/api"
TEST_COMPANY_ID = "test123"

class Leads4YouTester:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.test_results = []
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response": response_data
        })
    
    async def test_health_check(self) -> bool:
        """Test GET /api/ - Health check endpoint (should return version and mode)"""
        try:
            response = await self.client.get(f"{BACKEND_URL}/")
            
            if response.status_code == 200:
                data = response.json()
                has_version = "version" in data
                has_mode = "mode" in data or "message" in data
                success = has_version and has_mode
                
                self.log_test(
                    "Health Check - GET /api/",
                    success,
                    f"Status: {response.status_code}, Version: {data.get('version', 'N/A')}, Mode: {data.get('mode', data.get('message', 'N/A'))}"
                )
                return success
            else:
                self.log_test(
                    "Health Check - GET /api/",
                    False,
                    f"Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Health Check - GET /api/",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_webhook_kiwify(self) -> bool:
        """Test GET /api/webhook/test - Kiwify webhook test endpoint (no auth required)"""
        try:
            response = await self.client.get(f"{BACKEND_URL}/webhook/test")
            
            if response.status_code == 200:
                data = response.json()
                has_ok_status = data.get("status") == "ok"
                
                self.log_test(
                    "Webhook Kiwify - GET /api/webhook/test",
                    has_ok_status,
                    f"Status: {response.status_code}, Response: {data}"
                )
                return has_ok_status
            else:
                self.log_test(
                    "Webhook Kiwify - GET /api/webhook/test",
                    False,
                    f"Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Webhook Kiwify - GET /api/webhook/test",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_whatsapp_status(self) -> bool:
        """Test GET /api/whatsapp/status?company_id=test123 - WhatsApp status (DISCONNECTED expected)"""
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/whatsapp/status",
                params={"company_id": TEST_COMPANY_ID}
            )
            
            if response.status_code == 200:
                data = response.json()
                has_status = "status" in data
                has_connected = "connected" in data
                # DISCONNECTED is expected and acceptable
                success = has_status and has_connected
                
                self.log_test(
                    "WhatsApp Status - GET /api/whatsapp/status",
                    success,
                    f"Status: {response.status_code}, WhatsApp Status: {data.get('status', 'N/A')}, Connected: {data.get('connected', 'N/A')}"
                )
                return success
            else:
                self.log_test(
                    "WhatsApp Status - GET /api/whatsapp/status",
                    False,
                    f"Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "WhatsApp Status - GET /api/whatsapp/status",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def run_review_tests(self):
        """Run the specific tests requested in the review"""
        print("=" * 60)
        print("LEADS4YOU BACKEND API TESTS - REVIEW REQUEST")
        print("=" * 60)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Test Company ID: {TEST_COMPANY_ID}")
        print()
        print("Testing endpoints:")
        print("1. GET /api/ - Health check (version and mode)")
        print("2. GET /api/webhook/test - Kiwify webhook test")
        print("3. GET /api/whatsapp/status?company_id=test123 - WhatsApp status")
        print()
        
        # Test sequence as requested
        tests = [
            ("Health Check", self.test_health_check),
            ("Webhook Kiwify Test", self.test_webhook_kiwify),
            ("WhatsApp Status", self.test_whatsapp_status),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                result = await test_func()
                if result:
                    passed += 1
            except Exception as e:
                print(f"❌ FAIL {test_name} - Exception: {str(e)}")
        
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        print()
        
        # Show failed tests
        failed_tests = [r for r in self.test_results if not r["success"]]
        if failed_tests:
            print("FAILED TESTS:")
            for test in failed_tests:
                print(f"❌ {test['test']}")
                if test['details']:
                    print(f"   {test['details']}")
        else:
            print("🎉 ALL TESTS PASSED!")
        
        # Check for 500 errors or import problems
        has_500_errors = any("500" in str(r.get("response", "")) for r in self.test_results if not r["success"])
        has_import_errors = any("import" in str(r.get("details", "")).lower() for r in self.test_results if not r["success"])
        
        if has_500_errors:
            print("\n⚠️  WARNING: 500 errors detected - check server logs")
        if has_import_errors:
            print("\n⚠️  WARNING: Import errors detected - check dependencies")
        
        return passed, total, failed_tests


async def main():
    """Main test runner"""
    async with Leads4YouTester() as tester:
        passed, total, failed_tests = await tester.run_review_tests()
        
        # Return exit code based on results
        return 0 if passed == total else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)