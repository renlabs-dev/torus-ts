#!/usr/bin/env python3
"""
Simple Python script to test cross-language communication with the TS agent-server.

This script makes the same HTTP requests as the TypeScript test client to verify
that the agent server can be called from Python.

Requirements:
    pip install requests

Usage:
    python test_agent.py
"""

import json
import time
import uuid
import base64
import requests
from substrateinterface import Keypair as SubstrateKeypair

# Test mnemonic (same as TypeScript tests)
TEST_MNEMONIC = ""


def create_jwt_token(mnemonic: str) -> str:
    """Create a proper SR25519 JWT token matching the TypeScript implementation."""
    # Create keypair from mnemonic
    keypair = SubstrateKeypair.create_from_mnemonic(mnemonic, ss58_format=42)

    # Get current time
    now = int(time.time())

    # Create JWT header
    header = {"alg": "SR25519", "typ": "JWT"}

    # Create JWT payload (matching TypeScript structure)
    payload = {
        "sub": keypair.ss58_address,
        "publicKey": keypair.public_key.hex(),
        "iat": now,
        "exp": now + 3600,  # 1 hour from now
        "nonce": str(uuid.uuid4()),
        "_protocol_metadata": {"version": "1.0.0"},
    }

    # Base64url encode header and payload
    header_b64 = (
        base64.urlsafe_b64encode(json.dumps(header, separators=(",", ":")).encode())
        .decode()
        .rstrip("=")
    )

    payload_b64 = (
        base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode())
        .decode()
        .rstrip("=")
    )

    # Create signing input
    signing_input = f"{header_b64}.{payload_b64}"

    # Sign with SR25519
    signature = keypair.sign(signing_input.encode())

    # Base64url encode signature
    signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")

    # Return complete JWT
    return f"{header_b64}.{payload_b64}.{signature_b64}"


def test_unauthenticated_request():
    """Test an unauthenticated request (should fail with 401)."""
    print("🚫 Testing unauthenticated request (should fail)...")

    try:
        response = requests.post(
            "http://localhost:3002/hello",
            headers={"Content-Type": "application/json"},
            json={"name": "Unauthenticated Python User"},
            timeout=10,
        )

        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")

        if response.status_code == 401:
            print("✅ Correctly rejected unauthenticated request\n")
            return True
        else:
            print("❌ Unexpected response for unauthenticated request\n")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Error testing unauthenticated request: {e}")
        return False


def test_authenticated_request_with_fake_jwt():
    """Test with a fake JWT (should fail with proper error)."""
    print("🔐 Testing with fake JWT (should fail)...")

    fake_jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

    try:
        response = requests.post(
            "http://localhost:3002/hello",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {fake_jwt}",
            },
            json={"name": "Python User with Fake JWT"},
            timeout=10,
        )

        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")

        if response.status_code == 401:
            print("✅ Correctly rejected fake JWT\n")
            return True
        else:
            print("❌ Fake JWT was not properly rejected\n")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Error testing fake JWT: {e}")
        return False


def test_valid_jwt_authentication():
    """Test with a valid SR25519 JWT (should succeed)."""
    print("🔐 Testing with valid SR25519 JWT...")

    try:
        # Create a valid JWT token
        jwt_token = create_jwt_token(TEST_MNEMONIC)
        print(f"Generated JWT: {jwt_token[:50]}...")

        response = requests.post(
            "http://localhost:3002/hello",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {jwt_token}",
            },
            json={"name": "Python User with Valid JWT"},
            timeout=10,
        )

        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")

        if response.status_code == 200:
            try:
                response_data = response.json()
                expected_message = "Hello Python User with Valid JWT!"
                actual_message = response_data.get("message", "")

                if actual_message == expected_message:
                    print("✅ Valid JWT authentication successful!")
                    print("✅ Correct response message received")
                    return True
                else:
                    print("❌ JWT accepted but wrong response content")
                    print(f"   Expected: {expected_message}")
                    print(f"   Actual: {actual_message}")
                    return False
            except json.JSONDecodeError:
                print("❌ JWT accepted but response is not valid JSON")
                return False
        else:
            print("❌ Valid JWT was rejected")
            return False

    except Exception as e:
        print(f"❌ Error testing valid JWT: {e}")
        return False


def main():
    """Run the Python agent tests."""
    print("🐍 Python Agent Test Client")
    print("=" * 40)

    print()

    # Run tests
    tests = [
        ("Unauthenticated Request", test_unauthenticated_request),
        ("Fake JWT Request", test_authenticated_request_with_fake_jwt),
        ("Valid JWT Authentication", test_valid_jwt_authentication),
    ]

    results = []
    for test_name, test_func in tests:
        print(f"Running: {test_name}")
        result = test_func()
        results.append((test_name, result))

    # Print summary
    print("📊 Test Results:")
    print("-" * 20)
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1

    total = len(results)
    print(f"\n🎯 Total: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! Cross-language communication works!")
    else:
        print("💥 Some tests failed.")

    print("\n💡 Note: This demonstrates that your TypeScript agent server")
    print("   can be called from Python using standard HTTP requests!")


if __name__ == "__main__":
    main()
