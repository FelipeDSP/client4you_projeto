#!/usr/bin/env python3
"""
Additional webhook signature test
"""

import asyncio
import httpx
import json
import hmac
import hashlib
from datetime import datetime

BACKEND_URL = "https://status-check-issue.preview.emergentagent.com/api"
KIWIFY_WEBHOOK_SECRET = "o21anhwe1w1"  # From backend/.env

async def test_webhook_with_valid_signature():
    """Test webhook with valid signature"""
    
    payload = {
        "event_type": "order.paid",
        "order_id": "test-order-123",
        "order_status": "paid",
        "product_id": "4a99e8f0-fee2-11f0-8736-21de1acd3b14",
        "product_name": "Plano Básico",
        "customer_email": "nonexistent@example.com",  # User won't exist
        "customer_name": "Test User",
        "amount": 29.90,
        "created_at": datetime.now().isoformat()
    }
    
    # Create valid signature
    payload_bytes = json.dumps(payload, separators=(',', ':')).encode()
    signature = hmac.new(
        KIWIFY_WEBHOOK_SECRET.encode(),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{BACKEND_URL}/webhook/kiwify",
            json=payload,
            headers={"X-Kiwify-Signature": signature}
        )
        
        print(f"Webhook with valid signature:")
        print(f"Status: {response.status_code}")
        try:
            data = response.json()
            print(f"Response: {data}")
        except:
            print(f"Response text: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_webhook_with_valid_signature())