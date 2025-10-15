import React from 'react';

/**
 * A reusable layout component for tutorial pages.
 * It provides a two-column structure with a sticky sidebar for navigation.
 *
 * @param {object} props The component props.
 * @param {React.ReactNode} props.sidebarContent The content to be displayed in the sidebar.
 * @param {React.ReactNode} props.mainContent The main content of the tutorial.
 */
export default function TutorialLayout({ sidebarContent, mainContent }) {
    return (
        <div className="flex flex-col md:flex-row min-h-screen">
            {/* Sidebar section */}
            <aside className="md:w-72 w-full p-4 border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shadow-lg md:h-screen md:sticky md:top-0 overflow-y-auto scrollbar-custom z-10 transition-all duration-300 ease-in-out">
                {sidebarContent}
            </aside>

            {/* Main content section */}
            <main className="flex-1 overflow-x-hidden p-6 md:p-10">
                {mainContent}
            </main>
        </div>
    );
}