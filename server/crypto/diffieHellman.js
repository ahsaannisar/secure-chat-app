const crypto = require("crypto");


// Generate Diffie Hellman keys
function generateKeys() {

    const dh = crypto.createDiffieHellman(2048);

    dh.generateKeys();

    return {

        publicKey: dh.getPublicKey("hex"),

        privateKey: dh.getPrivateKey("hex"),

        prime: dh.getPrime("hex"),

        generator: dh.getGenerator("hex")

    };

}


// Generate shared secret
function generateSharedSecret(prime, generator, privateKey, otherPublicKey) {

    const dh = crypto.createDiffieHellman(

        Buffer.from(prime, "hex"),
        Buffer.from(generator, "hex")

    );

    dh.setPrivateKey(Buffer.from(privateKey, "hex"));

    return dh.computeSecret(Buffer.from(otherPublicKey, "hex"), null, "hex");

}


module.exports = {

    generateKeys,
    generateSharedSecret

};
