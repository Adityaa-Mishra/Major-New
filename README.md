# ⚡ MyHome Worker — Service Marketplace

A full-stack web application connecting homeowners with skilled local workers (electricians, plumbers, cleaners, and more).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript (Vanilla) |
| Backend | Node.js + Express |
| Database | MongoDB |
| Real-time | Socket.IO |
| Auth | JWT + bcrypt |

---

## 📁 Project Structure

```
myhome-worker/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── ProviderProfile.js
│   │   ├── Booking.js
│   │   └── Message.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── providers.js
│   │   ├── bookings.js
│   │   └── chat.js
│   ├── middleware/
│   │   └── auth.js
│   ├── socket/
│   │   └── index.js
│   ├── .env
│   ├── package.json
│   └── server.js
└── frontend/
    ├── css/
    │   ├── main.css
    │   └── animations.css
    ├── js/
    │   ├── api.js
    │   └── main.js
    ├── pages/
    │   ├── login.html
    │   ├── signup.html
    │   ├── user-dashboard.html
    │   ├── provider-dashboard.html
    │   ├── providers.html
    │   ├── provider-profile.html
    │   └── chat.html
    └── index.html
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ — [Download](https://nodejs.org/)
- **MongoDB** — [Download](https://www.mongodb.com/try/download/community) OR use [MongoDB Atlas](https://www.mongodb.com/atlas) (free cloud)

---

### Step 1 — Install Dependencies

```bash
cd myhome-worker/backend
npm install
```

---

### Step 2 — Configure Environment

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/myhome-worker
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
```

**Using MongoDB Atlas?** Replace `MONGODB_URI` with your Atlas connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/myhome-worker
```

---

### Step 3 — Start MongoDB (if local)

```bash
# On macOS/Linux
mongod --dbpath /data/db

# On Windows
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
```

---

### Step 4 — Start the Server

```bash
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

The app will be available at: **http://localhost:5000**

---

## 🌐 App Pages

| Page | URL |
|---|---|
| Landing Page | `http://localhost:5000` |
| Sign Up | `http://localhost:5000/pages/signup.html` |
| Login | `http://localhost:5000/pages/login.html` |
| Find Workers | `http://localhost:5000/pages/providers.html` |
| User Dashboard | `http://localhost:5000/pages/user-dashboard.html` |
| Provider Dashboard | `http://localhost:5000/pages/provider-dashboard.html` |
| Chat | `http://localhost:5000/pages/chat.html` |

---

## 👥 User Roles

### 🏠 Customer (User)
- Register/login as a **Customer**
- Browse & search providers
- Book a service
- Chat with providers (only users can initiate)
- View booking history
- Leave reviews

### 👷 Provider
- Register/login as a **Provider**
- Complete your profile (skills, rate, bio)
- View and manage booking requests
- Accept or reject bookings
- Chat with customers (reply to existing chats)
- Dashboard with stats

---

## 💬 Real-Time Chat

- Built with **Socket.IO**
- Only customers can initiate chats
- Providers can reply once chat is started
- Features: typing indicators, online status, read receipts, message history
- Messages persist in MongoDB

---

## 🔐 API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PATCH  /api/auth/profile
```

### Providers
```
GET    /api/providers            (search/filter)
GET    /api/providers/:id        (profile)
GET    /api/providers/profile/me (own profile)
PUT    /api/providers/profile    (edit)
POST   /api/providers/:id/review
```

### Bookings
```
POST   /api/bookings
GET    /api/bookings/my
PATCH  /api/bookings/:id/status
```

### Chat
```
GET    /api/chat/conversations
GET    /api/chat/:userId
POST   /api/chat/:userId
```

---

## 🎨 Features

- ✅ Glassmorphism UI with light theme
- ✅ Smooth scroll reveal animations
- ✅ 3D card tilt hover effects
- ✅ Floating blob backgrounds
- ✅ WhatsApp-style chat UI
- ✅ Typing indicators + online status
- ✅ Toast notifications
- ✅ Skeleton loading states
- ✅ Fully responsive (mobile + desktop)
- ✅ JWT authentication
- ✅ bcrypt password hashing
- ✅ Real-time with Socket.IO

---

## 🐛 Troubleshooting

**MongoDB connection error:**
- Make sure MongoDB is running locally, or update MONGODB_URI to Atlas

**Port already in use:**
- Change PORT in .env to another port (e.g., 3001)

**Socket.IO not connecting:**
- Make sure the backend is running on port 5000
- Check browser console for errors

**CORS errors:**
- The backend allows all origins by default. For production, restrict in server.js

---

## 📦 Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.3",
  "socket.io": "^4.6.1",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1"
}
```
