#!/bin/bash
# Start the dev server with all Supabase env vars inline (resilient to .env resets).
export DATABASE_URL="postgresql://postgres.qulxgxqpocuodmobwrfp:Prashanaa%402008@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
export DIRECT_URL="postgresql://postgres.qulxgxqpocuodmobwrfp:Prashanaa%402008@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
export NEXT_PUBLIC_SUPABASE_URL="https://qulxgxqpocuodmobwrfp.supabase.co"
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_otqGdiTs0obGb_KSWdzytQ_TOJxVVu-"
export DAHL_API_BASE="https://inference.dahl.global/v1"
export DAHL_API_KEY="dahl_ERVacbVJcFs4XZZuqwdJMx5DoTAEau6Lw"
export DAHL_MODEL="MiniMaxAI/MiniMax-M2.7"
cd /home/z/my-project
exec bun run dev
