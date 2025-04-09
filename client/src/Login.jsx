import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { setToken } from "../common/common";

export default function Login() {
    const navigate = useNavigate();
    const inputId = useRef();
    const inputPw = useRef();
    const inputRemember = useRef();

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

        // 유용한놈!
        const frm = Object.fromEntries(new FormData(e.target).entries());

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

        console.log(data);

        if (data.code === 0) {
            alert(data.msg);
            return;
        }

        if (data.access_token) {
            if (frm.remember) {
                localStorage.setItem("is_save", 1);
            }
            localStorage.setItem("logined_id", data.id);
            localStorage.setItem("logined_name", data.name1);
            setToken(data.access_token, data.refresh_token);
            navigate("/adm");
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-6 py-8 w-full max-w-md">
                <div className="flex flex-col space-y-4">
                    <input
                        ref={inputId}
                        type="text"
                        name="id"
                        placeholder="ID"
                        autoComplete="username"
                        required
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        ref={inputPw}
                        type="password"
                        name="pw"
                        placeholder="PW"
                        autoComplete="current-password"
                        required
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center">
                        <input ref={inputRemember} type="checkbox" id="remember" name="remember" className="mr-2" />
                        <label htmlFor="remember" className="text-sm">
                            아이디 기억
                        </label>
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600"
                    >
                        Login
                    </button>
                </div>
            </form>
        </div>
    );
}
