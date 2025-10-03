import CallToAction from '../components/CallToAction';
import PageView from '../components/PageView.jsx';

const ProjectsFallback = () => (
    <div className='mx-auto flex min-h-screen max-w-4xl flex-col items-center gap-8 px-4 py-12 text-center sm:px-6'>
        <h1 className='text-4xl font-bold text-gray-900 dark:text-white'>Explore Our Projects</h1>
        <p className='max-w-3xl text-lg text-gray-600 dark:text-gray-300'>
            Dive into a collection of fun and engaging projects designed to help you learn and master HTML, CSS, and JavaScript.
            Whether you&apos;re a beginner or an experienced developer, these projects will challenge your skills and inspire
            creativity.
        </p>
        <div className='flex w-full flex-col gap-6'>
            <section className='rounded-2xl bg-gray-100 p-6 text-left shadow-md dark:bg-gray-800/70'>
                <h2 className='text-2xl font-semibold text-gray-900 dark:text-white'>Why build projects?</h2>
                <p className='mt-2 text-gray-700 dark:text-gray-300'>
                    Building projects is one of the best ways to learn programming. It allows you to apply theoretical knowledge
                    in a practical way, solve real-world problems, and create a portfolio that showcases your skills.
                </p>
            </section>
            <section className='rounded-2xl bg-gray-100 p-6 text-left shadow-md dark:bg-gray-800/70'>
                <h2 className='text-2xl font-semibold text-gray-900 dark:text-white'>What you&apos;ll explore</h2>
                <ul className='mt-3 list-disc space-y-2 pl-4 text-gray-700 dark:text-gray-300'>
                    <li>Structuring semantic HTML for clarity</li>
                    <li>Crafting responsive layouts with CSS</li>
                    <li>Adding interactivity with JavaScript</li>
                    <li>Debugging and problem-solving techniques</li>
                    <li>Best practices for accessible web design</li>
                </ul>
            </section>
        </div>
        <CallToAction />
    </div>
);

export default function Projects() {
    return <PageView slug='projects' fallback={<ProjectsFallback />} />;
}
