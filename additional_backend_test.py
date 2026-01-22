#!/usr/bin/env python3
"""
Additional Backend API Tests for WhatsApp Message Dispatcher
Tests additional endpoints for comprehensive coverage
"""

import asyncio
import httpx
import json
import io
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://anonymous-access-503.preview.emergentagent.com/api"
USER_ID = "default"

class AdditionalBackendTester:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.campaign_id = None
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        print()
    
    async def setup_test_campaign(self) -> bool:
        """Create a test campaign for additional tests"""
        try:
            campaign_data = {
                "name": "Additional Test Campaign",
                "message": {
                    "type": "text",
                    "text": "Olá {nome}, teste adicional!"
                },
                "settings": {
                    "interval_min": 30,
                    "interval_max": 60,
                    "working_days": [0, 1, 2, 3, 4]
                }
            }
            
            response = await self.client.post(
                f"{BACKEND_URL}/campaigns",
                params={"user_id": USER_ID},
                json=campaign_data
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.campaign_id = data.get("id")
                return True
            return False
        except:
            return False
    
    async def test_waha_test_connection(self) -> bool:
        """Test POST /api/waha/test - Test WAHA connection"""
        try:
            response = await self.client.post(
                f"{BACKEND_URL}/waha/test",
                params={"user_id": USER_ID}
            )
            
            # This will likely fail since we don't have a real WAHA server
            # But we should get a proper error response, not a server error
            success = response.status_code in [200, 400]  # 400 is expected for connection error
            
            self.log_test(
                "POST /api/waha/test - Test connection",
                success,
                f"Status: {response.status_code} (400 expected for no WAHA server)"
            )
            return success
                
        except Exception as e:
            self.log_test(
                "POST /api/waha/test - Test connection",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_campaign_upload_contacts(self) -> bool:
        """Test POST /api/campaigns/{id}/upload - Upload contacts"""
        if not self.campaign_id:
            return False
            
        try:
            # Create a simple CSV content
            csv_content = "Nome,Telefone,Email\nJoão Silva,11999999999,joao@test.com\nMaria Santos,11888888888,maria@test.com"
            
            files = {
                'file': ('contacts.csv', io.BytesIO(csv_content.encode()), 'text/csv')
            }
            data = {
                'phone_column': 'Telefone',
                'name_column': 'Nome'
            }
            
            response = await self.client.post(
                f"{BACKEND_URL}/campaigns/{self.campaign_id}/upload",
                files=files,
                data=data
            )
            
            success = response.status_code in [200, 201]
            if success:
                result = response.json()
                success = result.get("success", False)
            
            self.log_test(
                "POST /api/campaigns/{id}/upload - Upload contacts",
                success,
                f"Status: {response.status_code}"
            )
            return success
                
        except Exception as e:
            self.log_test(
                "POST /api/campaigns/{id}/upload - Upload contacts",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_campaign_contacts_get(self) -> bool:
        """Test GET /api/campaigns/{id}/contacts - Get campaign contacts"""
        if not self.campaign_id:
            return False
            
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/campaigns/{self.campaign_id}/contacts"
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                success = "contacts" in data and "total" in data
            
            self.log_test(
                "GET /api/campaigns/{id}/contacts - Get contacts",
                success,
                f"Status: {response.status_code}"
            )
            return success
                
        except Exception as e:
            self.log_test(
                "GET /api/campaigns/{id}/contacts - Get contacts",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_campaign_logs_get(self) -> bool:
        """Test GET /api/campaigns/{id}/logs - Get message logs"""
        if not self.campaign_id:
            return False
            
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/campaigns/{self.campaign_id}/logs"
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                success = "logs" in data and "total" in data
            
            self.log_test(
                "GET /api/campaigns/{id}/logs - Get message logs",
                success,
                f"Status: {response.status_code}"
            )
            return success
                
        except Exception as e:
            self.log_test(
                "GET /api/campaigns/{id}/logs - Get message logs",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_campaign_control_endpoints(self) -> bool:
        """Test campaign control endpoints (start/pause/cancel/reset)"""
        if not self.campaign_id:
            return False
        
        results = []
        
        # Test start (should fail without WAHA connection)
        try:
            response = await self.client.post(
                f"{BACKEND_URL}/campaigns/{self.campaign_id}/start",
                params={"user_id": USER_ID}
            )
            # Should return 400 due to no WAHA connection
            success = response.status_code == 400
            results.append(success)
            self.log_test(
                "POST /api/campaigns/{id}/start - Start campaign",
                success,
                f"Status: {response.status_code} (400 expected for no WAHA)"
            )
        except Exception as e:
            results.append(False)
            self.log_test(
                "POST /api/campaigns/{id}/start - Start campaign",
                False,
                f"Exception: {str(e)}"
            )
        
        # Test pause
        try:
            response = await self.client.post(
                f"{BACKEND_URL}/campaigns/{self.campaign_id}/pause"
            )
            success = response.status_code == 200
            results.append(success)
            self.log_test(
                "POST /api/campaigns/{id}/pause - Pause campaign",
                success,
                f"Status: {response.status_code}"
            )
        except Exception as e:
            results.append(False)
            self.log_test(
                "POST /api/campaigns/{id}/pause - Pause campaign",
                False,
                f"Exception: {str(e)}"
            )
        
        # Test reset
        try:
            response = await self.client.post(
                f"{BACKEND_URL}/campaigns/{self.campaign_id}/reset"
            )
            success = response.status_code == 200
            results.append(success)
            self.log_test(
                "POST /api/campaigns/{id}/reset - Reset campaign",
                success,
                f"Status: {response.status_code}"
            )
        except Exception as e:
            results.append(False)
            self.log_test(
                "POST /api/campaigns/{id}/reset - Reset campaign",
                False,
                f"Exception: {str(e)}"
            )
        
        return all(results)
    
    async def cleanup_test_campaign(self):
        """Clean up test campaign"""
        if self.campaign_id:
            try:
                await self.client.delete(f"{BACKEND_URL}/campaigns/{self.campaign_id}")
            except:
                pass
    
    async def run_additional_tests(self):
        """Run additional backend tests"""
        print("=" * 60)
        print("ADDITIONAL BACKEND API TESTS")
        print("=" * 60)
        
        # Setup
        setup_success = await self.setup_test_campaign()
        if not setup_success:
            print("❌ Failed to setup test campaign")
            return 0, 1, ["Setup failed"]
        
        tests = [
            ("WAHA Test Connection", self.test_waha_test_connection),
            ("Upload Contacts", self.test_campaign_upload_contacts),
            ("Get Campaign Contacts", self.test_campaign_contacts_get),
            ("Get Message Logs", self.test_campaign_logs_get),
            ("Campaign Control Endpoints", self.test_campaign_control_endpoints),
        ]
        
        passed = 0
        total = len(tests)
        failed_tests = []
        
        for test_name, test_func in tests:
            try:
                result = await test_func()
                if result:
                    passed += 1
                else:
                    failed_tests.append(test_name)
            except Exception as e:
                print(f"❌ FAIL {test_name} - Exception: {str(e)}")
                failed_tests.append(test_name)
        
        # Cleanup
        await self.cleanup_test_campaign()
        
        print("=" * 60)
        print("ADDITIONAL TESTS SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        return passed, total, failed_tests


async def main():
    """Main test runner"""
    async with AdditionalBackendTester() as tester:
        return await tester.run_additional_tests()


if __name__ == "__main__":
    asyncio.run(main())