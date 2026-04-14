// ================================
// IMPORTS
// ================================

const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// 🔥 IMPORTANT: ROUTES
const roomRoutes = require("./routes/roomRoutes");

// ================================
// APP SETUP
// ================================

const app = express();
const server = http.createServer(app);

const io = socketio(server, {
    cors: { origin: "*" }
});

// ================================
// MIDDLEWARE
// ================================

app.use(cors());
app.use(express.json());

// ✅ CONNECT ROUTES (FIXED YOUR ERROR)
app.use("/api/rooms", roomRoutes);

// ✅ SERVE FRONTEND
app.use(express.static(path.join(__dirname, "../client")));

// ================================
// MONGODB
// ================================

mongoose.connect("mongodb://127.0.0.1:27017/securechat")
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ MongoDB Error:", err));

// ================================
// ROOM STORAGE (RUNTIME)
// ================================

const rooms = {};

// ================================
// SOCKET.IO
// ================================

io.on("connection", (socket) => {

    console.log("🔵 Connected:", socket.id);

    // ================================
    // JOIN ROOM
    // ================================

    socket.on("joinRoom", ({ roomId, username, admin, key }) => {

        socket.join(roomId);

        // Create room if not exists
        if (!rooms[roomId]) {
            rooms[roomId] = {
                admin: admin || username,
                key: key,
                users: []
            };
        }

        rooms[roomId].users.push({
            id: socket.id,
            username
        });

        // Send room info
        socket.emit("roomData", {
            roomId,
            admin: rooms[roomId].admin,
            key: rooms[roomId].key,
            users: rooms[roomId].users
        });

        // Send user list
        io.to(roomId).emit("userList", rooms[roomId].users);
    });

    // ================================
    // 🔐 AES MESSAGE (UNCHANGED)
    // ================================

    socket.on("sendMessage", (data) => {
        io.to(data.roomId).emit("receiveMessage", data);
    });

    // ================================
    // 🔑 DIFFIE-HELLMAN (UNCHANGED)
    // ================================

    socket.on("publicKey", ({ roomId, publicKey, username }) => {

        socket.to(roomId).emit("receivePublicKey", {
            publicKey,
            username
        });

    });

    // ================================
    // ❌ KICK USER
    // ================================

    socket.on("kickUser", ({ roomId, targetId }) => {

        const room = rooms[roomId];
        if (!room) return;

        const requester = room.users.find(u => u.id === socket.id);

        if (requester && requester.username === room.admin) {

            io.to(targetId).emit("kicked");

            room.users = room.users.filter(u => u.id !== targetId);

            io.to(roomId).emit("userList", room.users);
        }
    });

    // ================================
    // DISCONNECT
    // ================================

    socket.on("disconnect", () => {

        for (let roomId in rooms) {
            rooms[roomId].users = rooms[roomId].users.filter(
                u => u.id !== socket.id
            );

            io.to(roomId).emit("userList", rooms[roomId].users);
        }

        console.log("🔴 Disconnected:", socket.id);
    });

});

// ================================
// START SERVER
// ================================

const PORT = 5001;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});