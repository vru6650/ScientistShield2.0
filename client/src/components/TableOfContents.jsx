import React from 'react';
import { Link } from 'react-scroll';

const TableOfContents = ({ headings, activeId }) => {
    return (
        <nav className="toc-container">
            <h3 className="text-lg font-semibold mb-4">Table of Contents</h3>
            <ul className="space-y-2">
                {headings.map((heading) => (
                    <li key={heading.id} className="ml-4">
                        <Link
                            to={heading.id}
                            smooth={true}
                            duration={500}
                            offset={-70} // Adjust offset to account for a fixed header if you have one
                            className={`block hover:text-blue-500 transition-colors duration-300 cursor-pointer ${
                                activeId === heading.id ? 'active-toc-item' : 'toc-link'
                            }`}
                        >
                            {heading.text}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default TableOfContents;