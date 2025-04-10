const express = require("express");
const router = express.Router();
const jwt = require("../common/jwt");
const utils = require("../common/utils");
const middleware = require("../common/middleware");

router.get("/read", middleware.tokenVerify, async function (req, res, next) {
    const { idx, table } = req.query;

    var row = {};

    if (idx) {
        const sql = `SELECT * FROM ?? WHERE idx = ?`;
        const arr = await utils.queryResult(sql, [table, idx]);
        row = arr[0];
    }
    res.json(row);
});

router.post("/write", middleware.tokenVerify, middleware.userAgentCheck, async function (req, res, next) {
    const table = req.body.table;
    const idx = req.body.idx;

    delete req.body.table;
    delete req.body.idx;

    var isDateColnumn = true;
    var isIdColumn = true;

    //날짜 컬럼이 있는지 확인!
    var sql = `SHOW COLUMNS FROM ?? LIKE 'created'`;
    var arr = await utils.queryResult(sql, [table]);
    if (!arr[0]) {
        isDateColnumn = false;
    }

    // 아이디 컬럼이 있는지 확인!
    sql = `SHOW COLUMNS FROM ?? LIKE 'created'`;
    arr = await utils.queryResult(sql, [table]);
    if (!arr[0]) {
        isIdColumn = false;
    }
    if (isIdColumn) {
        // jwt 에서 가져온 ID 값임....
        if (req.id) {
            req.body["id"] = req.id;
            req.body["name1"] = req.name1;
        }
    }

    const records = [];
    records.push(table);

    sql = "";
    for (key in req.body) {
        if (req.body[key] != "null") {
            if (key == "pass1") {
                if (req.body[key]) {
                    sql += key + "= PASSWORD(?), ";
                    records.push(req.body[key]);
                }
            } else {
                sql += key + "= ?, ";
                records.push(req.body[key]);
            }
        }
    }

    if (idx) {
        records.push(idx);
        if (isDateColnumn) {
            sql = `UPDATE ?? SET ${sql} modified = NOW() WHERE idx = ?`;
        } else {
            sql = `UPDATE ?? SET ${sql.slice(0, -2)}  WHERE idx = ?`;
        }
    } else {
        if (isDateColnumn) {
            sql = `INSERT INTO ?? SET ${sql} created = NOW(), modified = NOW()`;
        } else {
            sql = `INSERT INTO ?? SET ${sql.slice(0, -2)}`;
        }
    }
    const result = await utils.queryResult(sql, records);
    console.log(result);
    res.json(result);
});

router.post("/delete", middleware.tokenVerify, async function (req, res, next) {
    const table = req.body.table;
    const idxArr = req.body["idx[]"];
    console.log(idxArr);

    if (!idxArr) {
        res.json({
            code: 0,
            msg: "Error.",
        });
        return;
    }

    if (req.level1 > 1) {
        const isMe = await checkMe(table, idxArr, req.id);
        console.log(isMe);

        if (!isMe) {
            res.json({
                code: 0,
                msg: "권한이 없습니다.",
            });
            return;
        }
    }

    const sql = "DELETE FROM ?? WHERE idx = ?";
    if (Array.isArray(idxArr)) {
        for (idx of idxArr) {
            await utils.queryResult(sql, [table, idx]);
        }
    } else {
        await utils.queryResult(sql, [table, idxArr]);
    }

    res.json({
        code: 1,
        msg: "삭제 되었습니다.",
    });
});

router.post("/update_is_use", middleware.tokenVerify, async function (req, res, next) {
    const table = req.body.table;
    const idxArr = req.body["idx[]"];

    if (!idxArr) {
        res.json({
            code: 0,
            msg: "Error.",
        });
        return;
    }

    if (req.level1 > 1) {
        const isMe = await checkMe(table, idxArr, req.id);
        console.log(isMe);

        if (!isMe) {
            res.json({
                code: 0,
                msg: "권한이 없습니다.",
            });
            return;
        }
    }

    const sql = "UPDATE ?? SET is_use = 0 WHERE idx = ?";
    if (Array.isArray(idxArr)) {
        for (idx of idxArr) {
            await utils.queryResult(sql, [table, idx]);
        }
    } else {
        await utils.queryResult(sql, [table, idxArr]);
    }

    res.json({
        code: 1,
        msg: "삭제 되었습니다.",
    });
});

// 본인것인지 확인
const checkMe = async (table, idxArr, id) => {
    const sql = "SELECT count(*) as cnt FROM ?? WHERE idx = ? AND id = ?";
    if (Array.isArray(idxArr)) {
        for (idx of idxArr) {
            const arr = await utils.queryResult(sql, [table, idx, id]);
            if (arr[0].cnt == 0) {
                return false;
            }
        }
    } else {
        const arr = await utils.queryResult(sql, [table, idxArr, id]);
        if (arr[0].cnt == 0) {
            return false;
        }
    }
    return true;
};

module.exports = router;
