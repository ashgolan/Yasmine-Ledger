#!/bin/bash
# ✅ يستبدل __BUILD_TIME__ بـ timestamp حقيقي قبل كل build
BUILD_TIME=$(date +%s)
sed -i "s/__BUILD_TIME__/$BUILD_TIME/g" public/sw.js
npm run build
# أعد sw.js لحالته الأصلية لـ git
sed -i "s/$BUILD_TIME/__BUILD_TIME__/g" public/sw.js
