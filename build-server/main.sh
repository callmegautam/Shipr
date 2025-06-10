#!/bin/bash

set -e  

export GIT_REPOSITORY_URL="$GIT_REPOSITORY_URL" 

echo "Cloning repository..."
git clone "$GIT_REPOSITORY_URL" /home/app/output

echo "Installing dependencies..."
npm install

echo "Building project..."
npm run build

echo "Starting application..."
exec npm run start