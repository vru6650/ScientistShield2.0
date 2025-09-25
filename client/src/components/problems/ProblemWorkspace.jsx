import { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { HiOutlineLightBulb } from 'react-icons/hi2';

import ProblemConstraintList from './ProblemConstraintList';
import ProblemSampleTests from './ProblemSampleTests';
import ProblemHints from './ProblemHints';
import ProblemSolutionTabs from './ProblemSolutionTabs';

const tabBaseClasses =
    'inline-flex min-w-[120px] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500';

const tabVariants = {
    active: 'bg-cyan-600 text-white shadow-lg',
    inactive:
        'bg-white text-cyan-700 ring-1 ring-cyan-200 hover:bg-cyan-50 dark:bg-slate-900/80 dark:text-cyan-200 dark:ring-cyan-500/40 dark:hover:bg-slate-900',
};

const SectionHeadline = ({ title, description }) => (
    <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{title}</h2>
        {description ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        ) : null}
    </div>
);

export default function ProblemWorkspace({ problem }) {
    const sanitizedStatement = useMemo(() => {
        if (!problem?.statement) {
            return '';
        }

        return DOMPurify.sanitize(problem.statement, { USE_PROFILES: { html: true } });
    }, [problem?.statement]);

    const sanitizedEditorial = useMemo(() => {
        if (!problem?.editorial) {
            return '';
        }

        return DOMPurify.sanitize(problem.editorial, { USE_PROFILES: { html: true } });
    }, [problem?.editorial]);

    const availableTabs = useMemo(() => {
        const tabs = [
            {
                id: 'statement',
                label: 'Problem',
                description: 'Read the prompt, formats, and constraints.',
                visible: Boolean(sanitizedStatement || problem?.inputFormat || problem?.outputFormat || problem?.constraints?.length),
            },
            {
                id: 'examples',
                label: 'Examples',
                description: 'Review sample inputs and outputs.',
                visible: Boolean(problem?.samples?.length),
            },
            {
                id: 'hints',
                label: 'Hints',
                description: 'Progressively uncover guidance.',
                visible: Boolean(problem?.hints?.length),
            },
            {
                id: 'editorial',
                label: 'Editorial',
                description: 'Study approaches and reference code.',
                visible: Boolean(problem?.solutionApproach || sanitizedEditorial || problem?.solutionSnippets?.length),
            },
        ];

        return tabs.filter((tab) => tab.visible);
    }, [problem?.constraints?.length, problem?.hints?.length, problem?.samples?.length, problem?.solutionApproach, problem?.solutionSnippets?.length, problem?.inputFormat, problem?.outputFormat, sanitizedEditorial, sanitizedStatement]);

    const [activeTab, setActiveTab] = useState(availableTabs[0]?.id ?? 'statement');

    useEffect(() => {
        if (!availableTabs.length) {
            return;
        }

        const fallbackId = availableTabs[0].id;
        if (!availableTabs.some((tab) => tab.id === activeTab)) {
            setActiveTab(fallbackId);
        }
    }, [activeTab, availableTabs]);

    const renderStatementTab = () => (
        <div className="space-y-6">
            {sanitizedStatement ? (
                <div
                    className="prose prose-slate max-w-none dark:prose-invert prose-pre:bg-slate-900"
                    dangerouslySetInnerHTML={{ __html: sanitizedStatement }}
                />
            ) : null}

            {(problem?.inputFormat || problem?.outputFormat) && (
                <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 md:grid-cols-2">
                    {problem?.inputFormat ? (
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Input format</h3>
                            <p className="mt-2 whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">{problem.inputFormat}</p>
                        </div>
                    ) : null}
                    {problem?.outputFormat ? (
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Output format</h3>
                            <p className="mt-2 whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">{problem.outputFormat}</p>
                        </div>
                    ) : null}
                </div>
            )}

            <ProblemConstraintList constraints={problem?.constraints} />
        </div>
    );

    const renderExamplesTab = () => <ProblemSampleTests samples={problem?.samples} />;

    const renderHintsTab = () => (
        <div className="space-y-4">
            <SectionHeadline title="Hints" description="Reveal one clue at a time before diving into the code." />
            <ProblemHints hints={problem?.hints} />
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-100">
                <HiOutlineLightBulb className="h-5 w-5" />
                <p>Try to reason about the solution before expanding each hint to mimic real interview pressure.</p>
            </div>
        </div>
    );

    const renderEditorialTab = () => (
        <div className="space-y-6">
            <SectionHeadline title="Editorial walkthrough" description="Study optimal approaches after giving the problem your best shot." />
            {problem?.solutionApproach ? (
                <p className="text-base text-slate-600 dark:text-slate-300">{problem.solutionApproach}</p>
            ) : null}
            {sanitizedEditorial ? (
                <div
                    className="prose prose-slate max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: sanitizedEditorial }}
                />
            ) : null}
            <ProblemSolutionTabs solutionSnippets={problem?.solutionSnippets} />
        </div>
    );

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'examples':
                return renderExamplesTab();
            case 'hints':
                return renderHintsTab();
            case 'editorial':
                return renderEditorialTab();
            case 'statement':
            default:
                return renderStatementTab();
        }
    };

    if (!availableTabs.length) {
        return null;
    }

    return (
        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Workspace library</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Switch between statement, examples, hints, and editorial content just like a GeeksforGeeks practice page.
                    </p>
                </div>
                <nav className="flex flex-wrap gap-2">
                    {availableTabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            className={`${tabBaseClasses} ${activeTab === tab.id ? tabVariants.active : tabVariants.inactive}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-inner dark:border-slate-800 dark:bg-slate-900/80">
                {renderActiveTab()}
            </div>
        </section>
    );
}