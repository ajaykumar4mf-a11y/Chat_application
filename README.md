# 💬 PulseChat - Full-Stack Real-Time Chat Application

A modern, responsive, real-time messaging web application built with the **MERN** stack (**MongoDB**, **Express**, **React 19**, **Node.js**) powered by **Socket.io** for instantaneous bi-directional communication.

---

## ✨ Features

- **⚡ Instant Real-Time Messaging**: Real-time message synchronization between online users with zero page reloads via Socket.io.
- **🟢 Live Online/Offline Status**: Real-time user presence detection with green online pulse indicators.
- **🔔 Dynamic Unread Counters**: Visual unread message count badges for each contact that automatically increment on incoming messages and clear when the chat is opened.
- **🔊 Audio Notifications**: Sound alert played on arrival of new incoming messages.
- **🎨 Glassmorphic & Responsive UI**: Sleek dark-mode aesthetic with frosted glass headers, tailored gradients, and full mobile + desktop responsiveness.
- **🎭 Smart Avatar Fallback Engine**: Dynamic avatar generator with Dicebear SVG integration and fallback to name initials over customized gradient backgrounds.
- **🔒 Secure Authentication**: JWT (JSON Web Tokens) stored securely in `httpOnly` cookies with bcryptjs password encryption.
- **👀 Seen Receipts**: Automatic real-time status updates marking messages as read when recipient opens conversation.

---

## 🛠️ Tech Stack

### **Frontend**
- **Library**: React 19 (Vite)
- **Styling**: Tailwind CSS v4
- **Routing**: React Router DOM v7
- **Real-Time Client**: Socket.io-client
- **Icons**: React Icons (`react-icons/io5`, `react-icons/ai`, etc.)
- **Notifications**: React Hot Toast

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express 5
- **Database**: MongoDB with Mongoose ODM
- **Real-Time Engine**: Socket.io (integrated HTTP server)
- **Security & Auth**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, `cors`, `dotenv`
- **Development**: Nodemon

---

## 📁 Project Structure

```text
Chat_application/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection handler
│   ├── controllers/
│   │   ├── messageController.js # Message send, get & mark seen logic
│   │   └── userController.js    # Register, login, logout & contact list logic
│   ├── middleware/
│   │   └── isAuthenticated.js   # JWT cookie verification middleware
│   ├── models/
│   │   ├── conversationModel.js # Conversation schema (participants & messages)
│   │   ├── messageModel.js      # Message schema (sender, receiver, text, seen)
│   │   └── userModel.js         # User schema (fullName, userName, password, gender, profilePhoto)
│   ├── routes/
│   │   ├── messageRoute.js      # Routes for /api/message
│   │   └── userRoute.js         # Routes for /api/user
│   ├── socket/
│   │   └── socket.js            # Socket.io initialization, online user tracking & events
│   ├── .env.example             # Template for backend environment variables
│   ├── index.js                 # Server entry point & middleware setup
│   └── package.json
│
├── frontend/
│   ├── components/
│   │   ├── Home.jsx             # Main chat layout container
│   │   ├── login.jsx            # Sign-in page
│   │   ├── signup.jsx           # Account registration page
│   │   ├── Message.jsx          # Individual chat bubble component
│   │   ├── MessageContainer.jsx # Active chat viewport, header & message stream
│   │   ├── MessageInput.jsx     # Message input bar with send button
│   │   ├── Sidebar.jsx          # Contacts list, search bar, unread badges & logout
│   │   └── UserAvatar.jsx       # Avatar renderer with fallback engine & status indicator
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # Authenticated user state provider
│   │   │   ├── ChatContext.jsx  # Conversations, messages & unread counts state
│   │   │   └── SocketContext.jsx# Live socket connection & online user list provider
│   │   ├── App.jsx              # Application router setup
│   │   └── main.jsx             # React entry point
│   ├── public/
│   │   └── sound/
│   │       └── notification.mp3 # Sound asset for incoming message alert
│   ├── vite.config.js           # Vite configuration & dev proxy
│   └── package.json
│
├── .gitignore                   # Global Git ignore rules (explicitly tracks README.md)
└── README.md                    # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster connection string)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

---

### 1. Clone the Repository
```bash
git clone https://github.com/ajaykumar4mf/Chat_application.git
cd Chat_application
```

---

### 2. Backend Configuration & Setup

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` configuration file:
   ```bash
   cp .env.example .env
   ```

4. Populate the `.env` variables:
   ```env
   PORT=8080
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET_KEY=your_secure_jwt_secret_key
   NODE_ENV=development
   ```

5. Launch the backend server:
   ```bash
   npm start
   ```
   *The backend will run on `http://localhost:8080` and connect to MongoDB.*

---

### 3. Frontend Configuration & Setup

1. Open a new terminal tab and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run at `http://localhost:5173`.*

---

## 📡 Socket.io Event Architecture

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `connection` | Client ➔ Server | `userId` (query) | Registers client socket and maps user ID to socket ID |
| `getOnlineUsers` | Server ➔ Client | `Array<userId>` | Broadcasts array of active user IDs on any connect/disconnect |
| `newMessage` | Server ➔ Client | `messageObject` | Pushes incoming message to recipient in real-time |
| `messagesSeen` | Server ➔ Client | `{ seenBy }` | Notifies sender that recipient opened the conversation |
| `disconnect` | Client ➔ Server | — | Deregisters disconnected socket and updates online user list |

---

## 🔒 API Endpoints

### Authentication & Users (`/api/user`)
- `POST /api/user/register` — Create a new user account.
- `POST /api/user/login` — Authenticate and receive `httpOnly` JWT cookie.
- `POST /api/user/logout` — Clear auth cookie and terminate session.
- `GET /api/user/` — Fetch list of other registered users with online status and unread count (*Requires Auth*).

### Messages (`/api/message`)
- `POST /api/message/send/:id` — Send a message to user `:id` (*Requires Auth*).
- `GET /api/message/:id` — Retrieve message history between logged-in user and `:id` (*Requires Auth*).
- `POST /api/message/seen/:id` — Mark all unread messages from `:id` as seen (*Requires Auth*).

---

## 🗺️ Step-by-Step Enhancement Roadmap

- [x] **Phase 1: Real-Time Polish**
  - Live typing indicator (`"typing..."` pulse animation)
  - Last message snippet and timestamp in sidebar contacts list
  - Message delivery tick marks (✓ sent, ✓✓ delivered, ✓✓ seen)
- [x] **Phase 2: Message Management**
  - Quoted message replies
  - Emoji reactions on message hover
  - Edit and delete messages ("Delete for everyone")
  - In-chat message search
- [ ] **Phase 3: Rich Media**
  - Image, PDF, and file attachments (via Cloudinary or S3)
  - Voice notes recorder using browser `MediaRecorder` API
  - Fullscreen image lightbox modal
- [ ] **Phase 4: Group Conversations**
  - Multi-user group creation with custom group name and avatar
  - Group admin roles (add/remove members)
  - Broadcast group socket rooms
- [ ] **Phase 5: Notifications & Security**
  - Web Push Notifications for background/minimized tabs
  - Progressive Web App (PWA) offline support
  - User block and report functionality

---

## 🛡️ Git & Ignore Configuration

The root [`.gitignore`](.gitignore) manages all untracked files across both subprojects:
- Ignores root, backend, and frontend `node_modules/`.
- Protects private credentials (`.env`, `.env.*`, `*.local`).
- Ignores build artifacts (`dist/`, `build/`).
- Explicitly protects and tracks documentation via `!README.md`.

---

## 📄 License

This project is licensed under the ISC License.
