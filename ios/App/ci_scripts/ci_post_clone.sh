#!/bin/sh

set -eu

REPOSITORY_ROOT="${CI_PRIMARY_REPOSITORY_PATH:-$(cd "$(dirname "$0")/../../.." && pwd)}"

cd "$REPOSITORY_ROOT"

if ! command -v npm >/dev/null 2>&1; then
    echo "Installing Node.js 22 for Capacitor..."
    brew install node@22
    export PATH="$(brew --prefix node@22)/bin:$PATH"
fi

echo "Using Node.js $(node --version) and npm $(npm --version)."

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
