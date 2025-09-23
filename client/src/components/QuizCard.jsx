// client/src/components/QuizCard.jsx
import { Link } from 'react-router-dom';
import { FaQuestionCircle } from 'react-icons/fa';

const QuizCard = ({ quiz }) => (
    <Link to={`/quizzes/${quiz.slug}`} className="block h-full">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col transform hover:-translate-y-1">
            <div className="p-4 flex flex-col flex-grow items-center justify-center text-center">
                <FaQuestionCircle className="text-5xl text-blue-500 dark:text-blue-400 mb-4" />
                <h2 className="text-xl font-bold line-clamp-2 text-gray-900 dark:text-white mb-2">{quiz.title}</h2>
                {quiz.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-3 flex-grow mb-3">
                        {quiz.description}
                    </p>
                )}
                <div className="mt-auto">
                    <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium uppercase tracking-wide">
                        {quiz.category || 'General'}
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {quiz.questions.length} Questions
                    </p>
                </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                <button className="w-full text-center text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                    Start Quiz
                </button>
            </div>
        </div>
    </Link>
);

export default QuizCard;