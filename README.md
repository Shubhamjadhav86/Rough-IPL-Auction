# IPL Auction Registration - MongoDB Setup

This application has been updated to use MongoDB instead of localStorage for data persistence.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- MongoDB Atlas account (connection string already configured)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory (already created with your credentials):
```
MONGODB_URI=your_mongodb_connection_string
PORT=3000
DB_NAME=iplAuction
COLLECTION_NAME=registrations
```

## Running the Application

1. Start the backend server:
```bash
npm start
```

The server will run on `http://localhost:3000`

2. Open your browser and navigate to:
```
http://localhost:3000/index.html
```

## Development Mode

To run with auto-restart on file changes:
```bash
npm run dev
```

## MongoDB Configuration

The application is configured to connect to:
```
mongodb+srv://ecell:17147714@cluster0.pnek51j.mongodb.net/?appName=Cluster0
```

Database: `iplAuction`
Collection: `registrations`

## API Endpoints

- `GET /api/registrations` - Get all registrations
- `POST /api/registrations` - Create new registration (with file upload)
- `GET /api/registrations/:id/screenshot` - Get payment screenshot for a registration
- `DELETE /api/registrations/:id` - Delete a registration (optional)

## Features

- Form validation
- File upload (payment screenshot) stored in MongoDB as base64
- View all registrations
- View detailed team information
- Payment screenshot preview

## Changes from localStorage Version

- All data now persisted in MongoDB
- File uploads stored as base64 in database
- Fetch API used instead of localStorage
- Backend server required to run the application
