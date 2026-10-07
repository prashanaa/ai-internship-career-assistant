#!/bin/bash
# Start the dev server with the env vars the app needs (SQLite + Dahl).
# The sandbox's startup script already exports DATABASE_URL to the SQLite
# path, but we set it explicitly here so the app always uses SQLite.
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export DAHL_API_BASE="https://inference.dahl.global/v1"
export DAHL_API_KEY="dahl_ERVacbVJcFs4XZZuqwdJMx5DoTAEau6Lw"
export DAHL_MODEL="MiniMaxAI/MiniMax-M2.7"
cd /home/z/my-project
exec bun run dev
