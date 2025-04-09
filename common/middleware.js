const tokenManager = require("./tokenManager");
const jwt = require("./jwt");

const checkToken = async (req, res, next) => {
    next();
    return;
    const token = req.headers["token"];
    if (!token) {
        res.json({
            code: 0,
            msg: "Your token is empty.",
        });
        return;
    }

    const obj = tokenManager.checkToken(token);
    if (!obj.result) {
        res.json({
            code: 0,
            msg: obj.msg,
        });
        return;
    }
    next();
};

const tokenVerify = async (req, res, next) => {
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
        const token = req.headers.authorization.split("Bearer ")[1]; // header에서 access token을 가져옵니다.
        const obj = jwt.verify(token); // token을 검증합니다.
        if (obj.code === 0) {
            // 검증에 실패하거나 토큰이 만료되었다면 클라이언트에게 메세지를 담아서 응답합니다.
            res.json({
                code: 0,
                msg: "Your token has expired...",
            });
            return;
        }
        const o = jwt.decode(token);
        req.id = o.id;
        req.name1 = o.name1;
        req.level1 = o.level1;
    }
    next();
};

const userAgentCheck = async (req, res, next) => {
    //user-agent 체크!
    // console.log(req.headers);
    const agent = req.headers["user-agent"];
    if (agent.includes("Post") || agent.includes("axios") || agent.includes("curl")) {
        res.json({ code: 0, msg: "Error" });
        return;
    }
    next();
};

module.exports = {
    checkToken,
    tokenVerify,
    userAgentCheck,
};
