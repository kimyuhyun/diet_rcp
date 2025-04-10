require("dotenv").config();
const { GoogleGenAI, Type } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const systemMessage = `
- 음식 요리 레시피가 아니면 아무것도 출력하지말아주세요.
- 재료는 따로 분류해주시고, 존칭어로 작성해주세요.
- 레시피에 어울리는 소개글을 'soge'에 포함시켜주세요. 
- 각 instruction value 안에 재료는 재료의 capacity 도 붙여서 넣어주세요. 예) 마늘(2쪽)은 잘게 다지고 청홍고추(약간)는 얇게 슬라이스한다. 
- 재료를 보고 적당한 인분 수를 servings 에 넣어줘. 
- servings는 숫자만 나오게 해주세요.
- 재료의 capacity가 g라면 상황에 맞게 g옆에 (갯수), (T), (컵) 으로 변경해주세요. 
- category 는 (찜/조림,볶음/구이,무침,국/탕,찌개,밥/죽/떡,전/튀김,면/만두,양념/소스/잼,김치/젓갈/장류,샐러드,빵,과자,차/음료/술,다이어트,디저트,퓨전,원팬,양식,스프,기타) 중에 하나 선택해줘.
- difficulty 1 ~ 5 점 사이 숫자만 나오게 해줘.
- tags 추출은 ingredients 안의 재료에서 핵심 재료 1~2개 추출 해줘.
- 재료의 용량을 실용적인 단위로 변환하여 g옆에 추가 하여 json 으로 출력 해줘.
- 고춧가루 관련 용량은 g단위보다는 T나 컵 단위로 표시
- 필요시 괄호 안에 g 표기 (예: "2T(20g)")
- 다른 재료들도 최대한 실생활에서 사용하는 단위로 변경
- 무/배추 → 개나 포기
- 쪽파/미나리/갓 → 단
- 마늘/생강 → T
- 액젓류 → T나 컵
- 찹쌀풀 → 컵
- 토마토소스 → 컵
- 생크림 → 컵
- 우유 → 컵
- steps -> instruction 안의 내용에도 재료의 실용적은 용량을 표기 (예: "(2T, 20g)") 해주세요.
- 모든 항목에서 재료의 용량이 g 이면 직관적으로 모르니 실용적인 용량으로 변경 해주세요. 제발!!
`;

async function main(message) {
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: message.trim(),
        config: {
            systemInstruction: systemMessage.trim(),
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    // 레시피 제목: 필수 문자열 필드
                    title: {
                        type: Type.STRING,
                        description: "Name of the recipe",
                        nullable: false,
                    },
                    // 레시피 소개: 필수 문자열 필드
                    soge: {
                        type: Type.STRING,
                        description: "Description of the recipe",
                        nullable: false,
                    },
                    // 인분 수: 필수 문자열 필드
                    servings: {
                        type: Type.STRING,
                        description: "Number of servings",
                        nullable: false,
                    },
                    // 난이도: 필수 문자열 필드
                    difficulty: {
                        type: Type.STRING,
                        description: "Difficulty level",
                        nullable: false,
                    },
                    // 조리 시간: 필수 문자열 필드
                    cooking_time: {
                        type: Type.STRING,
                        description: "Time required for cooking",
                        nullable: false,
                    },
                    // 태그: 필수 문자열 필드 (쉼표로 구분된 태그들)
                    tags: {
                        type: Type.STRING,
                        description: "Tags for the recipe",
                        nullable: false,
                    },
                    // 카테고리: 필수 문자열 필드
                    category: {
                        type: Type.STRING,
                        description: "Category of the recipe",
                        nullable: false,
                    },
                    // 칼로리: 필수 문자열 필드
                    calories: {
                        type: Type.STRING,
                        description: "Calories per serving",
                        nullable: false,
                    },
                    // 탄수화물: 필수 문자열 필드
                    carbs: {
                        type: Type.STRING,
                        description: "Carbohydrates per serving",
                        nullable: false,
                    },
                    // 지방: 필수 문자열 필드
                    fat: {
                        type: Type.STRING,
                        description: "Fat per serving",
                        nullable: false,
                    },
                    // 단백질: 필수 문자열 필드
                    protein: {
                        type: Type.STRING,
                        description: "Protein per serving",
                        nullable: false,
                    },
                    // 재료 정보: 객체 타입으로 세 가지 카테고리(주재료, 양념, 기타)로 구분됨
                    ingredients: {
                        type: Type.OBJECT,
                        description: "Recipe ingredients categorized into main, seasoning, and etc",
                        properties: {
                            // 주재료: 배열 형태로 각 항목은 재료명(item)과 용량(capacity)을 포함
                            main: {
                                type: Type.ARRAY,
                                description: "Main ingredients list",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        item: {
                                            type: Type.STRING,
                                            description: "Name of the ingredient",
                                            nullable: false,
                                        },
                                        capacity: {
                                            type: Type.STRING,
                                            description: "Amount or measurement of the ingredient",
                                            nullable: false,
                                        },
                                    },
                                    required: ["item", "capacity"],
                                },
                            },
                            // 양념: 배열 형태로 각 항목은 재료명(item)과 용량(capacity)을 포함
                            seasoning: {
                                type: Type.ARRAY,
                                description: "Seasoning ingredients list",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        item: {
                                            type: Type.STRING,
                                            description: "Name of the seasoning",
                                            nullable: false,
                                        },
                                        capacity: {
                                            type: Type.STRING,
                                            description: "Amount or measurement of the seasoning",
                                            nullable: false,
                                        },
                                    },
                                    required: ["item", "capacity"],
                                },
                            },
                            // 기타 재료: 배열 형태로 각 항목은 재료명(item)과 용량(capacity)을 포함
                            etc: {
                                type: Type.ARRAY,
                                description: "Additional ingredients list",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        item: {
                                            type: Type.STRING,
                                            description: "Name of the additional ingredient",
                                            nullable: false,
                                        },
                                        capacity: {
                                            type: Type.STRING,
                                            description: "Amount or measurement of the additional ingredient",
                                            nullable: false,
                                        },
                                    },
                                    required: ["item", "capacity"],
                                },
                            },
                        },
                        required: ["main", "seasoning", "etc"],
                    },
                    // 조리 단계: 배열 형태로 각 단계는 제목, 지시사항, 팁을 포함
                    steps: {
                        type: Type.ARRAY,
                        description: "Cooking procedure steps",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: {
                                    type: Type.STRING,
                                    description: "Title or name of the step",
                                    nullable: false,
                                },
                                instruction: {
                                    type: Type.STRING,
                                    description: "Detailed cooking instructions for this step",
                                    nullable: false,
                                },
                                tips: {
                                    type: Type.STRING,
                                    description: "Helpful tips or notes for this cooking step",
                                    nullable: false,
                                },
                            },
                            required: ["title", "instruction", "tips"],
                        },
                    },
                },
                required: [
                    "title",
                    "soge",
                    "servings",
                    "difficulty",
                    "cooking_time",
                    "tags",
                    "category",
                    "ingredients",
                    "steps",
                ],
            },
        },
    });
    // console.log(response.text);

    // 문자열을 JavaScript 객체로 파싱
    const jsonObj = JSON.parse(response.text);

    // 다시 JSON 문자열로 변환하되, 깔끔하게 포맷팅 (들여쓰기 2칸)
    const prettyJson = JSON.stringify(jsonObj, null, 2);
    return prettyJson;
}

// (async () => {
//     const message = `
//         4cAj_n0PWaw
//         [최요비] 1분 레시피 | 발사믹무절임 | 이재훈
//         [ 발사믹무절임 ]

//         1. 무(100g) 손가락 크기로 썬 뒤 대파(30g), 샐러리(15g), 생강(10g) 큼직하게 썰기
//         2. 냄비에 발사믹식초(¼컵/50ml), 진간장(2T), 물(2T), 설탕(50g) 넣어 저은 뒤 샐러리, 대파, 생강, 페페론치노(3개) 넣어 한소끔 끓이기
//         3. 체로 건더기 건져낸 뒤 절임 국물 식히기
//         4. 밀폐 용기에 무, 식힌 절임 국물 담은 뒤 하루 정도 절이기
//         5. 그릇에 발사믹무절임 담기

//         #EBS최고의요리비결 #1분레시피 #피클만들기
//         #발사믹무절임 #광희 #집밥 #반찬만들기 #요리브이로그
// `;
//     const result = await main(message.trim());
//     console.log(result);

// })();

module.exports = {
    main,
};
