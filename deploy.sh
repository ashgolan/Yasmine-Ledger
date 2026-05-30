#!/bin/bash
set -e
cd /var/www/yasmine-ledger

echo "📦 Pulling latest code..."
git pull origin main

echo "📥 Installing server dependencies..."
cd /var/www/yasmine-ledger/server && npm install

echo "📥 Installing client dependencies..."
cd /var/www/yasmine-ledger/client && npm install

echo "🔨 Building client..."
cd /var/www/yasmine-ledger/client && npm run build

echo "🔄 Restarting server..."
cd /var/www/yasmine-ledger/server && pm2 restart yasmine-ledger

echo "✅ Deploy complete!"