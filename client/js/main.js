const SERVER = "http://localhost:5001";

let socket;
let roomId;
let username;

let sharedKey = null;
let isAdmin = false;
let myId = null;
let adminName = null;


// ==========================
// AES KEY FROM PASSKEY
// ==========================

function generateSharedKey(passkey) {
    sharedKey = CryptoJS.SHA256(passkey).toString();
    console.log("✅ Shared AES Key:", sharedKey);
}


// ==========================
// ENCRYPT / DECRYPT
// ==========================

function encryptMessage(message) {
    if (!sharedKey) {
        alert("Key not ready");
        return null;
    }
    return CryptoJS.AES.encrypt(message, sharedKey).toString();
}

function decryptMessage(encrypted) {
    if (!sharedKey) return "[Encrypted]";
    const bytes = CryptoJS.AES.decrypt(encrypted, sharedKey);
    return bytes.toString(CryptoJS.enc.Utf8);
}


// ==========================
// CREATE ROOM (FIXED)
// ==========================

async function createRoom() {

    console.log("🔥 Button Clicked"); // DEBUG

    const admin = document.getElementById("username").value;

    if (!admin) {
        alert("Enter name");
        return;
    }

    try {

        const res = await fetch(`${SERVER}/api/rooms/createRoom`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ admin })
        });

        console.log("Response received");

        const data = await res.json();

        console.log(data);

        document.getElementById("result").innerHTML =
            `Room ID: ${data.roomId}<br>Passkey: ${data.passkey}`;

        // SAVE ADMIN DATA
        localStorage.setItem("roomId", data.roomId);
        localStorage.setItem("username", admin);
        localStorage.setItem("passkey", data.passkey);
        localStorage.setItem("admin", admin);

        // REDIRECT
        setTimeout(() => {
            window.location.href = "chat.html";
        }, 1500);

    } catch (err) {
        console.log("ERROR:", err);
    }
}


// ==========================
// JOIN ROOM
// ==========================

async function joinRoom() {

    username = document.getElementById("username").value;
    roomId = document.getElementById("roomId").value;
    const passkey = document.getElementById("passkey").value.trim().toUpperCase();

    const res = await fetch(`${SERVER}/api/rooms/joinRoom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, passkey })
    });

    const data = await res.json();

    if (data.success) {

        localStorage.setItem("roomId", roomId);
        localStorage.setItem("username", username);
        localStorage.setItem("passkey", passkey);
        localStorage.setItem("admin", data.admin);

        window.location.href = "chat.html";

    } else {
        alert("Wrong passkey");
    }
}


// ==========================
// CHAT PAGE
// ==========================

if (window.location.pathname.includes("chat.html")) {

    socket = io(SERVER);

    roomId = localStorage.getItem("roomId");
    username = localStorage.getItem("username");
    const passkey = localStorage.getItem("passkey");
    adminName = localStorage.getItem("admin");

    generateSharedKey(passkey);

    socket.emit("joinRoom", {
        roomId,
        username,
        admin: adminName,
        key: passkey
    });

    socket.on("connect", () => {
        myId = socket.id;
    });

    // ADMIN CHECK
    if (username === adminName) {
        isAdmin = true;

        const adminDiv = document.getElementById("admin-info");
        if (adminDiv) {
            adminDiv.innerHTML =
                `👑 Admin Panel <br> Room ID: ${roomId} | Key: ${passkey}`;
        }
    }

    // USER LIST
    socket.on("userList", (users) => {

        const ul = document.getElementById("users");
        if (!ul) return;

        ul.innerHTML = "";

        users.forEach(user => {

            const li = document.createElement("li");
            li.innerText = user.username;

            if (isAdmin && user.id !== myId) {

                const btn = document.createElement("button");
                btn.innerText = "Kick";
                btn.style.marginLeft = "10px";

                btn.onclick = () => {
                    socket.emit("kickUser", {
                        roomId,
                        targetId: user.id
                    });
                };

                li.appendChild(btn);
            }

            ul.appendChild(li);
        });
    });

    // RECEIVE MESSAGE
    socket.on("receiveMessage", (data) => {

        const decrypted = decryptMessage(data.encryptedMessage);

        const div = document.createElement("div");
        div.classList.add("message");

        div.innerHTML =
            `<b>${data.username}</b>: ${decrypted}`;

        document.getElementById("messages").appendChild(div);
    });

    // KICKED
    socket.on("kicked", () => {
        alert("❌ You were kicked");
        window.location.href = "index.html";
    });
}


// ==========================
// SEND MESSAGE
// ==========================

function sendMessage() {

    const input = document.getElementById("messageInput");

    if (!input.value) return;

    const encrypted = encryptMessage(input.value);

    socket.emit("sendMessage", {
        roomId,
        username,
        encryptedMessage: encrypted
    });

    input.value = "";
}


// ==========================
// 🔥 STEP 2 FIX (IMPORTANT)
// ==========================

// Make functions accessible to HTML buttons
window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.sendMessage = sendMessage;