#!/bin/bash
set -e
cd /var/www/yasmine-ledger

echo "📦 Fetching latest code..."
# שימוש ב-reset --hard במקום pull — מונע conflicts
git fetch origin main && git reset --hard origin/main

echo "📥 Installing client dependencies..."
cd /var/www/yasmine-ledger/client && npm install

echo "🔨 Building client..."
cd /var/www/yasmine-ledger/client && npm run build

echo "📥 Installing server dependencies..."
cd /var/www/yasmine-ledger/server && npm install

echo "🔄 Restarting server..."
cd /var/www/yasmine-ledger/server && pm2 restart yasmine-ledger --update-env

echo "✅ Deploy complete!"
