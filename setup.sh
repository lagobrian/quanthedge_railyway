#!/bin/bash

echo "Setting up Quantitative Hedge project..."

# Navigate to the project directory
cd "$(dirname "$0")"

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Set up Python virtual environment for Django backend
echo "Setting up Django backend..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment and install dependencies
echo "Installing Python dependencies..."
source venv/Scripts/activate 2>/dev/null || source venv/bin/activate 2>/dev/null

pip install -r requirements.txt

# Run migrations
echo "Running database migrations..."
python manage.py makemigrations
python manage.py migrate

echo ""
echo "Setup complete!"
echo ""
echo "To run the frontend: npm run dev"
echo "To run the backend: cd backend && venv\\Scripts\\activate && python manage.py runserver"
