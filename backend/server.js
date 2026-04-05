require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

function normalizeMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return uri;

  // Fix accidental double-slash DB paths like "...mongodb.net//myhome-worker"
  const hostPrefixMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(\/.*)?$/i);
  if (!hostPrefixMatch) return uri;

  const hostPart = hostPrefixMatch[1];
  const pathAndQuery = hostPrefixMatch[2] || '';
  const [rawPath = '', rawQuery = ''] = pathAndQuery.split('?');
  const normalizedPath = `/${rawPath.replace(/^\/+/, '')}`;
  const queryPart = rawQuery ? `?${rawQuery}` : '';
  return `${hostPart}${normalizedPath}${queryPart}`;
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
// app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/providers', require('./routes/providers'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/chat', require('./routes/chat'));

// Socket.IO
require('./socket')(io);
app.set('io', io);

//server test route
app.get('/', (req, res) => {
  res.send("API is running 🚀");
});

// Connect DB & start server
const mongoUri = normalizeMongoUri(process.env.MONGODB_URI);
if (!mongoUri) {
  console.error('❌ MONGODB_URI is missing');
  process.exit(1);
}
if (mongoUri !== process.env.MONGODB_URI) {
  console.warn('⚠️ Normalized MONGODB_URI path to avoid invalid Mongo namespace');
}

mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 MyHome Worker running on http://localhost:${process.env.PORT || 5000}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = { app, io };
