const tokenManager = require("./tokenManager");
const jwt = require("./jwt");

const tokenVerify = async (req, res, next) => {
    // 개발 모드!
    if (req.query.token == process.env.DEV_KEY) {
        next();
        return;
    }

    if (req.headers["token"]) {
        // 앱으로 접속!
        const token = req.headers["token"];
        const obj = tokenManager.checkToken(token);
        if (!obj.result) {
            res.json({
                code: 0,
                msg: obj.msg,
            });
            return;
        }
    } else {
        // 웹으로 접속!
        if (!req.headers.authorization) {
            res.json({
                code: 0,
                msg: "Your token is empty.",
            });
            return;
        }

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.json({
                code: 0,
                msg: "Invalid Authorization header.",
            });
            return;
        }
        const token = authHeader.split("Bearer ")[1];
        let obj;
        try {
            obj = jwt.verify(token);
        } catch (e) {
            res.json({
                code: 0,
                msg: "Token verification failed.",
            });
            return;
        }

        if (obj.code === 0) {
            // 검증에 실패하거나 토큰이 만료되었다면 클라이언트에게 메세지를 담아서 응답합니다.
            res.json({
                code: 0,
                msg: "Your token has expired...",
            });
            return;
        }
        const o = jwt.decode(token);
        if (!o) {
            res.json({
                code: 0,
                msg: "Invalid token payload.",
            });
            return;
        }
        req.id = o.id;
        req.name1 = o.name1;
        req.level1 = o.level1;
    }
    next();
};

const userAgentCheck = async (req, res, next) => {
    //user-agent 체크!
    // console.log(req.headers);
    const agent = req.headers["user-agent"] || "";
    if (agent.includes("Post") || agent.includes("axios") || agent.includes("curl")) {
        res.json({ code: 0, msg: "Error" });
        return;
    }
    next();
};

module.exports = {
    tokenVerify,
    userAgentCheck,
};
