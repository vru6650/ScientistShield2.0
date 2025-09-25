import { Accordion } from 'flowbite-react';

export default function ProblemHints({ hints = [] }) {
    if (!hints.length) {
        return null;
    }

    return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm dark:border-amber-500/30 dark:bg-amber-900/20">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-200">
                Need a nudge?
            </h3>
            <Accordion collapseAll className="border-none bg-transparent">
                {hints.map((hint, index) => (
                    <Accordion.Panel key={index}>
                        <Accordion.Title className="rounded-lg bg-transparent px-0 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100/80 dark:text-amber-100 dark:hover:bg-amber-900/40">
                            {hint.title || `Hint ${index + 1}`}
                        </Accordion.Title>
                        <Accordion.Content className="px-0 py-2 text-sm text-amber-800/90 dark:text-amber-100/90">
                            {hint.body}
                        </Accordion.Content>
                    </Accordion.Panel>
                ))}
            </Accordion>
        </div>
    );
}
