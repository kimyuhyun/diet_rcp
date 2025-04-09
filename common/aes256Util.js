const CryptoJS = require("crypto-js");

module.exports = {
    encrypt: (text) => {
        try {
            // const secretkey = process.env.CRYPTO_KEY; //Length 16
            // const key = CryptoJS.enc.Utf8.parse(secretkey);
            // const iv = CryptoJS.enc.Utf8.parse(secretkey.substring(0, 16));
            // const cipherText = CryptoJS.AES.encrypt(`${text}`, key, {
            //     iv: iv,
            //     mode: CryptoJS.mode.CBC,
            //     padding: CryptoJS.pad.Pkcs7,
            // }).toString();
            // return cipherText;
            const secretkey = process.env.CRYPTO_KEY; //Length 16
            const key = CryptoJS.enc.Utf8.parse(secretkey);
            const iv = CryptoJS.enc.Utf8.parse(Buffer.alloc(16, 0));
            const cipherText = CryptoJS.AES.encrypt(`${text}`, key, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            }).toString();
            return cipherText;
        } catch (err) {
            console.log(err);
            return "";
        }
    },
    decrypt: (text) => {
        try {
            // const secretkey = process.env.CRYPTO_KEY; //Length 16
            // const key = CryptoJS.enc.Utf8.parse(secretkey);
            // const iv = CryptoJS.enc.Utf8.parse(secretkey.substring(0, 16));
            // const decrypted = CryptoJS.AES.decrypt(`${text}`, key, {
            //     iv: iv,
            //     mode: CryptoJS.mode.CBC,
            //     padding: CryptoJS.pad.Pkcs7,
            // });
            // text = decrypted.toString(CryptoJS.enc.Utf8);
            // return text;
            const secretkey = process.env.CRYPTO_KEY; //Length 16
            const key = CryptoJS.enc.Utf8.parse(secretkey);
            const iv = CryptoJS.enc.Utf8.parse(Buffer.alloc(16, 0));
            const decrypted = CryptoJS.AES.decrypt(`${text}`, key, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            });
            text = decrypted.toString(CryptoJS.enc.Utf8);
            return text;
        } catch (err) {
            console.log(err);
            return "";
        }
    },
};
