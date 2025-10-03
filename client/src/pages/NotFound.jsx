import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div className='flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center'>
            <h1 className='text-6xl font-bold text-gray-800 dark:text-gray-100'>404</h1>
            <p className='text-xl mt-4 text-gray-600 dark:text-gray-300'>Oops! Page Not Found.</p>
            <p className='mt-2 text-gray-500 dark:text-gray-400'>The page you are looking for does not exist.</p>
            <Link to='/'>
                <button className='mt-6 px-4 py-2 text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg'>
                    Go back to Home
                </button>
            </Link>
        </div>
    );
}