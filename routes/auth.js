const express = require("express");
const router = express.Router();
const utils = require("../common/utils");
const moment = require("moment");

router.post("/login", async (req, res, next) => {
    // const sql = `select * from MEMB_tbl`
    // const arr = await utils.queryResult(sql, [])

    console.log("ASDASD");
    

    res.json({
        mode: process.env.NODE_ENV,
        time: moment().format("YYYY-MM-DD HH:mm:ss"),
    });
});

module.exports = router;
