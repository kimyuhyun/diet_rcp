const express = require("express");
const router = express.Router();
const utils = require("../common/utils");
const middleware = require("../common/middleware");

// 허용된 정렬 컬럼과 방향 정의
const ALLOWED_ORDER_COLUMNS = ["idx", "created", "modified", "like_cnt", "see_cnt", "reply_cnt"];
const ALLOWED_ORDER_DIRECTIONS = ["ASC", "DESC"];
const ALLOWED_SEARCH_COLUMNS = ["title", "memo", "name1"]; // 허용할 컬럼만

// 안전한 ORDER BY 절 생성 함수
function getSafeOrderBy(orderby) {
    if (!orderby) return "idx DESC";

    const parts = orderby.trim().split(/\s+/);
    if (parts.length !== 2) return "idx DESC";

    const column = parts[0];
    const direction = parts[1].toUpperCase();

    if (ALLOWED_ORDER_COLUMNS.includes(column) && ALLOWED_ORDER_DIRECTIONS.includes(direction)) {
        return `${column} ${direction}`;
    }

    return "idx DESC";
}

router.get("/:board_id", middleware.tokenVerify, async function (req, res, next) {
    const board_id = req.params.board_id;
    let { id, search_column, search_value, orderby, page, is_wrote_only } = req.query;

    let where = `WHERE A.board_id = ? AND A.step = 1 AND A.is_use = 1`;
    const records = [board_id];

    // 내가 쓴 글만 보기
    if (id && is_wrote_only == 1) {
        where += ` AND A.id = ?`;
        records.push(id);
    }

    // 검색 컬럼 필터링 (화이트리스트)
    const ALLOWED_SEARCH_COLUMNS = ["title", "memo", "name1"];
    if (ALLOWED_SEARCH_COLUMNS.includes(search_column)) {
        where += ` AND A.${search_column} LIKE ?`;
        records.push(`%${search_value}%`);
    }

    const safeOrderBy = getSafeOrderBy(orderby);

    try {
        // 총 개수 가져오기 (차단된 글 제외)
        const countSql = `
            SELECT COUNT(*) AS cnt FROM (
                SELECT A.idx
                FROM BOARD_tbl A
                LEFT JOIN BOARD_BLOCK_tbl BB
                    ON A.idx = BB.board_idx AND BB.id = ?
                ${where}
                GROUP BY A.idx
                HAVING COUNT(BB.board_idx) = 0
            ) AS sub
        `;
        const [countObj] = await utils.queryResult(countSql, [id, ...records]);
        if (!countObj || countObj.cnt == 0) {
            return res.json({ list: [], page_helper: {} });
        }

        const pageHelper = utils.pageHelper(page, countObj.cnt ?? 0);
        records.push(pageHelper.skipSize);
        records.push(pageHelper.contentSize);

        // 본문 리스트 조회
        const listSql = `
            SELECT 
                A.idx, A.board_id, A.id, A.title, A.memo, A.name1, A.comment,
                A.filename0, A.filename1, A.filename2, A.filename3, A.filename4,
                A.filename5, A.filename6, A.filename7, A.filename8, A.filename9,
                A.created, A.modified,
                IFNULL(B.reply_cnt, 0) AS reply_cnt,
                IFNULL(C.like_cnt, 0) AS like_cnt,
                IFNULL(D.see_cnt, 0) AS see_cnt,
                IFNULL(E.is_like, 0) AS is_like,
                IFNULL(F.is_block, 0) AS is_block,
                M.filename0 AS user_thumb
            FROM BOARD_tbl A
            LEFT JOIN (
                SELECT parent_idx, COUNT(*) AS reply_cnt
                FROM BOARD_tbl
                WHERE step = 2
                GROUP BY parent_idx
            ) B ON A.idx = B.parent_idx
            LEFT JOIN (
                SELECT board_idx, COUNT(*) AS like_cnt
                FROM BOARD_LIKE_tbl
                GROUP BY board_idx
            ) C ON A.idx = C.board_idx
            LEFT JOIN (
                SELECT board_idx, COUNT(*) AS see_cnt
                FROM BOARD_SEE_tbl
                GROUP BY board_idx
            ) D ON A.idx = D.board_idx
            LEFT JOIN (
                SELECT board_idx, COUNT(*) AS is_like
                FROM BOARD_LIKE_tbl
                WHERE id = ?
                GROUP BY board_idx
            ) E ON A.idx = E.board_idx
            LEFT JOIN (
                SELECT board_idx, COUNT(*) AS is_block
                FROM BOARD_BLOCK_tbl
                WHERE id = ?
                GROUP BY board_idx
            ) F ON A.idx = F.board_idx
            LEFT JOIN MEMB_tbl M ON A.id = M.id
            ${where}
            HAVING is_block = 0
            ORDER BY ${safeOrderBy}
            LIMIT ?, ?
        `;
        const listArr = await utils.queryResult(listSql, [id, id, ...records]);

        // 시간 변환 및 수정 가능 여부 추가
        for (const item of listArr) {
            item.created = utils.utilConvertToMillis(item.created);
            if (item.modified) {
                item.modified = utils.utilConvertToMillis(item.modified);
            }
            item.is_modify = item.id === id ? 1 : 0;
        }

        res.json({
            list: listArr,
            page_helper: pageHelper,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "게시글 목록 조회 중 오류가 발생했습니다." });
    }
});

router.get("/:idx/:id", middleware.tokenVerify, async function (req, res, next) {
    const idx = req.params.idx;
    const id = req.params.id;

    //조회수 업데이트
    var sql = "SELECT COUNT(*) as cnt FROM BOARD_SEE_tbl WHERE id = ? AND board_idx = ?";
    var arr = await utils.queryResult(sql, [id, idx]);
    var obj = arr[0];
    if (obj.cnt == 0) {
        sql = "INSERT INTO BOARD_SEE_tbl SET id = ?, board_idx = ?";
        arr = await utils.queryResult(sql, [id, idx]);
        // console.log(arr);
    }
    //

    sql = `
        SELECT
            A.*,
            (SELECT COUNT(*) FROM BOARD_tbl WHERE parent_idx = A.idx AND step = 2) as reply_cnt,
            (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx) as like_cnt,
            (SELECT COUNT(*) FROM BOARD_SEE_tbl WHERE board_idx = A.idx) as see_cnt,
            (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx AND id = ?) as is_like,
            (SELECT COUNT(*) FROM BOARD_BLOCK_tbl WHERE board_idx = A.idx AND id = ?) as is_block,
            (SELECT filename0 FROM MEMB_tbl WHERE id = A.id) as user_thumb
        FROM
        BOARD_tbl as A
        WHERE idx = ?
        AND is_use = 1
    `;
    arr = await utils.queryResult(sql, [id, id, idx]);
    obj = arr[0];

    if (!obj) {
        res.json({ code: 0, msg: "존재하지 않는 게시글입니다." });
        return;
    }

    obj.code = 1;
    obj.is_modify = 0;
    if (obj.id == id) {
        obj.is_modify = 1;
    }
    obj.created = utils.utilConvertToMillis(obj.created);
    if (obj.modified) {
        obj.modified = utils.utilConvertToMillis(obj.modified);
    }
    res.json(obj);
});

router.get("/reply_list/:idx/:id", middleware.tokenVerify, async function (req, res, next) {
    const idx = req.params.idx; // 부모 게시글 ID
    const id = req.params.id; // 로그인한 유저 ID
    const sort1 = req.query.sort1;
    const page = req.query.page || 1;

    try {
        // 댓글 수 구하기 (step = 2)
        const countSql = `SELECT COUNT(*) AS cnt FROM BOARD_tbl WHERE step = 2 AND parent_idx = ?`;
        const [countObj] = await utils.queryResult(countSql, [idx]);
        const pageHelper = utils.pageHelper(page, countObj?.cnt ?? 0);

        // 댓글 목록 가져오기 (step = 2)
        const commentSql = `
            SELECT 
                A.idx, A.parent_idx, A.board_id, A.id, A.name1, A.step, A.memo, A.mention,
                A.filename0, A.created, A.modified, A.is_use,
                IFNULL(B.like_cnt, 0) AS like_cnt,
                IFNULL(C.is_like, 0) AS is_like,
                IFNULL(D.is_block, 0) AS is_block,
                IFNULL(E.reply_cnt, 0) AS reply_cnt,
                M.filename0 AS user_thumb
            FROM BOARD_tbl A
            LEFT JOIN (
                SELECT board_idx, COUNT(*) AS like_cnt
                FROM BOARD_LIKE_tbl
                GROUP BY board_idx
            ) B ON A.idx = B.board_idx
            LEFT JOIN (
                SELECT board_idx, COUNT(*) AS is_like
                FROM BOARD_LIKE_tbl
                WHERE id = ?
                GROUP BY board_idx
            ) C ON A.idx = C.board_idx
            LEFT JOIN (
                SELECT board_idx, COUNT(*) AS is_block
                FROM BOARD_BLOCK_tbl
                WHERE id = ?
                GROUP BY board_idx
            ) D ON A.idx = D.board_idx
            LEFT JOIN (
                SELECT parent_idx, COUNT(*) AS reply_cnt
                FROM BOARD_tbl
                WHERE step = 3
                GROUP BY parent_idx
            ) E ON A.idx = E.parent_idx
            LEFT JOIN MEMB_tbl M ON A.id = M.id
            WHERE A.step = 2 AND A.parent_idx = ?
            ORDER BY A.idx DESC
            LIMIT ?, ?
        `;
        const commentRecords = [id, id, idx, pageHelper.skipSize, pageHelper.contentSize];
        let comments = await utils.queryResult(commentSql, commentRecords);

        if (sort1 === "time") {
            comments.reverse();
        }

        const newArr = [];

        for (const comment of comments) {
            comment.group_id = comment.idx;
            comment.created = utils.utilConvertToMillis(comment.created);
            if (comment.modified) {
                comment.modified = utils.utilConvertToMillis(comment.modified);
            }
            comment.is_modify = comment.id === id ? 1 : 0;
            newArr.push(comment);

            // 대댓글이 3개 초과일 경우 "이전 대댓글 N개 더보기" 추가
            if (comment.reply_cnt > 3) {
                newArr.push({
                    group_id: comment.idx,
                    idx: "",
                    parent_idx: comment.idx,
                    board_id: "",
                    id: "",
                    name1: "",
                    step: 4,
                    memo: `이전 대댓글 ${comment.reply_cnt - 3}개 더보기`,
                    mention: "",
                    filename0: "",
                    created: "",
                    modified: "",
                    is_use: 1,
                    like_cnt: 0,
                    is_like: 0,
                    is_block: 0,
                    reply_cnt: 0,
                    user_thumb: "",
                    is_modify: 0,
                });
            }

            // 대댓글 3개만 가져오기 (step = 3)
            const replyCountSql = `SELECT COUNT(*) AS cnt FROM BOARD_tbl WHERE step = 3 AND parent_idx = ?`;
            const [replyCountObj] = await utils.queryResult(replyCountSql, [comment.idx]);
            const totalReplyCnt = replyCountObj?.cnt ?? 0;
            const offset = Math.max(0, totalReplyCnt - 3);

            const replySql = `
                SELECT 
                    A.idx, A.parent_idx, A.board_id, A.id, A.name1, A.step, A.memo, A.mention,
                    A.filename0, A.created, A.modified, A.is_use,
                    IFNULL(B.like_cnt, 0) AS like_cnt,
                    IFNULL(C.is_like, 0) AS is_like,
                    IFNULL(D.is_block, 0) AS is_block,
                    M.filename0 AS user_thumb
                FROM BOARD_tbl A
                LEFT JOIN (
                    SELECT board_idx, COUNT(*) AS like_cnt
                    FROM BOARD_LIKE_tbl
                    GROUP BY board_idx
                ) B ON A.idx = B.board_idx
                LEFT JOIN (
                    SELECT board_idx, COUNT(*) AS is_like
                    FROM BOARD_LIKE_tbl
                    WHERE id = ?
                    GROUP BY board_idx
                ) C ON A.idx = C.board_idx
                LEFT JOIN (
                    SELECT board_idx, COUNT(*) AS is_block
                    FROM BOARD_BLOCK_tbl
                    WHERE id = ?
                    GROUP BY board_idx
                ) D ON A.idx = D.board_idx
                LEFT JOIN MEMB_tbl M ON A.id = M.id
                WHERE A.step = 3 AND A.parent_idx = ?
                ORDER BY A.idx ASC
                LIMIT 3 OFFSET ?
            `;

            let replyArr = [];
            try {
                replyArr = await utils.queryResult(replySql, [id, id, comment.idx, offset]);
            } catch (err) {
                console.error("대댓글 조회 오류:", err);
            }

            if (Array.isArray(replyArr)) {
                for (const reply of replyArr) {
                    reply.group_id = comment.idx;
                    reply.created = utils.utilConvertToMillis(reply.created);
                    if (reply.modified) {
                        reply.modified = utils.utilConvertToMillis(reply.modified);
                    }
                    reply.is_modify = reply.id === id ? 1 : 0;
                    reply.reply_cnt = 0;
                    newArr.push(reply);
                }
            }
        }

        res.json({
            list: newArr,
            page_helper: pageHelper,
        });
    } catch (err) {
        console.error("댓글 목록 전체 조회 실패:", err);
        res.status(500).json({ msg: "댓글 목록 조회 중 오류 발생" });
    }
});

router.get("/reply_detail/:parent_idx/:id", middleware.tokenVerify, async function (req, res, next) {
    const parent_idx = req.params.parent_idx; // 댓글 ID (step = 2)
    const id = req.params.id; // 현재 로그인 유저 ID

    try {
        // 1. 댓글 상세 정보 (step = 2)
        const commentSql = `
            SELECT 
                A.idx, A.parent_idx, A.board_id, A.id, A.name1, A.step, A.memo, A.mention,
                A.filename0, A.created, A.modified, A.is_use,
                IFNULL(B.like_cnt, 0) AS like_cnt,
                IFNULL(C.is_like, 0) AS is_like,
                IFNULL(D.is_block, 0) AS is_block,
                IFNULL(E.reply_cnt, 0) AS reply_cnt,
                M.filename0 AS user_thumb
            FROM BOARD_tbl A
            LEFT JOIN (
                SELECT board_idx, COUNT(*) AS like_cnt
                FROM BOARD_LIKE_tbl
                GROUP BY board_idx
            ) B ON A.idx = B.board_idx
            LEFT JOIN (
                SELECT board_idx, COUNT(*) AS is_like
                FROM BOARD_LIKE_tbl
                WHERE id = ?
                GROUP BY board_idx
            ) C ON A.idx = C.board_idx
            LEFT JOIN (
                SELECT board_idx, COUNT(*) AS is_block
                FROM BOARD_BLOCK_tbl
                WHERE id = ?
                GROUP BY board_idx
            ) D ON A.idx = D.board_idx
            LEFT JOIN (
                SELECT parent_idx, COUNT(*) AS reply_cnt
                FROM BOARD_tbl
                WHERE step = 3
                GROUP BY parent_idx
            ) E ON A.idx = E.parent_idx
            LEFT JOIN MEMB_tbl M ON A.id = M.id
            WHERE A.step = 2 AND A.idx = ?
        `;
        const [comment] = await utils.queryResult(commentSql, [id, id, parent_idx]);

        if (!comment) {
            return res.json({ list: [] });
        }

        comment.group_id = comment.idx;
        comment.created = utils.utilConvertToMillis(comment.created);
        if (comment.modified) {
            comment.modified = utils.utilConvertToMillis(comment.modified);
        }
        comment.is_modify = comment.id === id ? 1 : 0;

        const newArr = [comment];

        // 2. 대댓글 전체 조회 (step = 3)
        const replySql = `
            SELECT 
                A.idx, A.parent_idx, A.board_id, A.id, A.name1, A.step, A.memo, A.mention,
                A.filename0, A.created, A.modified, A.is_use,
                IFNULL(B.like_cnt, 0) AS like_cnt,
                IFNULL(C.is_like, 0) AS is_like,
                IFNULL(D.is_block, 0) AS is_block,
                M.filename0 AS user_thumb
            FROM BOARD_tbl A
            LEFT JOIN (
                SELECT board_idx, COUNT(*) AS like_cnt
                FROM BOARD_LIKE_tbl
                GROUP BY board_idx
            ) B ON A.idx = B.board_idx
            LEFT JOIN (
                SELECT board_idx, COUNT(*) AS is_like
                FROM BOARD_LIKE_tbl
                WHERE id = ?
                GROUP BY board_idx
            ) C ON A.idx = C.board_idx
            LEFT JOIN (
                SELECT board_idx, COUNT(*) AS is_block
                FROM BOARD_BLOCK_tbl
                WHERE id = ?
                GROUP BY board_idx
            ) D ON A.idx = D.board_idx
            LEFT JOIN MEMB_tbl M ON A.id = M.id
            WHERE A.step = 3 AND A.parent_idx = ?
            ORDER BY A.idx ASC
        `;
        let replyArr = [];
        try {
            replyArr = await utils.queryResult(replySql, [id, id, comment.idx]);
        } catch (err) {
            console.error("대댓글 전체 조회 실패:", err);
        }

        if (Array.isArray(replyArr)) {
            for (const reply of replyArr) {
                reply.group_id = comment.idx;
                reply.created = utils.utilConvertToMillis(reply.created);
                if (reply.modified) {
                    reply.modified = utils.utilConvertToMillis(reply.modified);
                }
                reply.is_modify = reply.id === id ? 1 : 0;
                reply.reply_cnt = 0;
                newArr.push(reply);
            }
        }

        res.json({ list: newArr });
    } catch (err) {
        console.error("댓글 상세 조회 실패:", err);
        res.status(500).json({ msg: "댓글 상세 조회 중 오류가 발생했습니다." });
    }
});

router.get("/set_like/:idx/:id", middleware.tokenVerify, async function (req, res, next) {
    const idx = req.params.idx;
    const id = req.params.id;

    try {
        // 좋아요 상태 토글
        const checkSql = `SELECT COUNT(*) as cnt FROM BOARD_LIKE_tbl WHERE board_idx = ? AND id = ?`;
        const [checkObj] = await utils.queryResult(checkSql, [idx, id]);

        const likeSql =
            checkObj.cnt === 0
                ? `INSERT INTO BOARD_LIKE_tbl (board_idx, id) VALUES (?, ?)`
                : `DELETE FROM BOARD_LIKE_tbl WHERE board_idx = ? AND id = ?`;
        await utils.queryResult(likeSql, [idx, id]);

        // 최종 결과 단일 쿼리
        const finalSql = `
            SELECT 
                COUNT(*) as like_cnt,
                SUM(CASE WHEN id = ? THEN 1 ELSE 0 END) as is_like
            FROM BOARD_LIKE_tbl 
            WHERE board_idx = ?
        `;
        const [finalObj] = await utils.queryResult(finalSql, [id, idx]);

        res.json({
            like_cnt: finalObj.like_cnt,
            is_like: finalObj.is_like,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "좋아요 처리 중 오류 발생" });
    }
});

router.get("/set_aricle_push/:parent_idx", middleware.tokenVerify, async function (req, res, next) {
    var parent_idx = req.params.parent_idx;
    var dest_id = "";
    var writer = "";
    var board_id = "";
    var step = 0;
    var tmp_idx = 0;

    //항상 상위 댓글 작성자에게 푸시가 날라간다!
    var sql = `SELECT parent_idx, id, board_id, step FROM BOARD_tbl WHERE idx = ? `;
    var arr = await utils.queryResult(sql, parent_idx);
    var obj = arr[0];
    if (!obj) {
        res.json({ result: false });
        return;
    }

    dest_id = obj.id;
    tmp_idx = obj.parent_idx;
    step = obj.step;
    writer = obj.id;
    board_id = obj.board_id;

    if (step == 2) {
        //최 상위글을 찾는다!!!
        parent_idx = tmp_idx;

        console.log(parent_idx);

        sql = `SELECT idx, id, board_id, step FROM BOARD_tbl WHERE idx = ? `;
        arr = await utils.queryResult(sql, parent_idx);
        obj = arr[0];
        if (!obj) {
            res.json({ result: false });
            return;
        }
        tmp_idx = obj.idx;
        writer = obj.id;
    }

    const result = await utils.sendArticlePush(
        dest_id,
        "등록하신 게시물에 댓글이 등록되었습니다.",
        parent_idx,
        writer,
        board_id
    );
    res.json(result);
});

module.exports = router;
