#!/bin/bash

# Test the Google Ads sync Edge Function locally

echo "Testing Google Ads sync Edge Function..."

# First, let's test if the function can be loaded without errors
echo "1. Testing function syntax..."
cd /Users/2309-n0015/Code/Project/sivera
supabase functions serve google-ads-sync --no-verify-jwt &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test the function
echo "2. Testing function endpoint..."
curl -i -X POST http://localhost:54321/functions/v1/google-ads-sync \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  --data '{"trigger":"manual-test"}'

# Kill the server
kill $SERVER_PID

echo "Test completed!"