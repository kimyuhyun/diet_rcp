const express = require("express");
const router = express.Router();
const utils = require("../common/utils");
const moment = require("moment");
const middleware = require("../common/middleware");
const axios = require("axios");
const cheerio = require("cheerio");
const ytUtil = require("../my_libs/yt_util");
const openaiSummary = require("../my_libs/openai_summary");

// 메시지 코드 상수 정의
const MESSAGE = {
    SUCCESS: "SUCCESS",
    URL_EMPTY: "URL_EMPTY",
    NOT_YOUTUBE: "NOT_YOUTUBE",
    NO_TRANSCRIPT: "NO_TRANSCRIPT",
    NO_DESCRIPTION: "NO_DESCRIPTION",
    NOT_RECIPE: "NOT_RECIPE",
    SUMMARY_FAILED: "SUMMARY_FAILED",
    SERVER_ERROR: "SERVER_ERROR",
};

router.get("/:lang", middleware.tokenVerify, async (req, res, next) => {
    try {
        const lang = req.params.lang || "ko";
        const url = req.query.url || "";

        let result = {
            code: 0,
            message: "",
            json_data: {},
        };

        // URL이 비어있는 경우
        if (!url) {
            result.message = MESSAGE.URL_EMPTY;
            return res.json(result);
        }

        const isYoutubeUrl = isYoutube(url);
        if (isYoutubeUrl) {
            result = await extractYoutube(result, lang, url);
        } else {
            // 블로그, 사이트
            result = await extractWebsite(result, lang, url);
        }

        return res.json(result);
    } catch (error) {
        console.error("Error:", error);
        return res.json({
            code: 0,
            message: MESSAGE.SERVER_ERROR,
        });
    }
});

router.post("/:lang", middleware.tokenVerify, async (req, res, next) => {
    try {
        const lang = req.params.lang || "ko";
        const url = req.body.url || "";

        let result = {
            code: 0,
            message: "",
            json_data: {},
        };

        // URL이 비어있는 경우
        if (!url) {
            result.message = MESSAGE.URL_EMPTY;
            return res.json(result);
        }

        const isYoutubeUrl = isYoutube(url);
        if (isYoutubeUrl) {
            result = await extractYoutube(result, lang, url);
        } else {
            // 블로그, 사이트
            result = await extractWebsite(result, lang, url);
        }

        return res.json(result);
    } catch (error) {
        console.error("Error:", error);
        return res.json({
            code: 0,
            message: MESSAGE.SERVER_ERROR,
        });
    }
});

async function extractYoutube(result, lang, url) {
    // 자막 가져오기
    const transcriptText = await ytUtil.getTranscript(url);
    if (!transcriptText) {
        result.message = MESSAGE.NO_TRANSCRIPT;
        return result;
    }

    // 설명 가져오기
    const descriptionText = await ytUtil.getVideoDescriptionWithoutAPI(url);
    if (!descriptionText) {
        result.message = MESSAGE.NO_DESCRIPTION;
        return result;
    }

    // // 성공 케이스
    // result.code = 1;
    // result.message = MESSAGE.SUCCESS;
    // result.json_data = `${transcriptText}\n\n\n${descriptionText}`;

    // return result;

    // 내용이 너무 길면 잘라내기
    const maxContentLength = 15000; // API 제한 고려

    // 자막과 설명 합치기
    const allContent = `${descriptionText}\n\n${transcriptText}`;

    // 길이 제한 적용
    const truncatedContent =
        allContent.length > maxContentLength ? allContent.substring(0, maxContentLength) + "..." : allContent;

    // OpenAI 요약 처리
    const jsonData = await openaiSummary.main(lang, truncatedContent);

    if (!jsonData) {
        result.message = MESSAGE.SUMMARY_FAILED;
        return result;
    }

    if (!jsonData.cooking_time || jsonData.cooking_time === 0 || jsonData.cooking_time === "N/A") {
        result.message = MESSAGE.NOT_RECIPE;
        return result;
    }

    // 성공 케이스
    result.code = 1;
    result.message = MESSAGE.SUCCESS;
    result.json_data = jsonData;

    return result;
}

async function extractWebsite(result, lang, url) {
    console.log("extractWebsite", url);

    try {
        // 웹사이트에 GET 요청 보내기
        const { data } = await axios.get(url);

        // HTML 파싱
        const $ = cheerio.load(data);

        // 스크립트와 스타일 태그 제거
        $("script, style").remove();

        // HTML 태그 제거하고 텍스트만 추출
        // body의 모든 텍스트를 가져옵니다
        let text = $("body").text().trim();
        
        // 여러 줄 공백 제거하고 정리
        text = text.replace(/\n\s*\n/g, "\n").replace(/\s+/g, " ").trim();
        console.log(text);

        // // 내용이 너무 길면 잘라내기
        // const maxContentLength = 15000;
        // const truncatedContent =
        //     data.length > maxContentLength
        //         ? data.substring(0, maxContentLength) + "..."
        //         : data;
        // console.log(lang, truncatedContent);

        // OpenAI 요약 처리
        const jsonData = await openaiSummary.main(lang, text);

        if (!jsonData) {
            result.message = MESSAGE.SUMMARY_FAILED;
            return result;
        }

        if (!jsonData.cooking_time || jsonData.cooking_time === 0 || jsonData.cooking_time === "N/A") {
            result.message = MESSAGE.NOT_RECIPE;
            return result;
        }

        // 성공 케이스
        result.code = 1;
        result.message = MESSAGE.SUCCESS;
        result.json_data = jsonData;

        return result;
    } catch (error) {
        console.error("Website extraction error:", error);
        result.message = MESSAGE.SERVER_ERROR;
        return result;
    }
}

function isYoutube(url) {
    if (!url) return false;
    const youtubeRegex =
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/;
    return youtubeRegex.test(url);
}

module.exports = router;
