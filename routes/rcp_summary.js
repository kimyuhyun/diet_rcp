const express = require("express");
const router = express.Router();
const utils = require("../common/utils");
const moment = require("moment");
const middleware = require("../common/middleware");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
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

    // 내용이 너무 길면 잘라내기
    const maxContentLength = 15000; // API 제한 고려

    // 자막과 설명 합치기
    const allContent = `${descriptionText}\n\n${transcriptText}`;

    // 길이 제한 적용
    const truncatedContent =
        allContent.length > maxContentLength ? allContent.substring(0, maxContentLength) + "..." : allContent;

    console.log(lang, truncatedContent);

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
    try {
        // Puppeteer 불러오기
        const puppeteer = require("puppeteer");

        // 브라우저 실행
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        try {
            // 새 페이지 열기
            const page = await browser.newPage();

            // 모바일 환경으로 설정
            await page.setUserAgent(
                "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
            );

            // 모바일 뷰포트 설정
            await page.setViewport({
                width: 375,
                height: 812,
                isMobile: true,
                hasTouch: true,
            });

            // 페이지 이동 및 로드 완료 대기
            await page.goto(url, {
                waitUntil: "networkidle2",
                timeout: 30000, // 30초 타임아웃
            });

            // 리다이렉트를 위한 추가 대기 시간 (5초)
            await new Promise((resolve) => setTimeout(resolve, 5000));

            // 페이지가 완전히 로드될 때까지 대기
            await page.waitForFunction('document.readyState === "complete"', { timeout: 30000 });

            // 리다이렉트 후 최종 URL 가져오기
            const finalUrl = page.url();
            console.log("최종 URL:", finalUrl);

            // 네이버 앱 열기 페이지인 경우 추가 처리
            const isNaverAppPage = await page.evaluate(() => {
                return document.body.textContent.includes("네이버앱 열기");
            });

            if (isNaverAppPage) {
                // referredDstUrl에서 실제 URL 추출 시도
                const targetUrl = await page.evaluate(() => {
                    const hiddenInput = document.getElementById("referredDstUrl");
                    if (hiddenInput) {
                        const value = hiddenInput.value;
                        // naversearchapp://inappbrowser?url=https%3A%2F%2Fm.blog.naver.com%2F... 형식에서 추출
                        const match = value.match(/url=([^&]+)/);
                        if (match && match[1]) {
                            return decodeURIComponent(match[1]);
                        }
                    }
                    return null;
                });

                if (targetUrl) {
                    // 추출한 URL로 다시 이동
                    await page.goto(targetUrl, {
                        waitUntil: "networkidle2",
                        timeout: 30000,
                    });
                    console.log("추출한 URL로 리다이렉트:", targetUrl);
                }
            }

            // 페이지 내용 추출
            let content = await page.evaluate(() => {
                // 모바일 환경 선택자 (모바일에 최적화된 선택자 우선)
                const selectors = [
                    // 네이버 모바일 블로그 선택자
                    ".se_component_wrap",
                    ".se-main-container",
                    ".post_ct",
                    // 일반 모바일 사이트 선택자
                    "article",
                    ".post-content",
                    ".entry-content",
                    ".content",
                    ".recipe-content",
                    ".recipe",
                    ".post",
                    "main",
                ];

                // 제목 추출
                const title = document.title || "";

                // 컨텐츠 추출
                let content = "";
                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        // 모든 매칭 요소의 텍스트 결합
                        content = Array.from(elements)
                            .map((el) => el.textContent.trim())
                            .join("\n\n");
                        break;
                    }
                }

                // 컨텐츠를 찾지 못한 경우 body 전체 내용 추출
                if (!content) {
                    content = document.body.textContent.trim();
                }

                return { title, content };
            });

            // 내용이 없거나 앱 열기 페이지인 경우
            if (!content.content || content.content.trim().length === 0 || content.content.includes("네이버앱 열기")) {
                result.message = MESSAGE.NO_DESCRIPTION;
                return result;
            }

            // 내용이 너무 길면 잘라내기
            const maxContentLength = 15000;
            const truncatedContent =
                content.content.length > maxContentLength
                    ? content.content.substring(0, maxContentLength) + "..."
                    : content.content;

            console.log(lang, truncatedContent);

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
        } finally {
            // 브라우저 종료 (리소스 정리)
            await browser.close();
        }
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
