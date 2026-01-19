#!/usr/bin/env python3
"""
Backend API Tests for WhatsApp Message Dispatcher - Supabase Migration
Tests all endpoints after MongoDB to Supabase migration
"""

import asyncio
import httpx
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Get backend URL from frontend .env
BACKEND_URL = "https://disparador.preview.emergentagent.com/api"
COMPANY_ID = "test-company-id"

class BackendTester:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.test_results = []
        self.campaign_id = None
        
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
        """Test GET /api/ - Root endpoint (should return version 2.0.0 and database Supabase)"""
        try:
            response = await self.client.get(f"{BACKEND_URL}/")
            
            if response.status_code == 200:
                data = response.json()
                has_version = data.get("version") == "2.0.0"
                has_database = data.get("database") == "Supabase"
                success = has_version and has_database
                
                self.log_test(
                    "GET /api/ - Root endpoint",
                    success,
                    f"Status: {response.status_code}, Version: {data.get('version')}, Database: {data.get('database')}"
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
    
    async def test_campaign_create(self) -> bool:
        """Test POST /api/campaigns - Create campaign with company_id"""
        try:
            campaign_data = {
                "name": "Test Campaign Supabase",
                "message": {
                    "type": "text",
                    "text": "Olá {nome}, esta é uma mensagem de teste do sistema migrado para Supabase!"
                },
                "settings": {
                    "interval_min": 30,
                    "interval_max": 60,
                    "working_days": [0, 1, 2, 3, 4],
                    "daily_limit": 100
                }
            }
            
            response = await self.client.post(
                f"{BACKEND_URL}/campaigns",
                params={"company_id": COMPANY_ID},
                json=campaign_data
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                has_id = "id" in data
                has_company_id = data.get("company_id") == COMPANY_ID
                success = has_id and has_company_id
                
                if has_id:
                    self.campaign_id = data["id"]
                
                self.log_test(
                    "POST /api/campaigns - Create campaign",
                    success,
                    f"Status: {response.status_code}, Campaign ID: {data.get('id', 'None')}, Company ID: {data.get('company_id')}"
                )
                return success
            else:
                self.log_test(
                    "POST /api/campaigns - Create campaign",
                    False,
                    f"Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "POST /api/campaigns - Create campaign",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_campaigns_list(self) -> bool:
        """Test GET /api/campaigns - List campaigns with company_id"""
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/campaigns",
                params={"company_id": COMPANY_ID}
            )
            
            if response.status_code == 200:
                data = response.json()
                has_campaigns = "campaigns" in data and isinstance(data["campaigns"], list)
                self.log_test(
                    "GET /api/campaigns - List campaigns",
                    has_campaigns,
                    f"Status: {response.status_code}, Campaigns count: {len(data.get('campaigns', []))}"
                )
                return has_campaigns
            else:
                self.log_test(
                    "GET /api/campaigns - List campaigns",
                    False,
                    f"Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "GET /api/campaigns - List campaigns",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_campaigns_list(self) -> bool:
        """Test GET /api/campaigns - List campaigns with company_id"""
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/campaigns",
                params={"company_id": COMPANY_ID}
            )
            
            if response.status_code == 200:
                data = response.json()
                has_campaigns = "campaigns" in data and isinstance(data["campaigns"], list)
                self.log_test(
                    "GET /api/campaigns - List campaigns",
                    has_campaigns,
                    f"Status: {response.status_code}, Campaigns count: {len(data.get('campaigns', []))}"
                )
                return has_campaigns
            else:
                self.log_test(
                    "GET /api/campaigns - List campaigns",
                    False,
                    f"Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "GET /api/campaigns - List campaigns",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_campaign_get(self) -> bool:
        """Test GET /api/campaigns/{campaign_id} - Get specific campaign"""
        if not self.campaign_id:
            self.log_test(
                "GET /api/campaigns/{id} - Get specific campaign",
                False,
                "No campaign ID available from previous test"
            )
            return False
            
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/campaigns/{self.campaign_id}"
            )
            
            if response.status_code == 200:
                data = response.json()
                has_campaign = "campaign" in data and "stats" in data
                self.log_test(
                    "GET /api/campaigns/{id} - Get specific campaign",
                    has_campaign,
                    f"Status: {response.status_code}, Has campaign and stats: {has_campaign}"
                )
                return has_campaign
            else:
                self.log_test(
                    "GET /api/campaigns/{id} - Get specific campaign",
                    False,
                    f"Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "GET /api/campaigns/{id} - Get specific campaign",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_campaign_delete(self) -> bool:
        """Test DELETE /api/campaigns/{campaign_id} - Delete campaign"""
        if not self.campaign_id:
            self.log_test(
                "DELETE /api/campaigns/{id} - Delete campaign",
                False,
                "No campaign ID available from previous test"
            )
            return False
            
        try:
            response = await self.client.delete(
                f"{BACKEND_URL}/campaigns/{self.campaign_id}"
            )
            
            if response.status_code == 200:
                data = response.json()
                success = data.get("success", False)
                self.log_test(
                    "DELETE /api/campaigns/{id} - Delete campaign",
                    success,
                    f"Status: {response.status_code}, Success: {success}"
                )
                return success
            else:
                self.log_test(
                    "DELETE /api/campaigns/{id} - Delete campaign",
                    False,
                    f"Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "DELETE /api/campaigns/{id} - Delete campaign",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_dashboard_stats(self) -> bool:
        """Test GET /api/dashboard/stats - Dashboard statistics with company_id"""
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/dashboard/stats",
                params={"company_id": COMPANY_ID}
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total_campaigns", "active_campaigns", "total_messages_sent", "messages_sent_today"]
                has_all_fields = all(field in data for field in required_fields)
                
                self.log_test(
                    "GET /api/dashboard/stats - Dashboard statistics",
                    has_all_fields,
                    f"Status: {response.status_code}, Has all required fields: {has_all_fields}, Stats: {data}"
                )
                return has_all_fields
            else:
                self.log_test(
                    "GET /api/dashboard/stats - Dashboard statistics",
                    False,
                    f"Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "GET /api/dashboard/stats - Dashboard statistics",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_api_root(self) -> bool:
        """Test GET /api/ - Root endpoint"""
        try:
            response = await self.client.get(f"{BACKEND_URL}/")
            
            if response.status_code == 200:
                data = response.json()
                has_message = "message" in data
                self.log_test(
                    "GET /api/ - Root endpoint",
                    has_message,
                    f"Status: {response.status_code}, Message: {data.get('message', 'None')}"
                )
                return has_message
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
    
    async def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 60)
        print("BACKEND API TESTS - WhatsApp Message Dispatcher")
        print("=" * 60)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"User ID: {USER_ID}")
        print()
        
        # Test sequence according to review request
        tests = [
            ("API Root", self.test_api_root),
            ("WAHA Config Save", self.test_waha_config_save),
            ("WAHA Config Get", self.test_waha_config_get),
            ("Campaign Create", self.test_campaign_create),
            ("Campaigns List", self.test_campaigns_list),
            ("Campaign Get", self.test_campaign_get),
            ("Dashboard Stats", self.test_dashboard_stats),
            ("Campaign Delete", self.test_campaign_delete),
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
        
        return passed, total, failed_tests


async def main():
    """Main test runner"""
    async with BackendTester() as tester:
        passed, total, failed_tests = await tester.run_all_tests()
        
        # Return exit code based on results
        return 0 if passed == total else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)