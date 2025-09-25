const difficultyStyles = {
    Beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    Easy: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    Hard: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    Advanced: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

export default function ProblemDifficultyBadge({ difficulty = 'Easy', className }) {
    const baseClasses = 'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide';
    const difficultyClass = difficultyStyles[difficulty] ?? difficultyStyles.Easy;
    const additional = className ? ` ${className}` : '';
    const badgeClasses = `${baseClasses} ${difficultyClass}${additional}`;

    return (
        <span className={badgeClasses}>
            <span className="inline-block h-2 w-2 rounded-full bg-current" />
            {difficulty}
        </span>
    );
}
