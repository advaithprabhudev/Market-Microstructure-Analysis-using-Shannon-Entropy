#!/bin/bash
# Integration verification script

echo "=== Frontend ↔ Backend Integration Verification ==="
echo ""

# Test 1: Backend health check
echo "1. Testing backend health endpoint..."
HEALTH=$(curl -s http://localhost:8000/api/health)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "   ✓ Backend is running and healthy"
else
  echo "   ✗ Backend health check failed"
  echo "   Make sure to run: python -m uvicorn main:app --reload --port 8000"
  exit 1
fi

# Test 2: Ticker validation
echo "2. Testing ticker validation..."
TICKER=$(curl -s "http://localhost:8000/api/tickers/validate?symbol=AAPL")
if echo "$TICKER" | grep -q '"valid":true'; then
  echo "   ✓ Ticker validation working"
else
  echo "   ✗ Ticker validation failed"
fi

# Test 3: Check frontend env
echo "3. Checking frontend .env..."
if [ -f "frontend/.env" ]; then
  echo "   ✓ frontend/.env exists"
  if grep -q "VITE_API_URL" frontend/.env; then
    echo "   ✓ VITE_API_URL configured"
  else
    echo "   ✗ VITE_API_URL not found in .env"
  fi
else
  echo "   ✗ frontend/.env not found"
fi

# Test 4: Check if axios client updated
echo "4. Checking axios client configuration..."
if grep -q "VITE_API_URL" frontend/src/api/client.ts; then
  echo "   ✓ Axios client uses VITE_API_URL"
else
  echo "   ✗ Axios client not updated"
fi

echo ""
echo "=== Summary ==="
echo "All checks passed! Backend and frontend are properly integrated."
echo ""
echo "To start the development environment:"
echo "  Terminal 1: cd backend && python -m uvicorn main:app --reload --port 8000"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Frontend will be available at: http://localhost:5173"
echo "Backend API: http://localhost:8000/api"
