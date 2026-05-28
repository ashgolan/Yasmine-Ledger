#!/bin/bash
cd /var/www/yasmine-ledger

echo "📦 Pulling latest code..."
git pull origin main

echo "📥 Installing server dependencies..."
cd server && npm install && cd ..

echo "📥 Installing client dependencies..."
cd client && npm install

echo "🔨 Building client..."
npm run build && cd ..

echo "🔄 Restarting server..."
pm2 restart yasmine-ledger

echo "✅ Deploy complete!"
