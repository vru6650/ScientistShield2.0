import { HiUserGroup, HiCheckCircle, HiClock, HiOutlineSparkles, HiHeart } from 'react-icons/hi2';

const StatChip = ({ icon: Icon, label, value, tooltip }) => (
    <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 backdrop-blur dark:bg-gray-800/60 dark:text-gray-200 dark:ring-gray-700">
        <Icon className="h-4 w-4" />
        <span className="whitespace-nowrap" title={tooltip}>
            {label}: <span className="font-semibold">{value}</span>
        </span>
    </div>
);

export default function ProblemStatsBar({ stats, successRate, estimatedTime }) {
    const submissions = stats?.submissions ?? 0;
    const accepted = stats?.accepted ?? 0;
    const likes = stats?.likes ?? 0;
    const acceptanceLabel = successRate ?? (submissions > 0 ? Math.round((accepted / submissions) * 100) : null);

    return (
        <div className="flex flex-wrap items-center gap-3 text-sm">
            <StatChip
                icon={HiUserGroup}
                label="Submissions"
                value={submissions.toLocaleString()}
                tooltip="Total number of attempts submitted"
            />
            <StatChip
                icon={HiCheckCircle}
                label="Solved"
                value={accepted.toLocaleString()}
                tooltip="Accepted submissions"
            />
            {acceptanceLabel !== null && (
                <StatChip
                    icon={HiOutlineSparkles}
                    label="Success"
                    value={`${acceptanceLabel}%`}
                    tooltip="Acceptance rate"
                />
            )}
            {typeof estimatedTime === 'number' && estimatedTime > 0 && (
                <StatChip
                    icon={HiClock}
                    label="Avg. time"
                    value={`${estimatedTime} mins`}
                    tooltip="Estimated time to solve"
                />
            )}
            <StatChip
                icon={HiHeart}
                label="Kudos"
                value={likes.toLocaleString()}
                tooltip="Community likes"
            />
        </div>
    );
}
