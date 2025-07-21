#!/usr/bin/env python3
"""
Debug script to check empresa IDs and session data
Run this to understand which empresa IDs exist and what's in the current session
"""

import requests
import json
from pymongo import MongoClient

def debug_empresa_ids():
    print("🔍 DEBUGGING EMPRESA ID ISSUE")
    print("=" * 50)
    
    # Connect to MongoDB to see what empresas exist
    try:
        client = MongoClient('mongodb://localhost:27017/')
        db = client['rescue_backend_db']  # Adjust database name if different
        empresas_collection = db['empresas']
        
        print("📊 EMPRESAS IN DATABASE:")
        empresas = list(empresas_collection.find({}, {"_id": 1, "nombre": 1, "username": 1, "email": 1, "activa": 1}))
        
        for i, empresa in enumerate(empresas, 1):
            print(f"  {i}. ID: {empresa['_id']}")
            print(f"     Nombre: {empresa.get('nombre', 'N/A')}")
            print(f"     Username: {empresa.get('username', 'N/A')}")
            print(f"     Email: {empresa.get('email', 'N/A')}")
            print(f"     Activa: {empresa.get('activa', 'N/A')}")
            print()
        
        if not empresas:
            print("  ❌ No empresas found in database!")
            return
            
        print("🔐 TESTING LOGIN FOR EACH EMPRESA:")
        print("-" * 30)
        
        # Test login for each empresa
        for empresa in empresas:
            username = empresa.get('username')
            if username:
                print(f"\n🧪 Testing login for: {username}")
                print(f"   Expected empresa ID: {empresa['_id']}")
                
                # Try to login (you'll need to provide the password)
                print(f"   💡 To test login, use:")
                print(f"   curl -X POST http://localhost:5002/auth/login \\")
                print(f"        -H 'Content-Type: application/json' \\")
                print(f"        -d '{{\"usuario\":\"{username}\", \"password\":\"YOUR_PASSWORD\"}}' ")
                print()
        
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        print("💡 Make sure MongoDB is running and accessible")
    
    print("\n🌐 TESTING BACKEND API:")
    print("-" * 20)
    
    # Test if backend is accessible
    try:
        response = requests.get('http://localhost:5002/health', timeout=5)
        if response.ok:
            print("✅ Backend is accessible")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.json()}")
        else:
            print(f"⚠️ Backend responded with status: {response.status_code}")
    except Exception as e:
        print(f"❌ Cannot reach backend: {e}")
        print("💡 Make sure backend is running on http://localhost:5002")
    
    print("\n💡 NEXT STEPS:")
    print("-" * 15)
    print("1. Check which empresa you're trying to log in as")
    print("2. Verify the password for that empresa")
    print("3. Test login using the curl command above")
    print("4. Check browser dev tools -> Application -> Cookies for auth_token")
    print("5. Verify window.empresaId in browser console matches expected ID")
    
if __name__ == "__main__":
    debug_empresa_ids()
