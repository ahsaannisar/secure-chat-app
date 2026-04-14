const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({

    roomId: {
        type: String,
        required: true,
        unique: true
    },

    passkeyHash: {
        type: String,
        required: true
    },

    admin: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Room", RoomSchema);
