const YTDlpWrap = require("yt-dlp-wrap").default;
const axios = require("axios");

const openaiSummary = require("./openai_summary");
const geminiSummary = require("./gemini_summary");

const path = require("path");
const cookiePath = path.resolve(__dirname, "cookies.txt");

// JSON 형식 자막에서 텍스트만 추출하는 함수
function parseJsonSubtitle(jsonSubtitle) {
    try {
        // 이미 객체인지 확인하고 적절히 처리
        let subtitleData;
        if (typeof jsonSubtitle === "string") {
            // 문자열이면 JSON 파싱
            subtitleData = JSON.parse(jsonSubtitle);
        } else if (typeof jsonSubtitle === "object") {
            // 이미 객체면 그대로 사용
            subtitleData = jsonSubtitle;
        } else {
            throw new Error("지원되지 않는 자막 형식입니다");
        }

        // events 배열에서 자막 텍스트 추출
        const textLines = [];

        if (subtitleData.events) {
            subtitleData.events.forEach((event) => {
                // segs 배열이 있는 이벤트만 처리
                if (event.segs) {
                    // 각 세그먼트의 utf8 텍스트 추출
                    event.segs.forEach((seg) => {
                        if (seg.utf8 && seg.utf8 !== "\n") {
                            // 줄바꿈이 아닌 텍스트만 추출
                            textLines.push(seg.utf8.trim());
                        }
                    });
                }
            });
        }

        // 중복 제거 및 공백 정리
        const text = textLines
            .join(" ")
            .replace(/\[음악\]/g, "") // [음악] 같은 태그 제거
            .replace(/\s+/g, " ") // 연속된 공백 하나로 합치기
            .trim(); // 앞뒤 공백 제거

        return text;
    } catch (e) {
        console.error("JSON 자막 파싱 오류:", e);
        return "";
    }
}

async function getScript(url) {
    try {
        const ytDlp = new YTDlpWrap();
        console.log(cookiePath);

        // 자막 정보 가져오기 - 출력 형식 변경
        const output = await ytDlp.execPromise([
            url,
            "--skip-download",
            "--write-auto-sub",
            "--dump-json", // JSON 형식으로 전체 정보 요청
            "--cookies",
            cookiePath,
        ]);

        // console.log("자막 정보 출력 형식:", typeof output);

        // console.log("@@@@@@", typeof output);

        // 출력이 JSON 형식인지 확인
        let videoInfo;
        try {
            videoInfo = JSON.parse(output);
        } catch (e) {
            console.log("JSON 파싱 실패, 원본 출력:", output.substring(0, 200)); // 처음 200자만 출력
            return "";
        }

        const description = videoInfo.description || "";

        // 자막 정보 추출
        if (!videoInfo.subtitles && !videoInfo.automatic_captions) {
            return "";
        }

        // 자동 자막 또는 일반 자막 선택
        const subtitles = videoInfo.subtitles || {};
        const autoCaptions = videoInfo.automatic_captions || {};

        // 한국어 또는 영어 자막 찾기
        let subtitleUrl = null;

        // 일반 자막에서 먼저 찾기
        if (subtitles.ko) subtitleUrl = subtitles.ko[0]?.url;
        else if (subtitles.en) subtitleUrl = subtitles.en[0]?.url;

        // 없으면 자동 자막에서 찾기
        if (!subtitleUrl) {
            if (autoCaptions.ko) subtitleUrl = autoCaptions.ko[0]?.url;
            else if (autoCaptions.en) subtitleUrl = autoCaptions.en[0]?.url;
        }

        if (!subtitleUrl) {
            return "";
        }

        const { data } = await axios.get(subtitleUrl);
        const transcript = parseJsonSubtitle(data);

        
        
        

        return { transcript, description };
    } catch (err) {
        console.error("자막 추출 오류:", err);
        return null;
    }
}

// (async () => {
//     // 테스트용 유튜브 링크
//     const youtubeUrl = "https://www.youtube.com/watch?v=D74ehjxFOJA";
//     const transcriptText = await getTranscript(youtubeUrl);
//     const descriptionText = await getVideoDescriptionWithoutAPI(youtubeUrl);
//     // console.log(descriptionText);
//     if (transcriptText && descriptionText) {
//         const text = `${descriptionText}\n\n${transcriptText}`;
//         console.log(text);

//         const result = await openaiSummary.main("English", text);
//         // const result = await geminiSummary.main(text);
//         console.log(result);
//     }
// })();

module.exports = {
    getScript,
};
