const utils = require("./utils");
const fs = require("fs").promises; // fs.promises 사용
const moment = require("moment-timezone");

const setVisitor = async (req, res, next) => {
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    var sql = `SELECT visit FROM ANALYZER_tbl WHERE ip = ? ORDER BY idx DESC LIMIT 0, 1`;
    var arr = await utils.queryResult(sql, [ip]);
    var obj = arr[0];

    if (obj) {
        sql = `INSERT INTO ANALYZER_tbl SET ip = ?, agent = ?, visit = ?, created = NOW()`;
        var cnt = obj.visit + 1;
        await utils.queryResult(sql, [ip, req.headers["user-agent"], cnt]);
    }

    await deleteOldFiles(); // 오래된 파일 삭제
    await createConnectionFile(ip, req); // 현재 접속자 파일 생성

    next();
};

const deleteOldFiles = async () => {
    try {
        const filelist = await fs.readdir("./liveuser"); // 디렉토리 내 파일 목록 비동기 읽기

        // 모든 파일에 대해 비동기 작업을 병렬로 수행
        const deletionPromises = filelist.map(async (file) => {
            try {
                const data = await fs.readFile(`./liveuser/${file}`, "utf8"); // 파일 내용 비동기 읽기
                if (data && data !== "dummy") {
                    const [timestamp] = data.split("|S|");
                    moment.tz.setDefault("Asia/Seoul");
                    const connTime = moment.unix(timestamp / 1000).format("YYYY-MM-DD HH:mm");
                    const minDiff = moment.duration(moment().diff(moment(connTime))).asMinutes();

                    if (minDiff > 4) {
                        // 4분 이상 경과한 파일 삭제
                        await fs.unlink(`./liveuser/${file}`); // 파일 비동기 삭제
                        console.log(`Deleted: ${file}`);
                    }
                }
            } catch (fileError) {
                console.error(`Error processing file ${file}:`, fileError);
            }
        });

        // 모든 파일 삭제 작업이 완료될 때까지 대기
        await Promise.all(deletionPromises);
    } catch (dirError) {
        console.error("Error reading directory:", dirError);
    }
};

const createConnectionFile = async (ip, req) => {
    const memo = `${Date.now()}|S|${req.baseUrl}${req.path}`;
    try {
        await fs.writeFile(`./liveuser/${ip}`, memo); // 파일 비동기 생성/갱신
        console.log(`Created/Updated file for IP: ${ip}`);
    } catch (writeError) {
        console.error("Error writing file:", writeError);
    }
};

module.exports = {
    setVisitor,
};
