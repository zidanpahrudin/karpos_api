const Crypto = require("crypto");


function decrypt_string(
    encryptedMessage,
    encryptionMethod = process.env.ENCRIPTMETHOD,
    secret_key = process.env.SECRETKEY,
    secret_iv = process.env.SECRETIV
    ) {
        
    const key = Crypto.createHash('sha512').update(secret_key, 'utf-8').digest('hex').substr(0, 32);
    const iv = Crypto.createHash('sha512').update(secret_iv, 'utf-8').digest('hex').substr(0, 16);
        
    const buff = Buffer.from(encryptedMessage, 'base64');
    encryptedMessage = buff.toString('utf-8');
    var decryptor = Crypto.createDecipheriv(encryptionMethod, key, iv);
    return decryptor.update(encryptedMessage, 'base64', 'utf8') + decryptor.final('utf8');
};


module.exports = decrypt_string;