const menu = [
    {
        icon: "user",
        title: "회원관리",
        child: [
            {
                title: "권한 관리",
                link: "/adm/grade",
            },
            {
                title: "관리자 관리",
                link: "/adm/manager",
            },
            {
                title: "회원 관리",
                link: "/adm/user",
            },
        ],
    },
    {
        icon: "code",
        title: "코드관리",
        child: [
            {
                title: "코드관리",
                link: "/adm/codes",
            },
        ],
    },
    {
        icon: "dashboard",
        title: "게시판",
        child: [
            {
                title: "공지사항",
                link: "/adm/article/notice",
            },
            {
                title: "고객센터",
                link: "/adm/article/cscenter",
            },
            {
                title: "신고",
                link: "/adm/article/singo",
            },
            {
                title: "thyrocare",
                link: "/adm/article/thyrocare",
            },
        ],
    },
    {
        icon: "chart",
        title: "통계",
        child: [
            {
                title: "전체방문자",
                link: "/adm/analyzer/graph1",
            },
            {
                title: "트래픽수",
                link: "/adm/analyzer/graph2",
            },
            {
                title: "시간대별",
                link: "/adm/analyzer/graph3",
            },
            {
                title: "현재접속자",
                link: "/adm/liveuser",
            },
        ],
    },
];
export default menu;
