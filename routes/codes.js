const express = require("express");
const router = express.Router();
const db = require("../common/db");
const utils = require("../common/utils");
const middleware = require("../common/middleware");

router.get("/", middleware.tokenVerify, async (req, res, next) => {
    const arr = [];
    const codeLength2Arr = [];
    const codeLength4Arr = [];
    const codeLength6Arr = [];
    const codesArr = [];
    const sortArr = [];

    codesArr.push("root");
    sortArr.push("9999");

    const sql = `SELECT sort1, code1, name1 as name FROM CODES_tbl`;
    const tmpArr = await utils.queryResult(sql, []);

    for (const obj of tmpArr) {
        if (obj.code1.length == 2) {
            codeLength2Arr.push(obj);
        } else if (obj.code1.length == 4) {
            codeLength4Arr.push(obj);
        } else if (obj.code1.length == 6) {
            codeLength6Arr.push(obj);
        }
    }

    codeLength2Arr.sort((a, b) => b.sort1 - a.sort1);
    codeLength4Arr.sort((a, b) => b.sort1 - a.sort1);
    codeLength6Arr.sort((a, b) => b.sort1 - a.sort1);

    for (const step1 of codeLength2Arr) {
        codesArr.push(step1.code1);
        sortArr.push(step1.sort1);
        step1.children = []

        for (const step2 of codeLength4Arr) {
            if (step1.code1 == step2.code1.substr(0, 2)) {
                codesArr.push(step2.code1);
                sortArr.push(step2.sort1);

                step2.children = []
                for (const step3 of codeLength6Arr) {
                    if (step2.code1 == step3.code1.substr(0, 4)) {
                        codesArr.push(step3.code1);
                        sortArr.push(step3.sort1);

                        step2.children.push(step3)
                    }
                }
                step1.children.push(step2)
            }
        }
        arr.push(step1)
    }

    dummy = {
        sort1:0,
        code1:0,
        name1:""
    }
    arr.push(dummy)
    

    res.json({
        list: {
            id: "0",
            name: "root",
            code: "root",
            parent: "0",
            children: arr,
        },
        codes: [...codesArr],
        sorts: [...sortArr],
    });
});

router.post("/update", middleware.tokenVerify, async function (req, res, next) {
    const { code1, name1, sort1 } = req.body;
    const sql = `UPDATE CODES_tbl SET name1 = ?, sort1 = ? WHERE code1 = ?`;
    const arr = await utils.queryResult(sql, [name1, sort1, code1]);
    res.json(arr);
});

router.post("/add", middleware.tokenVerify, async function (req, res, next) {
    const parentCode = req.body.code1;
    const codeLength = parentCode.length;
    var code = "";

    var sql = "";
    var params;
    if (parentCode == "root") {
        sql = ` SELECT code1, sort1 FROM CODES_tbl WHERE LENGTH(code1) = 2 ORDER BY code1 DESC LIMIT 0, 1`;
        params = [];
    } else {
        sql = ` SELECT code1, sort1 FROM CODES_tbl WHERE LEFT(code1, ?) = ? AND LENGTH(code1) = ? ORDER BY code1 DESC LIMIT 0, 1`;
        params = [codeLength, parentCode, eval(codeLength + 2)];
    }

    console.log(sql, params);

    var arr = await utils.queryResult(sql, params);
    var data = arr[0];
    if (data) {
        console.log(data.code1.length);
        if (data.code1.length == 2) {
            code = eval(data.code1) + 1;
            if (code < 10) {
                code = `0${code}`;
            }
            db.query(`INSERT INTO CODES_tbl SET code1 = ?, name1 = ?, sort1 = ?`, [code, code, code]);
        } else if (data.code1.length == 4) {
            code = data.code1.substr(2, 2);
            code = eval(code) + 1;
            if (code < 10) {
                code = `0${code}`;
            }
            code = `${parentCode}${code}`;
            db.query(`INSERT INTO CODES_tbl SET code1 = ?, name1 = ?, sort1 = ?`, [code, code, code]);
        } else if (data.code1.length == 6) {
            code = data.code1.substr(4, 2);
            code = eval(code) + 1;
            if (code < 10) {
                code = `0${code}`;
            }
            code = `${parentCode}${code}`;
            db.query(`INSERT INTO CODES_tbl SET code1 = ?, name1 = ?, sort1 = ?`, [code, code, code]);
        } else if (data.code1.length == 8) {
            code = data.code1.substr(6, 2);
            code = eval(code) + 1;
            if (code < 10) {
                code = `0${code}`;
            }
            code = `${parentCode}${code}`;
            db.query(`INSERT INTO CODES_tbl SET code1 = ?, name1 = ?, sort1 = ?`, [code, code, code]);
        }
    } else {
        if (parentCode == "root") {
            code = "01";
        } else if (parentCode.length == 2) {
            code = `${parentCode}01`;
        } else if (parentCode.length == 4) {
            code = `${parentCode}01`;
        } else if (parentCode.length == 6) {
            code = `${parentCode}01`;
        } else {
            return;
        }
        db.query(`INSERT INTO CODES_tbl SET code1 = ?, name1 = ?, sort1 = ?`, [code, code, code]);
    }
    res.json({ code });
});

router.post("/del", middleware.tokenVerify, async function (req, res, next) {
    const code1 = req.body.code1;
    const sql = "DELETE FROM CODES_tbl WHERE code1 = ?";
    const arr = await utils.queryResult(sql, [code1]);
    res.json(arr);
});

module.exports = router;
