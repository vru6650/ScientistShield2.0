import { Link, useNavigate } from 'react-router-dom';
import { Button, TextInput } from 'flowbite-react';
import { useMemo, useState } from 'react';

import { TypeAnimation } from 'react-type-animation';
import { HiMagnifyingGlass } from 'react-icons/hi2';
import ParticlesBackground from './ParticlesBackground';

export default function Hero() {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const quickFilters = useMemo(
        () => [
            { label: 'JavaScript fundamentals', value: 'JavaScript' },
            { label: 'React component patterns', value: 'React' },
            { label: 'System design', value: 'System design' },
            { label: 'Dynamic programming', value: 'Dynamic programming' },
        ],
        []
    );

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        const trimmedQuery = searchQuery.trim();
        if (trimmedQuery !== '') {
            params.set('searchTerm', trimmedQuery);
        }
        const queryString = params.toString();
        navigate(queryString ? `/search?${queryString}` : '/search');
    };

    return (
        <section className="relative overflow-hidden py-space-5xl px-space-lg sm:px-space-xl lg:px-space-2xl text-center min-h-[500px] flex items-center justify-center">
            {/* Animated particle background for a more dynamic hero section */}
            <ParticlesBackground />

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-4xl mx-auto">
                <h1 className="text-4xl sm:text-6xl lg:text-8xl font-extrabold font-heading mb-space-lg sm:mb-space-xl leading-tight animate-fade-in-up text-[var(--color-text-primary)]">
                    <TypeAnimation
                        sequence={[
                            'Level Up Your Coding Skills',
                            2000,
                            'Master Web Development',
                            2000,
                            'Build Amazing Projects',
                            2000,
                        ]}
                        wrapper="span"
                        speed={50}
                        repeat={Infinity}
                    />
                </h1>
                <p className="text-lg sm:text-xl lg:text-2xl font-body mb-space-2xl max-w-3xl mx-auto opacity-0 animate-fade-in delay-500 text-[var(--color-text-secondary)]">
                    Explore thousands of tutorials, articles, and projects to become a better developer.
                </p>
                <form
                    onSubmit={handleSearch}
                    className="flex max-w-xl mx-auto rounded-radius-full overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.02] focus-within:scale-[1.02] mt-space-2xl"
                >
                    <TextInput
                        type="text"
                        placeholder="Search tutorials, posts, and problems..."
                        className="flex-grow rounded-l-radius-full [&>div>input]:!rounded-none [&>div>input]:!border-0 [&>div>input]:!ring-0 [&>div>input]:!shadow-none [&>div>input]:bg-white/90 dark:[&>div>input]:bg-gray-800/90 [&>div>input]:placeholder-gray-500 dark:[&>div>input]:placeholder-gray-400 [&>div>input]:text-gray-900 dark:[&>div>input]:text-gray-100 focus:!ring-0"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        icon={HiMagnifyingGlass}
                    />
                    <Button
                        type="submit"
                        className="btn-aqua !rounded-none rounded-r-radius-full h-11 w-20 transform hover:scale-105"
                    >
                        Go
                    </Button>
                </form>
                <div className="mt-space-xl space-y-3">
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">Popular searches</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {quickFilters.map((filter) => (
                            <Link
                                key={filter.value}
                                to={`/search?searchTerm=${encodeURIComponent(filter.value)}`}
                                className="group inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400 hover:bg-sky-50/80 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:bg-slate-900/80"
                            >
                                <span className="h-2 w-2 rounded-full bg-sky-500 transition-colors duration-200 group-hover:bg-sky-600" aria-hidden />
                                {filter.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
