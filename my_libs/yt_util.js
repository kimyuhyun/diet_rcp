const { YoutubeTranscript } = require("youtube-transcript");
const axios = require("axios");
const cheerio = require("cheerio");

const openaiSummary = require("./openai_summary");
const geminiSummary = require("./gemini_summary");

async function getVideoDescriptionWithoutAPI(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            },
        });

        const html = response.data;
        const initialPlayerResponseMatch = html.match(/var ytInitialPlayerResponse = ({.*?});<\/script>/);

        if (!initialPlayerResponseMatch) {
            throw new Error("ytInitialPlayerResponse를 찾을 수 없습니다.");
        }

        const playerResponse = JSON.parse(initialPlayerResponseMatch[1]);
        const description = playerResponse.videoDetails?.shortDescription;

        return description || "";
    } catch (error) {
        console.error("설명글을 불러오는 데 실패했습니다:", error.message);
        return null;
    }
}

async function getTranscript(url) {
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(url);
        var text = "";
        // console.log("자막 내용:");
        transcript.forEach((item) => {
            // const startTime = item.start !== undefined ? item.start.toFixed(2) : "??";
            text += `${item.text} `;
        });
        return text;
    } catch (err) {
        console.error("자막을 불러오는 데 실패했습니다:", err.message);
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
    getVideoDescriptionWithoutAPI,
    getTranscript,
};
