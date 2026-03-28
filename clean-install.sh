#!/bin/bash
set -e

echo "Cleaning up old dependencies..."
rm -rf node_modules package-lock.json

echo "Installing fresh dependencies..."
npm install

echo "Done! Your project is ready to run."
