const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Create an Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins (update for production)
        methods: ["GET", "POST"]
    }
});

// Map to store connected users and their sockets
const users = {};

// Serve a simple message on the base URL
app.get('/', (req, res) => {
    res.send("Socket.IO Chat Server is running.");
});

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle user joining the chat
    socket.on('join', (username) => {
        users[username] = socket.id; // Map username to socket ID
        io.emit('userList', Object.keys(users)); // Send updated user list to all clients
        io.emit('message', { user: "System", text: `${username} joined the chat.` });
        console.log(`${username} joined the chat.`);
       /*  if (!users.includes(username)) {
            users.push(username);
            socket.username = username;
            io.emit('userList', users); // Broadcast the updated user list
          } */
    });

   // io.emit('userList', Object.keys(users)); // Send updated user list to all clients

    // Handle sending a private message
    socket.on('sendPrivateMessage', (data) => {
        const { recipient, text } = data;
        const recipientSocketId = users[recipient];
        
        if (recipientSocketId) {
            // Send the message only to the recipient
            io.to(recipientSocketId).emit('message', { user: `Private from ${users[socket.id]}`, text });
        } else {
            // Notify sender if recipient is not available
            socket.emit('message', { user: "System", text: `User ${recipient} is not online.` });
        }
    });

    // Handle broadcasting messages
    socket.on('sendMessage', (data) => {
    // Update the list of users
        console.log(Object.keys(users));
        io.emit('userList', Object.keys(users)); 
        io.emit('message', { user: users[socket.id], text: data.text });
    });

    // Handle user disconnecting
    socket.on('disconnect', () => {
        const username = Object.keys(users).find((key) => users[key] === socket.id);
        if (username) {
            delete users[username];
            io.emit('message', { user: "System", text: `${username} left the chat.` });
            io.emit('userList', Object.keys(users));
            console.log(`${username} disconnected.`);
        }
    });
});

// Start the server
const PORT = 4000; // Change port if needed
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
