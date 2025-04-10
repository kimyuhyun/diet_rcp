const express = require("express");
const router = express.Router();
const utils = require("../common/utils");
const jwt = require("../common/jwt");
const middlewear = require("../common/middleware");
const moment = require("moment");

router.post("/login", async (req, res, next) => {
    const { id, pw } = req.body;
    const sql = `SELECT idx, id, name1, level1, filename0 FROM MEMB_tbl WHERE id = ? AND pass1 = PASSWORD(?)`;
    const arr = await utils.queryResult(sql, [id, pw]);
    const obj = arr[0];

    if (!obj) {
        res.json({
            code: 0,
            msg: "아이디/패스워드가 일치 하지 않습니다.",
        });
        return;
    }

    if (obj.level1 > 2) {
        res.json({
            code: 0,
            msg: "접근권한이 없습니다.",
        });
        return;
    }

    // JWT 토근 발급
    const accessToken = jwt.sign(obj);
    const refreshToken = jwt.refresh();

    res.json({
        id: obj.id,
        name1: obj.name1,
        access_token: accessToken,
        refresh_token: refreshToken,
    });
});

router.post("/info", middlewear.tokenVerify, async function (req, res, next) {
    const token = req.headers.authorization.split("Bearer ")[1]; // header에서 access token을 가져옵니다.
    const info = jwt.decode(token);
    res.json(info);
});

router.post("/access_token_verify", middlewear.tokenVerify, async function (req, res, next) {
    const token = req.headers.authorization.split("Bearer ")[1]; // header에서 access token을 가져옵니다.
    const info = jwt.verify(token);
    res.json(info);
});

router.post("/refresh_token_verify", async function (req, res, next) {
    const refreshToken = req.headers["refresh_token"];
    if (!refreshToken) {
        res.json({
            code: 0,
            msg: "Refresh is empty.",
        });
        return;
    }
    const obj = jwt.verify(refreshToken);
    if (obj.ok) {
        const accessToken = req.headers.authorization.split("Bearer ")[1];
        const info = jwt.decode(accessToken);
        delete info["iat"];
        delete info["exp"];

        // 리프레시 토큰은 유효하다! access token 다시 발급
        const newAccessToken = jwt.sign(info);
        res.json({
            code: 1,
            info,
            access_token: newAccessToken,
            refresh_token: refreshToken,
        });
        return;
    } else {
        res.json({
            code: 0,
        });
    }
});

module.exports = router;
