const crypto = require("crypto");


// Encrypt message using AES
function encryptMessage(message, secretKey) {

    const iv = crypto.randomBytes(16);

    const key = crypto.createHash("sha256").update(secretKey).digest();

    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    let encrypted = cipher.update(message, "utf8", "hex");

    encrypted += cipher.final("hex");

    return {

        encryptedData: encrypted,

        iv: iv.toString("hex")

    };

}


// Decrypt message
function decryptMessage(encryptedData, secretKey, ivHex) {

    const key = crypto.createHash("sha256").update(secretKey).digest();

    const iv = Buffer.from(ivHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    let decrypted = decipher.update(encryptedData, "hex", "utf8");

    decrypted += decipher.final("utf8");

    return decrypted;

}


module.exports = {

    encryptMessage,
    decryptMessage

};