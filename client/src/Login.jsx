import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../common/common";
import LoadingSpinner from "./components/LoadingSpinner";

export default function Login({ onLoginSuccess }) {
    const navigate = useNavigate();
    const inputId = useRef();
    const inputPw = useRef();
    const inputRemember = useRef();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        inputId.current.focus();

        const isSave = localStorage.getItem("is_save");
        if (isSave == 1) {
            inputId.current.value = localStorage.getItem("logined_id");
            inputRemember.current.checked = true;
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // 로딩 시작

        // 유용한놈!
        const frm = Object.fromEntries(new FormData(e.target).entries());

        try {
            const response = await fetch(`/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(frm),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.code === 0) {
                alert(data.msg);
                setLoading(false);
                return;
            }

            if (data.access_token) {
                if (frm.remember) {
                    localStorage.setItem("is_save", 1);
                }
                localStorage.setItem("logined_id", data.id);
                localStorage.setItem("logined_name", data.name1);
                setToken(data.access_token, data.refresh_token);
                onLoginSuccess?.();
                navigate("/adm");
            }
        } catch (err) {
            alert("로그인 중 문제가 발생했습니다.");
            console.error(err);
        } finally {
            setLoading(false); // 로딩 종료
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
            <form
                onSubmit={handleSubmit}
                className="bg-white dark:bg-gray-800 shadow-md rounded px-6 py-8 w-full max-w-md transition-colors"
            >
                <div className="flex flex-col space-y-4">
                    <input
                        ref={inputId}
                        type="text"
                        name="id"
                        placeholder="ID"
                        autoComplete="username"
                        required
                        className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        ref={inputPw}
                        type="password"
                        name="pw"
                        placeholder="PW"
                        autoComplete="current-password"
                        required
                        className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center">
                        <input ref={inputRemember} type="checkbox" id="remember" name="remember" className="mr-2" />
                        <label htmlFor="remember" className="text-sm dark:text-gray-200">
                            아이디 기억
                        </label>
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600"
                    >
                        {loading ? <LoadingSpinner text="로그인 중..." /> : "Login"}
                    </button>
                </div>
            </form>
        </div>
    );
}
