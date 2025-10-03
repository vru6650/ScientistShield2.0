import { Tabs } from 'flowbite-react';
import hljs from 'highlight.js/lib/common';

const fallbackStarters = [
    {
        language: 'JavaScript',
        code: `function solve() {\n  // Write your solution here\n}\n\nfunction main() {\n  const input = readLine();\n  console.log(solve(input));\n}`,
        notes: 'Use fast I/O helpers if you are working with large inputs.',
    },
];

const highlightCode = (element) => {
    if (element) {
        hljs.highlightElement(element);
    }
};

const getLanguageClass = (language = '') => {
    const normalized = language.toLowerCase().trim();
    if (!normalized) {
        return 'plaintext';
    }

    return normalized.replace(/[^a-z0-9]+/g, '-');
};

export default function ProblemStarterCodeTabs({ starterCodes = [] }) {
    const templates = starterCodes.length ? starterCodes : fallbackStarters;

    return (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-inner dark:border-slate-700 dark:bg-slate-900/70">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Starter code templates
            </h3>
            <Tabs aria-label="Starter code snippets" style="underline" className="problem-solution-tabs">
                {templates.map((template, index) => (
                    <Tabs.Item key={`${template.language}-${index}`} title={template.language}>
                        {template.notes ? (
                            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{template.notes}</p>
                        ) : null}
                        <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100 shadow-inner dark:bg-slate-950">
                            <code className={`language-${getLanguageClass(template.language)}`} ref={highlightCode}>
                                {template.code}
                            </code>
                        </pre>
                    </Tabs.Item>
                ))}
            </Tabs>
        </div>
    );
}