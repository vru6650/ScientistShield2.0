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
        <section className="relative overflow-hidden py-24 px-6 sm:px-10 lg:px-16 text-center min-h-[520px] flex items-center justify-center">
            {/* Animated particle background for a more dynamic hero section */}
            <ParticlesBackground />

            {/* Aurora glow overlays */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-32 -left-20 h-80 w-80 rounded-full bg-brand-400/30 blur-[140px]" />
                <div className="absolute -bottom-28 -right-24 h-96 w-96 rounded-full bg-flare-400/25 blur-[160px]" />
                <div className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent-teal/25 blur-[120px] opacity-60" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-4xl mx-auto">
                <h1 className="text-4xl sm:text-6xl lg:text-8xl font-extrabold font-heading mb-6 sm:mb-8 leading-tight animate-fade-in-up text-transparent bg-clip-text bg-gradient-to-r from-brand-900 via-brand-600 to-flare-400">
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
                <p className="text-lg sm:text-xl lg:text-2xl font-body mb-12 max-w-3xl mx-auto opacity-0 animate-fade-in delay-500 text-ink-500 dark:text-ink-300/85">
                    Explore thousands of tutorials, articles, and projects to become a better developer.
                </p>
                <form
                    onSubmit={handleSearch}
                    className="flex max-w-xl mx-auto rounded-full overflow-hidden border border-white/70 bg-white/80 shadow-[0_30px_80px_-40px_rgba(39,47,138,0.45)] backdrop-blur-xl transition-transform duration-300 hover:scale-[1.02] focus-within:ring-2 focus-within:ring-brand-300 focus-within:scale-[1.02] mt-12"
                >
                    <TextInput
                        type="text"
                        placeholder="Search tutorials, posts, and problems..."
                        className="flex-grow rounded-l-full [&>div>input]:!rounded-none [&>div>input]:!border-0 [&>div>input]:!ring-0 [&>div>input]:!shadow-none [&>div>input]:bg-transparent [&>div>input]:px-6 [&>div>input]:py-3 [&>div>input]:text-ink-700 dark:[&>div>input]:text-ink-100 [&>div>input]:placeholder-ink-400 dark:[&>div>input]:placeholder-ink-500 focus:!ring-0"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        icon={HiMagnifyingGlass}
                    />
                    <Button
                        type="submit"
                        className="bg-brand-500 hover:bg-brand-600 dark:bg-brand-500/90 dark:hover:bg-brand-400 text-white !rounded-none rounded-r-full h-12 w-24 text-base transition-transform duration-300 transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                    >
                        Go
                    </Button>
                </form>
                <div className="mt-14 space-y-3">
                    <p className="text-sm uppercase tracking-[0.3em] text-ink-400 dark:text-ink-300/70">Popular searches</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {quickFilters.map((filter) => (
                            <Link
                                key={filter.value}
                                to={`/search?searchTerm=${encodeURIComponent(filter.value)}`}
                                className="group inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/85 px-4 py-2 text-sm font-medium text-ink-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-white dark:border-ink-700/70 dark:bg-ink-900/70 dark:text-ink-200 dark:hover:border-brand-500/40 dark:hover:bg-ink-900"
                            >
                                <span className="h-2 w-2 rounded-full bg-brand-500 transition-colors duration-200 group-hover:bg-flare-400" aria-hidden />
                                {filter.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
