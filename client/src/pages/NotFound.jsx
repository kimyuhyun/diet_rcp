export default function NotFound() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                <div>
                    <img
                        src="https://cdn.pixabay.com/photo/2017/03/09/12/31/error-2129569__340.jpg"
                        alt="Error Illustration"
                        className="w-full h-auto rounded shadow"
                    />
                </div>
                <div className="flex flex-col justify-center text-center md:text-left space-y-4">
                    <p className="text-3xl font-semibold">
                        <span className="text-red-600">Oops!</span> <span className="dark:text-white">Page not found.</span>
                    </p>
                    <p className="text-lg text-gray-700 dark:text-gray-300">
                        The page you’re looking for doesn’t exist.
                    </p>
                    <a
                        href="/login"
                        className="inline-block bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
                    >
                        Go Home
                    </a>
                </div>
            </div>
        </div>
    );
}
