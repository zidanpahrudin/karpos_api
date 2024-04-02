const Crypto = require("crypto");
require("dotenv").config();

function encrypt_string(
    plain_text,
    encryptionMethod = process.env.ENCRIPTMETHOD,
    secret = process.env.SECRETKEY,
    secret_iv = process.env.SECRETIV
    ) {
    
    const key = Crypto.createHash('sha512').update(secret, 'utf-8').digest('hex').substr(0, 32);
    const iv = Crypto.createHash('sha512').update(secret_iv, 'utf-8').digest('hex').substr(0, 16);

    var encryptor = Crypto.createCipheriv(encryptionMethod, key, iv);
    var aes_encrypted = encryptor.update(plain_text, 'utf8', 'base64') + encryptor.final('base64');
    return Buffer.from(aes_encrypted).toString('base64');
}

module.exports = encrypt_string;
