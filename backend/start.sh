#!/bin/bash
echo "Starting AI Task Master Backend..."
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Supabase URL set: $([ -n "$SUPABASE_URL" ] && echo "yes" || echo "no")"
echo "Gemini API set: $([ -n "$GEMINI_API_KEY" ] && echo "yes" || echo "no")"
node src/server.js
