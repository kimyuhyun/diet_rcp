import { Routes, Route } from "react-router-dom";
import { getAccessToken, getRefreshToken } from "../common/common";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import RcpList from "./pages/adm/RcpList";
import Dashboard from "./pages/adm/Dashboard";
import NotFound from "./pages/NotFound";
import Login from "./Login";
import AdminLayout from "./components/AdminLayout";
import Grade from "./pages/adm/Grade";
import Manager from "./pages/adm/Manager";
import User from "./pages/adm/User";
import Analyzer from "./pages/adm/Analyzer";
import Article from "./pages/adm/Article";
import Mypage from "./pages/adm/Mypage";
import Codes from "./pages/adm/Codes";
import Liveuser from "./pages/adm/LiveUser";

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!(getAccessToken() && getRefreshToken()));

    useEffect(() => {
        // 컴포넌트 마운트 시 다크모드 적용
        // document.documentElement.classList.add("dark");
    }, []);

    return (
        <Routes>
            {isLoggedIn ? (
                <>
                    <Route element={<AdminLayout />}>
                        <Route path="/adm" element={<Dashboard />} />
                        <Route path="/adm/mypage" element={<Mypage />} />
                        <Route path="/adm/grade" element={<Grade />} />
                        <Route path="/adm/manager" element={<Manager />} />
                        <Route path="/adm/user" element={<User />} />
                        <Route path="/adm/article/:board_id" element={<Article />} />
                        <Route path="/adm/analyzer/:gbn" element={<Analyzer />} />
                        <Route path="/adm/codes" element={<Codes />}></Route>
                        <Route path="/adm/liveuser" element={<Liveuser />}></Route>


                        <Route path="/adm/rcp_list" element={<RcpList />} />
                    </Route>
                    <Route path="*" element={<NotFound />}></Route>
                </>
            ) : (
                <>
                    <Route path="/" element={<Index />} />
                </>
            )}
            <Route path="*" element={<NotFound />}></Route>
            <Route path="/login" element={<Login onLoginSuccess={() => setIsLoggedIn(true)} />}></Route>
        </Routes>
    );
}
