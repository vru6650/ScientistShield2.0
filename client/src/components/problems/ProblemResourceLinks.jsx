import { HiArrowTopRightOnSquare } from 'react-icons/hi2';

export default function ProblemResourceLinks({ resources = [] }) {
    if (!resources.length) {
        return null;
    }

    return (
        <div className="space-y-2 rounded-2xl border border-gray-200 bg-white/60 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/60">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">Further reading</h3>
            <ul className="space-y-1 text-sm">
                {resources.map((resource, index) => (
                    <li key={`${resource.url}-${index}`}>
                        <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-cyan-600 transition-colors hover:text-cyan-500 dark:text-cyan-300"
                        >
                            <span>{resource.label}</span>
                            <HiArrowTopRightOnSquare className="h-4 w-4" />
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
