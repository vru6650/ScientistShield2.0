import { Link } from 'react-router-dom';
import { HiArrowRightCircle } from 'react-icons/hi2';
import ProblemDifficultyBadge from './ProblemDifficultyBadge';
import ProblemStatsBar from './ProblemStatsBar';

export default function ProblemCard({ problem }) {
    const { slug, title, description, difficulty, topics, tags, stats, successRate, estimatedTime } = problem;
    const topicText = topics?.slice(0, 2) ?? [];
    const tagText = tags?.slice(0, 3) ?? [];

    return (
        <Link to={`/problems/${slug}`} className="group block h-full">
            <article className="flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800/60">
                <div className="space-y-4">
                    <ProblemDifficultyBadge difficulty={difficulty} />
                    <h3 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-400">
                        {title}
                    </h3>
                    <p className="line-clamp-3 text-sm text-gray-600 dark:text-gray-300">{description}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                        {topicText.map((topic) => (
                            <span
                                key={topic}
                                className="rounded-full bg-cyan-100 px-3 py-1 font-medium text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200"
                            >
                                {topic}
                            </span>
                        ))}
                        {tagText.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700 dark:bg-gray-700/60 dark:text-gray-200"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="mt-6 flex flex-col gap-4">
                    <ProblemStatsBar stats={stats} successRate={successRate} estimatedTime={estimatedTime} />
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                        Practice now
                        <HiArrowRightCircle className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                </div>
            </article>
        </Link>
    );
}
