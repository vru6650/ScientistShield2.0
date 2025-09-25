import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Breadcrumb, Spinner } from 'flowbite-react';
import { HiHome, HiArrowLeft } from 'react-icons/hi2';

import { getProblemBySlug } from '../services/problemService';
import ProblemStatsBar from '../components/problems/ProblemStatsBar';
import ProblemResourceLinks from '../components/problems/ProblemResourceLinks';
import ProblemMetaSummary from '../components/problems/ProblemMetaSummary';
import ProblemWorkspace from '../components/problems/ProblemWorkspace';
import CodeEditor from '../components/CodeEditor';

export default function SingleProblemPage() {
    const { problemSlug } = useParams();

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['problem', problemSlug],
        queryFn: () => getProblemBySlug(problemSlug),
        enabled: Boolean(problemSlug),
    });

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Spinner size="xl" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
                <Alert color="failure" className="w-full rounded-2xl">
                    {error?.message || 'We could not find that problem. Try exploring the catalogue for more challenges.'}
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="border-b border-slate-200 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
                <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
                    <Breadcrumb aria-label="Problem breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
                        <Breadcrumb.Item href="/" icon={HiHome}>
                            Home
                        </Breadcrumb.Item>
                        <Breadcrumb.Item href="/problems">Problem Solving</Breadcrumb.Item>
                        <Breadcrumb.Item>{data.title}</Breadcrumb.Item>
                    </Breadcrumb>
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-3 rounded-full bg-cyan-100/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200">
                            Interview practice
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">{data.title}</h1>
                        <p className="max-w-3xl text-lg text-slate-600 dark:text-slate-300">{data.description}</p>
                        <ProblemStatsBar stats={data.stats} successRate={data.successRate} estimatedTime={data.estimatedTime} />
                    </div>
                </div>
            </div>

            <div className="mx-auto mt-10 max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-[1.15fr,0.85fr]">
                    <div className="space-y-8">
                        <ProblemWorkspace problem={data} />
                        <ProblemResourceLinks resources={data.resources} />
                        <Link
                            to="/problems"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 transition hover:text-cyan-500 dark:text-cyan-300"
                        >
                            <HiArrowLeft className="h-4 w-4" />
                            Back to problem list
                        </Link>
                    </div>

                    <aside className="space-y-6">
                        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                            <div className="space-y-1 border-b border-slate-200 px-6 py-5 dark:border-slate-700">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Interactive editor</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Write, run, and visualize your solution without leaving the problem page.
                                </p>
                            </div>
                            <div className="h-[720px] bg-slate-50/80 dark:bg-slate-900/70">
                                <CodeEditor language="javascript" />
                            </div>
                        </section>

                        <ProblemMetaSummary problem={data} />

                        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">Share your solution</h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                Publish a write-up in the ScientistShield community forum and help fellow learners master this challenge.
                            </p>
                            <a
                                href="mailto:team@scientistshield.dev?subject=Solution%20write-up%20for%20"
                                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-300"
                            >
                                Start a discussion
                            </a>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
