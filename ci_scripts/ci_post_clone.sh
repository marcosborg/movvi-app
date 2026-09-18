#!/bin/sh

set -eu

cd "${CI_PRIMARY_REPOSITORY_PATH:-$(pwd)}"

echo "Installing Node.js dependencies required by Capacitor..."
npm ci

echo "Building the web application..."
npm run build

echo "Synchronizing the iOS project and local Swift packages..."
npx cap sync ios
