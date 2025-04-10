// components/LoadingSpinner.jsx

export default function LoadingSpinner({ text = "로딩 중..." }) {
    return (
        <div className="flex justify-center items-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>{text}</span>
        </div>
    );
}
