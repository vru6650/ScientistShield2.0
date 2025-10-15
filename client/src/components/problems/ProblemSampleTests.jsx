export default function ProblemSampleTests({ samples = [] }) {
    if (!samples.length) {
        return null;
    }

    return (
        <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sample cases</h3>
            <div className="space-y-4">
                {samples.map((sample, index) => (
                    <article
                        key={index}
                        className="rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/60"
                    >
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {sample.label || `Example ${index + 1}`}
                        </h4>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div>
                                <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Input
                                </h5>
                                <pre className="mt-1 whitespace-pre-wrap rounded-xl bg-gray-900/90 p-3 text-sm text-gray-100 shadow-inner dark:bg-gray-950">
                                    {sample.input}
                                </pre>
                            </div>
                            <div>
                                <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Output
                                </h5>
                                <pre className="mt-1 whitespace-pre-wrap rounded-xl bg-gray-900/90 p-3 text-sm text-gray-100 shadow-inner dark:bg-gray-950">
                                    {sample.output}
                                </pre>
                            </div>
                        </div>
                        {sample.explanation && (
                            <p className="mt-3 rounded-xl bg-cyan-50/60 p-3 text-sm text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-100">
                                {sample.explanation}
                            </p>
                        )}
                    </article>
                ))}
            </div>
        </section>
    );
}
