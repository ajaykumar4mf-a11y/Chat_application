# Chat Application

A real-time chat application built with Node.js, Express, MongoDB, Socket.io, and React.

## Project Structure

```
Chat_application/
├── backend/        # Express server, MongoDB models, Socket.io
├── frontend/       # Frontend client
├── .gitignore      # Git ignore rules for node_modules, env files, etc.
└── README.md
```

## Getting Started

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in your `PORT` and `MONGODB_URI`.

4. Start development server:
   ```bash
   npm run dev
   # or
   npm start
   ```

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies & run:
   ```bash
   npm install
   ```
