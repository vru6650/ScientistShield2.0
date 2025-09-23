// client/src/components/FeatureHighlights.jsx
import { FaCode, FaProjectDiagram, FaUsers } from 'react-icons/fa';

export default function FeatureHighlights() {
    const features = [
        {
            icon: FaCode,
            title: 'Hands-on Tutorials',
            description: 'Practice with step-by-step coding guides.',
        },
        {
            icon: FaProjectDiagram,
            title: 'Real Projects',
            description: 'Build real-world apps and learn by doing.',
        },
        {
            icon: FaUsers,
            title: 'Community Support',
            description: 'Join developers and grow together.',
        },
    ];

    return (
        <section className="bg-gradient-to-r from-sky-500 to-indigo-600 py-16 text-white">
            <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                {features.map((feature, index) => (
                    <div
                        key={feature.title}
                        className="flex flex-col items-center gap-4 animate-fade-in-up"
                        style={{ animationDelay: `${index * 0.2}s` }}
                    >
                        <feature.icon className="text-5xl" />
                        <h3 className="text-xl font-semibold">{feature.title}</h3>
                        <p className="opacity-90 text-sm sm:text-base max-w-xs">
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
