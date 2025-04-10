require("dotenv").config();
const OpenAI = require("openai");

async function main(lang, text) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" }, // 문자열에서 객체로 수정
        messages: [
            {
                role: "system",
                content: `
Please follow this JSON schema:
"Please respond in ${lang}.",
"Do not output anything if the input is not a food recipe.",
"When the user inputs a recipe text, structure the response using the following JSON format.",
"Organize the cooking steps in order with numbers and include subtitles for each step.",
"Separate the ingredients list and use honorific expressions (e.g., 'Garlic님' instead of 'Garlic').",
"Include a fitting short introduction in the 'soge' field.",
"In each instruction, include the ingredient with its capacity. Example: 'Mince garlic(2 cloves) and thinly slice red and green chili peppers(a little)'.",
"Set an appropriate number for 'servings' based on the quantity of ingredients.",
"If the capacity uses grams(g), convert to practical units like (pieces), (T), or (cup) and show both (e.g., '20g (2T)').",
"'servings' should contain only a number.",
"'difficulty' must be a number between 1 and 5.",
"'tags' should include 1 or 2 key ingredients extracted from the 'ingredients' list.",
"Include nutrition information: 'calories' (kcal), 'carbs' (g), 'fat' (g), 'protein' (g).",
"Convert all ingredient capacities to practical kitchen units, and include grams in parentheses when helpful.",
"For '고춧가루', use T or cup instead of grams (e.g., '2T(20g)').",
"Convert other ingredients into daily-used units:",
"- 무 / 배추 → whole or half",
"- 쪽파 / 미나리 / 갓 → bundle(s)",
"- 마늘 / 생강 → T",
"- 액젓류 → T or cup",
"- 찹쌀풀 / 토마토소스 / 생크림 / 우유 → cup",
"In each instruction step, show the practical capacity as well (e.g., '2T, 20g').",
"Do your best to avoid raw 'g' units and always show a user-friendly format.",
"Strictly adhere to the JSON format below."
{
    'title': '',
    'soge': '',
    'servings': '',
    'difficulty': '',
    'cooking_time': '',
    'calories': '',
    'carbohydrates': '',
    'fat': '',
    'protein': '',
    'tags': '태그1, 태그2',
    'category': '',
    'ingredients': {
        'main': [
            {
                'item': '',
                'capacity': ''
            }
        ],
        'seasoning': [
            {
                'item': '',
                'capacity': ''
            }
        ],
        'etc': [
            {
                'item': '',
                'capacity': ''
            }
        ]
    },
    'steps': [
        {
            'title': '',
            'instruction': '',
            'tips': ''
        }
    ]
}


`,
            },
            {
                role: "user",
                content: text,
            },
        ],
    });

    // JSON 응답을 받아서 그대로 사용 가능
    const result = response.choices[0].message.content;
    
    // 문자열을 JavaScript 객체로 파싱
    const jsonObj = JSON.parse(result);
    return jsonObj;
    
    // 다시 JSON 문자열로 변환하되, 깔끔하게 포맷팅 (들여쓰기 2칸)
    const prettyJson = JSON.stringify(jsonObj, null, 2);
    return prettyJson;
}

// 예시 사용
// (async () => {
//     const userText = `
// 94NmD4U6bO8
// [최요비] 1분 레시피 | 중화풍불고기 | 여경래
// [ 중화풍불고기 ]
//  
// 1. 양파(160g) 얇게 채 썰고 대파(25g) 잘게 다진 뒤 마늘(80g) 으깨기
// 2. 돼지고기(안심/200g) 얇게 편 썰기
// 3. 돼지고기에 진간장(1T), 굴소스(½T), 흰후춧가루(1t), 물(3T) 넣어 버무리기
// 4. 마늘, 대파, 양파 넣어 버무리기
// 5. 팬에 식용유(2T) 넣어 달군 뒤 양념한 돼지고기 넣어 볶다가 참기름(1T) 섞기
// 6. 그릇에 중화풍불고기 담기

// #최요비 #1분레시피#중화풍불고기 #bestrecipe 
// #집밥 #중식요리 #여경래 #황광희 #광희 #kwanghee #제국의아이들
// #반찬만들기 #맛스타그램
// #요리 #레시피 #요리비결
// `;

//     try {
//         const result = await main(userText.trim());
//         console.log(result);
//     } catch (err) {
//         console.error("에러 발생:", err);
//     }
// })();


module.exports = {
    main,
};