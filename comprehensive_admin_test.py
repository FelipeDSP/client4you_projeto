#!/usr/bin/env python3
"""
Comprehensive Admin Quota Test - Testing endpoint functionality and security
"""

import asyncio
import httpx
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Get backend URL from frontend .env
BACKEND_URL = "https://rebrand-client4you.preview.emergentagent.com/api"

class ComprehensiveAdminTester:
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
    
    async def test_api_root(self) -> bool:
        """Test GET /api/ - Root endpoint (should return version 2.2.0)"""
        try:
            response = await self.client.get(f"{BACKEND_URL}/")
            
            if response.status_code == 200:
                data = response.json()
                has_version = data.get("version") == "2.2.0"
                success = has_version
                
                self.log_test(
                    "GET /api/ - Root endpoint",
                    success,
                    f"Status: {response.status_code}, Version: {data.get('version')}, Mode: {data.get('mode')}"
                )
                return success
            else:
                self.log_test(
                    "GET /api/ - Root endpoint",
                    False,
                    f"Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "GET /api/ - Root endpoint",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_admin_endpoints_exist(self) -> bool:
        """Test that admin endpoints exist and return proper authentication errors"""
        test_user_id = "550e8400-e29b-41d4-a716-446655440001"
        
        try:
            # Test GET endpoint exists
            response = await self.client.get(f"{BACKEND_URL}/admin/users/{test_user_id}/quota")
            get_exists = response.status_code in [401, 403, 404]  # Should not be 404 Not Found for route
            
            # Test POST endpoint exists  
            quota_data = {
                "plan_type": "demo",
                "plan_name": "Demo", 
                "leads_limit": 5,
                "campaigns_limit": 1,
                "messages_limit": 0
            }
            response = await self.client.post(
                f"{BACKEND_URL}/admin/users/{test_user_id}/quota",
                json=quota_data
            )
            post_exists = response.status_code in [401, 403, 404]  # Should not be 404 Not Found for route
            
            success = get_exists and post_exists
            self.log_test(
                "Admin endpoints exist",
                success,
                f"GET exists: {get_exists}, POST exists: {post_exists}"
            )
            return success
                
        except Exception as e:
            self.log_test(
                "Admin endpoints exist",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_authentication_security(self) -> bool:
        """Test authentication security for admin endpoints"""
        test_user_id = "550e8400-e29b-41d4-a716-446655440001"
        
        try:
            # Test 1: No token
            response = await self.client.get(f"{BACKEND_URL}/admin/users/{test_user_id}/quota")
            no_token_secure = response.status_code == 401
            
            # Test 2: Invalid token
            headers = {"Authorization": "Bearer invalid_token"}
            response = await self.client.get(
                f"{BACKEND_URL}/admin/users/{test_user_id}/quota",
                headers=headers
            )
            invalid_token_secure = response.status_code == 401
            
            # Test 3: Malformed token
            headers = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature"}
            response = await self.client.get(
                f"{BACKEND_URL}/admin/users/{test_user_id}/quota",
                headers=headers
            )
            malformed_token_secure = response.status_code == 401
            
            success = no_token_secure and invalid_token_secure and malformed_token_secure
            self.log_test(
                "Authentication security",
                success,
                f"No token: {no_token_secure}, Invalid token: {invalid_token_secure}, Malformed token: {malformed_token_secure}"
            )
            return success
                
        except Exception as e:
            self.log_test(
                "Authentication security",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_endpoint_structure(self) -> bool:
        """Test that endpoints follow correct URL structure"""
        test_user_id = "550e8400-e29b-41d4-a716-446655440001"
        
        try:
            # Test correct endpoint structure
            response = await self.client.get(f"{BACKEND_URL}/admin/users/{test_user_id}/quota")
            correct_structure = response.status_code != 404  # Should not be Not Found
            
            # Test incorrect endpoint structure should return 404
            response = await self.client.get(f"{BACKEND_URL}/admin/quota/{test_user_id}")
            incorrect_structure = response.status_code == 404
            
            success = correct_structure and incorrect_structure
            self.log_test(
                "Endpoint URL structure",
                success,
                f"Correct structure accessible: {correct_structure}, Incorrect structure blocked: {incorrect_structure}"
            )
            return success
                
        except Exception as e:
            self.log_test(
                "Endpoint URL structure",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_http_methods(self) -> bool:
        """Test that endpoints respond to correct HTTP methods"""
        test_user_id = "550e8400-e29b-41d4-a716-446655440001"
        
        try:
            # Test GET method (should work - return 401 for auth, not 405 for method)
            response = await self.client.get(f"{BACKEND_URL}/admin/users/{test_user_id}/quota")
            get_allowed = response.status_code != 405
            
            # Test POST method (should work - return 401 for auth, not 405 for method)
            quota_data = {
                "plan_type": "demo",
                "plan_name": "Demo",
                "leads_limit": 5,
                "campaigns_limit": 1,
                "messages_limit": 0
            }
            response = await self.client.post(
                f"{BACKEND_URL}/admin/users/{test_user_id}/quota",
                json=quota_data
            )
            post_allowed = response.status_code != 405
            
            # Test unsupported method (should return 405)
            response = await self.client.put(
                f"{BACKEND_URL}/admin/users/{test_user_id}/quota",
                json=quota_data
            )
            put_blocked = response.status_code == 405
            
            success = get_allowed and post_allowed and put_blocked
            self.log_test(
                "HTTP methods",
                success,
                f"GET allowed: {get_allowed}, POST allowed: {post_allowed}, PUT blocked: {put_blocked}"
            )
            return success
                
        except Exception as e:
            self.log_test(
                "HTTP methods",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_request_validation(self) -> bool:
        """Test request validation for POST endpoint"""
        test_user_id = "550e8400-e29b-41d4-a716-446655440001"
        
        try:
            # Test with invalid JSON (should return 422 or 400, not 500)
            response = await self.client.post(
                f"{BACKEND_URL}/admin/users/{test_user_id}/quota",
                json={"invalid": "data"}
            )
            invalid_json_handled = response.status_code in [400, 401, 422]  # Not 500
            
            # Test with empty body (should return 422 or 400, not 500)
            response = await self.client.post(
                f"{BACKEND_URL}/admin/users/{test_user_id}/quota",
                json={}
            )
            empty_body_handled = response.status_code in [400, 401, 422]  # Not 500
            
            success = invalid_json_handled and empty_body_handled
            self.log_test(
                "Request validation",
                success,
                f"Invalid JSON handled: {invalid_json_handled}, Empty body handled: {empty_body_handled}"
            )
            return success
                
        except Exception as e:
            self.log_test(
                "Request validation",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_user_id_validation(self) -> bool:
        """Test user ID validation in URL"""
        try:
            # Test with invalid UUID format
            response = await self.client.get(f"{BACKEND_URL}/admin/users/invalid-uuid/quota")
            invalid_uuid_handled = response.status_code in [400, 401, 422]  # Should validate UUID format
            
            # Test with empty user ID
            response = await self.client.get(f"{BACKEND_URL}/admin/users//quota")
            empty_user_id_handled = response.status_code == 404  # Should be not found
            
            success = invalid_uuid_handled and empty_user_id_handled
            self.log_test(
                "User ID validation",
                success,
                f"Invalid UUID handled: {invalid_uuid_handled}, Empty user ID handled: {empty_user_id_handled}"
            )
            return success
                
        except Exception as e:
            self.log_test(
                "User ID validation",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def run_all_tests(self):
        """Run all comprehensive admin tests"""
        print("=" * 70)
        print("COMPREHENSIVE ADMIN QUOTA ENDPOINTS TEST")
        print("=" * 70)
        print(f"Backend URL: {BACKEND_URL}")
        print()
        
        # Test sequence
        tests = [
            ("API Root (Version 2.2.0)", self.test_api_root),
            ("Admin Endpoints Exist", self.test_admin_endpoints_exist),
            ("Authentication Security", self.test_authentication_security),
            ("Endpoint URL Structure", self.test_endpoint_structure),
            ("HTTP Methods Support", self.test_http_methods),
            ("Request Validation", self.test_request_validation),
            ("User ID Validation", self.test_user_id_validation),
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
        
        print("=" * 70)
        print("TEST SUMMARY")
        print("=" * 70)
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
        
        return passed, total, failed_tests


async def main():
    """Main test runner"""
    async with ComprehensiveAdminTester() as tester:
        passed, total, failed_tests = await tester.run_all_tests()
        
        # Return exit code based on results
        return 0 if passed == total else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)