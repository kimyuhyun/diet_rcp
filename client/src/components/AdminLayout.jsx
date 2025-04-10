import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    LogOut,
    Menu,
    Moon,
    Sun,
    User,
    ChevronDown,
    ChevronUp,
    UserCircle,
    Code,
    LayoutDashboard,
    BarChart,
} from "lucide-react";
import menu from "../../common/menus";

const iconMap = {
    user: UserCircle,
    code: Code,
    dashboard: LayoutDashboard,
    chart: BarChart,
};

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
    const [profileOpen, setProfileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const [openGroups, setOpenGroups] = useState(() =>
        menu.map((group) => group.child.some((item) => location.pathname.startsWith(item.link)))
    );

    useEffect(() => {
        const newOpenGroups = [...openGroups];
        menu.forEach((group, index) => {
            if (group.child.some((item) => location.pathname.startsWith(item.link))) {
                newOpenGroups[index] = true; // 활성 그룹만 열고 나머지는 기존 상태 유지
            }
        });
        setOpenGroups(newOpenGroups);
    }, [location.pathname]);

    useEffect(() => {
        document.body.style.overflow = !isDesktop && sidebarOpen ? "hidden" : "";
    }, [sidebarOpen, isDesktop]);

    useEffect(() => {
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme === "dark") {
            setIsDarkMode(true);
            document.documentElement.classList.add("dark");
        } else if (storedTheme === "light") {
            setIsDarkMode(false);
            document.documentElement.classList.remove("dark");
        } else {
            const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            setIsDarkMode(systemPrefersDark);
            document.documentElement.classList.toggle("dark", systemPrefersDark);
        }

        const handleResize = () => {
            const isNowDesktop = window.innerWidth >= 768;
            setIsDesktop(isNowDesktop);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const toggleSidebar = () => setSidebarOpen((prev) => !prev);

    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        localStorage.setItem("theme", newMode ? "dark" : "light");
        document.documentElement.classList.toggle("dark", newMode);
    };

    const toggleGroup = (index) => {
        // setOpenGroups(menu.map((_, i) => i === index));
        setOpenGroups((prev) => {
            const newState = [...prev];
            newState[index] = !newState[index]; // 클릭된 그룹의 상태만 토글
            return newState;
        });
    };

    const handleLogout = () => {
        navigate("/login");
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 relative">
            {!isDesktop && sidebarOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={toggleSidebar}></div>
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out delay-75
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700 h-[53px]">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white"></h2>
                    <button onClick={toggleSidebar}>
                        <Menu className="w-5 h-5 text-gray-700 dark:text-white" />
                    </button>
                </div>
                <nav className="flex flex-col gap-2 p-4">
                    {menu.map((group, i) => {
                        const IconComponent = iconMap[group.icon] || LayoutDashboard;
                        const isOpen = openGroups[i];
                        const groupActive = group.child.some((item) => location.pathname === item.link);

                        return (
                            <div key={i} className="overflow-hidden rounded-lg">
                                <button
                                    onClick={() => toggleGroup(i)}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition
                                        ${
                                            isOpen || groupActive
                                                ? "bg-blue-50 text-blue-800"
                                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <IconComponent className="w-4 h-4" />
                                        {group.title}
                                    </span>
                                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>

                                <ul
                                    className={`pl-6 mt-2 space-y-1 text-sm transition-all duration-300 ease-in-out ${
                                        isOpen ? "max-h-[500px]" : "max-h-0 overflow-hidden"
                                    }`}
                                >
                                    {group.child.map((item, j) => {
                                        const isActive = location.pathname === item.link;
                                        return (
                                            <li key={j}>
                                                <Link
                                                    to={item.link}
                                                    onClick={() => !isDesktop && setSidebarOpen(false)}
                                                    className={`flex items-center gap-1 py-1.5 rounded transition
                                                        ${
                                                            isActive
                                                                ? "text-blue-800 font-semibold"
                                                                : "text-gray-600 dark:text-gray-300 hover:text-blue-700"
                                                        }`}
                                                >
                                                    <span className="text-xs">◦</span>
                                                    {item.title}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}
                </nav>
            </aside>

            <div
                className={`flex-1 flex flex-col transition-all duration-300 ${
                    isDesktop && sidebarOpen ? "ml-64" : "ml-0"
                }`}
            >
                <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between md:justify-between gap-4 px-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 h-[53px]">
                    <div className="flex items-center gap-4">
                        <button onClick={toggleSidebar}>
                            <Menu className="w-6 h-6 text-gray-700 dark:text-white" />
                        </button>
                        <div className="text-lg font-semibold text-gray-800 dark:text-white hidden md:block"></div>
                    </div>

                    <div className="flex items-center gap-3 relative">
                        <button onClick={toggleDarkMode}>
                            {isDarkMode ? (
                                <Sun className="w-6 h-6 text-yellow-400" />
                            ) : (
                                <Moon className="w-6 h-6 text-gray-700 dark:text-white" />
                            )}
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="text-sm font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                            >
                                전체관리자
                                {profileOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow z-50">
                                    <Link
                                        to="/adm/mypage"
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                    >
                                        <User className="w-4 h-4" /> 마이페이지
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                    >
                                        <LogOut className="w-4 h-4" /> 로그아웃
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="p-4 mt-[53px]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
