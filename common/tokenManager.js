const aes256Util = require("./aes256Util");

module.exports = {
    getToken: () => {
        const after2s = Math.floor(new Date().getTime()) + 2000;
        const token = aes256Util.encrypt(after2s);
        return token;
    },
    getToken10s: () => {
        const after10s = Math.floor(new Date().getTime()) + 10000;
        const token = aes256Util.encrypt(after10s);
        return token;
    },
    checkToken: (token) => {
        const tmp = aes256Util.decrypt(token);
        const decryptedToken = parseFloat(tmp)
        const now = Math.floor(new Date().getTime());
        console.log("now: ", now, "decryptedToken: ", decryptedToken);
        
        if (now < decryptedToken) {
            return {
                result: true,
                msg: "token ok",
            };
        }
        console.log(`Token fail, Now: ${formatUnixTimestamp(now)}, token: ${formatUnixTimestamp(decryptedToken)}`);
        return {
            result: false,
            msg: `Your token has expired...Now: ${formatUnixTimestamp(now)}, token: ${formatUnixTimestamp(decryptedToken)}`,
        };
    },
};

function formatUnixTimestamp(unixTimestamp) {
    const date = new Date(unixTimestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // 월은 0부터 시작하므로 +1 필요
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
