#!/bin/sh

set -eu

REPOSITORY_ROOT="${CI_PRIMARY_REPOSITORY_PATH:-$(cd "$(dirname "$0")/../../.." && pwd)}"

cd "$REPOSITORY_ROOT"

echo "Installing Node.js dependencies required by Capacitor..."
npm ci --no-audit --no-fund

echo "Building the web application..."
npm run build

echo "Synchronizing the iOS project and local Swift packages..."
npx cap sync ios

echo "Verifying Capacitor Swift package dependencies..."
for package in app barcode-scanner haptics keyboard status-bar; do
    test -f "node_modules/@capacitor/$package/Package.swift"
done
