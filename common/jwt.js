const jwt = require("jsonwebtoken");
const secret = process.env.CRYPTO_KEY;

module.exports = {
    sign: (obj) => {
        // access token 발급
        const payload = {
            // access token에 들어갈 payload
            idx: obj.idx,
            id: obj.id,
            name1: obj.name1,
            level1: obj.level1,
        };

        return jwt.sign(payload, secret, {
            algorithm: "HS256", // 암호화 알고리즘
            expiresIn: "24h", // 유효기간
            // expiresIn: "5s", // 유효기간
        });
    },
    verify: (token) => {
        // access token 검증
        var obj = null;
        try {
            obj = jwt.verify(token, secret);
            return {
                code: 1,
                idx: obj.idx,
                id: obj.id,
                name1: obj.name1,
                level1: obj.level1,
            };
        } catch (err) {
            return {
                code: 0,
                message: err.message,
            };
        }
    },
    decode: (token) => {
        const obj = jwt.decode(token);
        return obj;
    },
    refresh: () => {
        // refresh token 발급
        return jwt.sign({}, secret, {
            // refresh token은 payload 없이 발급
            algorithm: "HS256",
            expiresIn: "14d",
            // expiresIn: "10s",
        });
    },
};
