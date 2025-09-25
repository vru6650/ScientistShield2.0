import ProblemDifficultyBadge from './ProblemDifficultyBadge';

export default function ProblemMetaSummary({ problem }) {
    const { difficulty, topics = [], tags = [], companies = [], estimatedTime } = problem;

    return (
        <aside className="space-y-4 rounded-2xl border border-gray-200 bg-white/70 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800/60">
            <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">Difficulty</h3>
                <ProblemDifficultyBadge difficulty={difficulty} className="mt-2" />
            </div>
            {estimatedTime ? (
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">Estimated time</h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{estimatedTime} minutes</p>
                </div>
            ) : null}
            {topics.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">Core topics</h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {topics.map((topic) => (
                            <span key={topic} className="rounded-full bg-cyan-100 px-3 py-1 font-medium text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200">
                                {topic}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {tags.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">Techniques</h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700 dark:bg-gray-700/60 dark:text-gray-200">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {companies.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">Asked at</h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {companies.map((company) => (
                            <span key={company} className="rounded-full bg-purple-100 px-3 py-1 font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                                {company}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </aside>
    );
}
