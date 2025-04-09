import './index.css' // 반드시 있어야 Tailwind가 적용됨
import { Routes, Route } from "react-router-dom";
import { getAccessToken, getRefreshToken } from "../common/common";
import Index from "./pages/Index";
import RcpList from "./pages/adm/RcpList";
import Main from "./pages/adm/Main";
import NotFound from "./pages/NotFound";
import Login from "./Login";

export default function App() {
    console.log(getAccessToken());
    console.log(getRefreshToken());

    if (getAccessToken() === "undefined") {
        console.log("ASDASD");
        
    }

    return (
        <Routes>
            {getAccessToken() && getRefreshToken() ? (
                <>  
					<Route path="/adm" element={<Main />}></Route>
                    <Route path="/adm/rcp_list" element={<RcpList />} />
                    <Route path="*" element={<NotFound />}></Route>
                </>
            ) : (
                <>
                    <Route path="/" element={<Index />} />
                    <Route path="*" element={<NotFound />}></Route>
                    <Route path="/login" element={<Login />}></Route>
                </>
            )}
        </Routes>
    );
}
