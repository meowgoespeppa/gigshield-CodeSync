# GigShield
By team CodeSync

# Problem Statement Chosen
Domain: GigShield
Problem Statement:
Develop an AI powered solution that empowers gig workers by promoting fair compensation, improving financial planning, and enhancing workplace safety through intelligent insights and data-driven recommendations.

# Team
Team Name: CodeSync

# Our Solution
GigShield is an AI powered platform designed to support gig economy workers such as taxi drivers and delivery partners. The application enables workers to estimate fair fares, detect underpayment, monitor earnings, receive safety recommendations, and track savings goals. By combining AI, OCR, and data analytics, GigShield promotes transparency, financial security, and informed decision-making for gig workers.

# AI Component
What AI is used:
Google Gemini API
Tesseract OCR

What it does in the app:
Gemini powers an intelligent assistant that answers worker related questions and provides personalized recommendations.
Tesseract OCR extracts fare information from receipts and screenshots, reducing manual data entry.

Why we chose this approach:
Google Gemini provides natural language understanding for interactive user assistance, while Tesseract OCR enables accurate text extraction from images. Together they improve usability and automate key tasks within the application.

# Tech Stack
 
Frontend:
React
TypeScript
Vite
Tailwind CSS
Framer Motion

Backend:
FastAPI
Python

AI/ML:
Google Gemini API
Tesseract OCR

Database/Storage: 
Zustand 
Browser Local Storage

Other Tools/APIs:
npm
Uvicorn
REST APIs

Features Implemented:
Core Requirements
Fair fare estimation
Earnings dashboard
AI assistant for gig workers
OCR receipt scanning
Savings tracker
Safety recommendations
Alerts
Bonus Features Attempted
Community fare comparison
AI powered financial guidance
OCR based automatic fare extraction
Interactive analytics dashboard


How to Run This Project:
# Clone repository
git clone https://github.com/meowgoespeppa/gigshield-CodeSync.git

# Frontend
cd gigshield
npm install
npm run dev

# Backend
cd ../backend
pip install fastapi uvicorn
uvicorn main:app --reload

Create a .env file and add the required API keys before running the project. 
Example:
GEMINI_API_KEY=your_api_key_here
