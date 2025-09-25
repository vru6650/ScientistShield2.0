import { HiOutlineLightBulb } from 'react-icons/hi2';
import { Link } from 'react-router-dom';

export default function ProblemEmptyState({ isAdmin }) {
    return (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white/60 p-10 text-center shadow-sm dark:border-gray-600 dark:bg-gray-800/40">
            <HiOutlineLightBulb className="mx-auto h-12 w-12 text-cyan-500" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">No problems match your filters</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Try adjusting the difficulty or topic filters to discover new challenges.
            </p>
            {isAdmin && (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Ready to publish a new challenge?{' '}
                    <Link to="/create-problem" className="font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-300">
                        Create one now
                    </Link>
                    .
                </p>
            )}
        </div>
    );
}
