import CallToAction from '../components/CallToAction';
import PageView from '../components/PageView.jsx';

const AboutFallback = () => (
    <div className='mx-auto flex min-h-screen max-w-3xl flex-col items-center gap-8 px-4 py-12 text-center sm:px-6'>
        <h1 className='text-4xl font-bold text-gray-900 dark:text-white'>About ScientistShield</h1>
        <div className='flex flex-col gap-6 text-lg text-gray-600 dark:text-gray-300'>
            <p>
                ScientistShield is a learning community built by curious developers who believe in sharing knowledge. We publish
                hands-on tutorials, explore engineering best practices, and celebrate the creativity that powers scientific
                discovery.
            </p>
            <p>
                Each resource is crafted to help learners at every level move from theory to practice. Expect deep dives into web
                development, interactive coding challenges, and curated study paths across emerging technologies.
            </p>
            <p>
                We encourage discussion and collaboration. Comment on lessons, share your own breakthroughs, and help fellow
                learners grow alongside you.
            </p>
        </div>
        <CallToAction />
    </div>
);

export default function About() {
    return <PageView slug='about' fallback={<AboutFallback />} />;
}