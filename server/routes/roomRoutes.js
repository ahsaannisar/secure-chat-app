const express = require("express");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const Room = require("../models/Room");

const router = express.Router();


// ============================
// Create Room (Admin)
// ============================

router.post("/createRoom", async (req, res) => {

    try {

        const { admin } = req.body;

        const passkey = Math.random().toString(36).substring(2, 8).toUpperCase();

        const passkeyHash = await bcrypt.hash(passkey, 10);

        const roomId = uuidv4();

        const newRoom = new Room({
            roomId,
            passkeyHash,
            admin
        });

        await newRoom.save();

        res.json({
            success: true,
            roomId,
            passkey,
            admin
        });

    } catch (err) {

        console.log(err);

        res.json({
            success: false
        });
    }
});


// ============================
// Join Room
// ============================

router.post("/joinRoom", async (req, res) => {

    try {

        const { roomId, passkey } = req.body;

        const room = await Room.findOne({ roomId });

        if (!room) {
            return res.json({
                success: false,
                message: "Room not found"
            });
        }

        const match = await bcrypt.compare(passkey, room.passkeyHash);

        if (!match) {
            return res.json({
                success: false,
                message: "Wrong passkey"
            });
        }

        // ✅ IMPORTANT CHANGE
        res.json({
            success: true,
            message: "Access granted",
            admin: room.admin,   // 👈 send admin
            roomId: room.roomId  // 👈 send roomId
        });

    } catch (err) {

        console.log(err);

        res.json({
            success: false
        });
    }
});

module.exports = router;