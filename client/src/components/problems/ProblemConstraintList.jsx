export default function ProblemConstraintList({ constraints = [] }) {
    if (!constraints.length) {
        return null;
    }

    return (
        <section className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Constraints</h3>
            <ul className="space-y-1 rounded-2xl border border-gray-200 bg-white/70 p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200">
                {constraints.map((constraint, index) => (
                    <li key={index} className="flex gap-2">
                        <span className="text-cyan-500">•</span>
                        <span>{constraint}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
