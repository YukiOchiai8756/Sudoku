#!/bin/bash
session=backend
# This script must only be run on the host server.
# Frontend/Backend are in their on Subshells - This is indicated by the brackets wrapping them.
# Set up Backend


  cd backend || exit 1
  npm install
# Check for env file
  if not [ -f ".env" ]; then
      echo "Backend env does not exist - Making one using template"

      if [ -f ".env.template" ]; then
          cp .env.template .env
          echo "Created backend/.env: You MUST edit this to ensure it is set up as desired."
          echo "Warning: The defaults for backend will not work in many cases. You must edit it."
          echo "Run this script again once you have checked the .env file."
          exit 0
      else
          echo "Error: No .env.template file exists. You should create a .env file."
      fi
  fi





  # Set up frontend
  cd ..
  cd frontend || exit 1
  npm install

  # Check for env file
  if not [ -f ".env" ]; then
      echo "Frontend env does not exist - Making one using template"

      if [ -f ".env.template" ]; then
          cp .env.template .env
          echo "Created frontend/.env: You should edit this to ensure it is set up as desired."
          echo "Run this script again once you have checked the .env file."
          exit 0
      else
          echo "Error: No .env.template file exists. You should create a .env file."
      fi
  fi


echo "All env files are now set up - Building frontend."
npm run build

echo "Built - Deploying to Tmux"
cd ..

tmux has-session -t $session 2>/dev/null

if not [ $? != 0 ]; then
    # A session exists - kill it.
    echo "A session already exists... killing it."
    tmux kill-session -t $session
fi

echo "Starting tmux session"
tmux new-session -d -s $session 'cd backend && npm start'
