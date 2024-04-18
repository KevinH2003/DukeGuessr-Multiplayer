#!/bin/bash

stop_servers() {
    echo "Stopping servers..."
    # Stop server process
    pkill -P $$ npm
    # Stop UI development server
    pkill -P $$ npm
    exit 0
}

# Trap Ctrl+C and call stop_servers function
trap stop_servers SIGINT

# Check if MongoDB container is already running
if [[ "$(docker ps -q -f name=mongo)" ]]; then
    echo "MongoDB container is already running."
else
    echo "Starting MongoDB container..."
    docker run -p 127.0.0.1:27017:27017 -d --rm --name mongo mongo:7.0.5

    echo "Running setup..."
    cd server
    npm run setup
fi

# Check if Redis container is already running
if [[ "$(docker ps -q -f name=redis)" ]]; then
    echo "Redis container is already running."
else
    echo "Starting Redis container..."
    docker run --rm -d --name redis -p 6379:6379 redis
fi

# Start server
cd server
DISABLE_SECURITY=security-disabled npm start &

sleep 2

# Start UI
cd ../ui
npm run dev

stop_servers
