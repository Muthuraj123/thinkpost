const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:4000',
        methods: ['GET', 'POST']
    }
});

// Middleware to parse JSON requests
app.use(express.json());

// Listen for new connections from clients
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Optional: Notify the client on connection
    socket.emit('notification', { message: 'Connected to notifications!' });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

module.exports = io;