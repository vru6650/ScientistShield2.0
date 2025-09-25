import { Tabs } from 'flowbite-react';
import hljs from 'highlight.js/lib/common';

const fallbackSnippets = [
    {
        language: 'pseudo',
        code: 'function solve() {\n  // Outline your approach here\n}',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
    },
];

const highlightCode = (element) => {
    if (element) {
        hljs.highlightElement(element);
    }
};

export default function ProblemSolutionTabs({ solutionSnippets = [] }) {
    const snippetsToUse = solutionSnippets.length ? solutionSnippets : fallbackSnippets;

    return (
        <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 shadow-inner dark:border-gray-700 dark:bg-gray-900/40">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">
                Reference solutions
            </h3>
            <Tabs aria-label="Solution snippets" style="underline" className="problem-solution-tabs">
                {snippetsToUse.map((snippet, index) => (
                    <Tabs.Item key={`${snippet.language}-${index}`} title={snippet.language}>
                        <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                            {(snippet.timeComplexity || snippet.spaceComplexity) && (
                                <p>
                                    {snippet.timeComplexity && (
                                        <span className="mr-3 font-medium text-gray-700 dark:text-gray-200">
                                            Time: {snippet.timeComplexity}
                                        </span>
                                    )}
                                    {snippet.spaceComplexity && (
                                        <span className="font-medium text-gray-700 dark:text-gray-200">
                                            Space: {snippet.spaceComplexity}
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>
                        <pre className="mt-2 overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm text-gray-100 shadow-inner dark:bg-gray-950">
                            <code
                                className={`language-${snippet.language.toLowerCase()}`}
                                ref={highlightCode}
                            >
                                {snippet.code}
                            </code>
                        </pre>
                    </Tabs.Item>
                ))}
            </Tabs>
        </div>
    );
}
