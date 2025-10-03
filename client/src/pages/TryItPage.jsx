import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import { Alert, Button } from 'flowbite-react';
import { FaExternalLinkAlt, FaLaptopCode } from 'react-icons/fa';

export default function TryItPage() {
    const location = useLocation();
    const { code, language } = location.state || { code: null, language: null };
    const [editorCode, setEditorCode] = useState(code || '');
    const [editorLanguage, setEditorLanguage] = useState(language || 'javascript');

    // Default message when there's no initial code
    const defaultCodeMessage = `// Welcome to the live code editor!
// JavaScript runs on a Node.js runtime.
// You can also switch to C++, Python, Java, or C#.
console.log('Happy coding with Node.js!');
`;

    useEffect(() => {
        // Set the initial code based on the language, or a default message if none is provided.
        if (!code && !language) {
            setEditorCode(defaultCodeMessage);
            setEditorLanguage('javascript');
        } else {
            setEditorCode(code);
            const allowedLanguages = ['javascript', 'cpp', 'python', 'java', 'csharp'];
            setEditorLanguage(allowedLanguages.includes(language) ? language : 'javascript');
        }
    }, [code, language]);

    return (
        <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-center my-10 leading-tight text-gray-900 dark:text-white">
                    Try It Yourself!
                </h1>
                <p className="text-lg text-center mb-8 max-w-2xl mx-auto">
                    Edit the code in the editor below and see the live output.
                </p>

                {/* Optional: Add an Alert to explain the page's purpose */}
                <Alert color="info" className="mb-8">
                    <p className="font-semibold">Live Code Editor</p>
                    This is a sandbox environment for testing code snippets. Any changes you make will appear in the "Live Output" window.
                </Alert>

                <CodeEditor
                    initialCode={editorCode}
                    language={editorLanguage}
                />

                <Alert color="purple" className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3 text-sm sm:text-base">
                        <FaLaptopCode className="text-xl" />
                        <span>Need to walk through execution line-by-line? Open the interactive code visualizer.</span>
                    </div>
                    <Button gradientDuoTone="purpleToBlue" as={Link} to="/visualizer">
                        <FaExternalLinkAlt className="mr-2" /> Launch Visualizer
                    </Button>
                </Alert>
            </div>
        </div>
    );
}