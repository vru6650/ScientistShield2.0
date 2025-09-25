export default function ProblemSkeleton() {
    return (
        <div className="h-full rounded-2xl border border-gray-200 bg-white/60 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800/40">
            <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="mt-4 h-6 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-4 flex gap-2">
                <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="mt-6 h-8 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
    );
}
