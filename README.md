# Quantitative Hedge

A platform for quantitative financial analysis, backtesting strategies, and market insights.

## Project Overview

Quantitative Hedge is a full-stack application that provides:
- Advanced financial models
- Backtesting capabilities for trading strategies
- Market insights and analysis
- User authentication and subscription management

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- TailwindCSS
- Chart.js
- Stripe for payments

### Backend
- Django
- Django REST Framework
- PostgreSQL
- Python

## Setup Instructions

### Quick Setup

Run the setup script to install all dependencies for both frontend and backend:

```bash
# Make the script executable if it's not already
chmod +x setup.sh

# Run the setup script
./setup.sh
```

### Manual Setup

#### Frontend Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

#### Backend Setup

```bash
# Navigate to backend directory
cd django_backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver
```

## Environment Variables

Create a `.env` file in the `django_backend` directory with the following variables:

```
SECRET_KEY=your_django_secret_key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
YAHOO_FINANCE_API_KEY=your_yahoo_finance_api_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

## Running the Application

### Frontend

```bash
npm run dev
```

The frontend will be available at http://localhost:3000

### Backend

```bash
cd django_backend
source venv/bin/activate
python manage.py runserver
```

The backend API will be available at http://localhost:8000/api/
