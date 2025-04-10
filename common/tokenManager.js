const aes256Util = require("./aes256Util");

module.exports = {
    getToken: () => {
        const after2s = Date.now() + 2000;
        return aes256Util.encrypt(after2s);
    },

    getToken10s: () => {
        const after10s = Date.now() + 10000;
        return aes256Util.encrypt(after10s);
    },
    checkToken: (token) => {
        let tmp;
        try {
            tmp = aes256Util.decrypt(token);
        } catch (e) {
            return {
                result: false,
                msg: "Decryption failed.",
            };
        }
        
        const decryptedToken = parseFloat(tmp);

        if (isNaN(decryptedToken)) {
            return {
                result: false,
                msg: "Invalid token format.",
            };
        }

        const now = Date.now();

        if (process.env.NODE_ENV !== "production") {
            console.log("now: ", now, "decryptedToken: ", decryptedToken);
        }

        if (now < decryptedToken) {
            return {
                result: true,
                msg: "token ok",
            };
        }

        console.log(`Token fail, Now: ${formatUnixTimestamp(now)}, token: ${formatUnixTimestamp(decryptedToken)}`);
        return {
            result: false,
            msg: `Your token has expired...Now: ${formatUnixTimestamp(now)}, token: ${formatUnixTimestamp(
                decryptedToken
            )}`,
        };
    },
};

function formatUnixTimestamp(unixTimestamp) {
    const date = new Date(unixTimestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
