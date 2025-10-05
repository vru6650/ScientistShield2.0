import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { TextInput, Button } from 'flowbite-react';

export default function NotFound() {
  const [term, setTerm] = useState('');
  const navigate = useNavigate();

  const onSearch = (e) => {
    e.preventDefault();
    if (!term.trim()) return;
    navigate(`/search?searchTerm=${encodeURIComponent(term.trim())}`);
  };

  return (
    <div className='relative flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-6 py-12 text-center'>
      <div aria-hidden className='pointer-events-none absolute inset-x-0 -top-20 -z-10 blur-3xl opacity-30 dark:opacity-20'>
        <div className='mx-auto h-64 w-3/4 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-500' />
      </div>

      <div className='rounded-3xl border border-white/50 dark:border-white/10 bg-white/80 dark:bg-ink-900/60 shadow-xl backdrop-blur-xl p-8 sm:p-10 max-w-2xl w-full'>
        <p className='text-sm uppercase tracking-[0.35em] text-brand-600 dark:text-brand-300 font-semibold'>
          Error 404
        </p>
        <h1 className='mt-2 text-3xl sm:text-4xl font-extrabold text-ink-900 dark:text-white'>
          We can’t find that page
        </h1>
        <p className='mt-3 text-base sm:text-lg text-ink-600 dark:text-gray-300'>
          The page may have moved or the URL might be incorrect. Try searching or use one of the quick links below.
        </p>

        <form onSubmit={onSearch} className='mt-6 flex items-center gap-2'>
          <TextInput
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder='Search articles, tutorials, quizzes…'
            className='flex-1'
          />
          <Button type='submit' color='primary'>Search</Button>
        </form>

        <div className='mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3'>
          <Link to='/' className='block rounded-lg border border-ink-200/60 dark:border-ink-700/60 py-3 px-4 hover:bg-ink-50 dark:hover:bg-ink-800/60 transition'>
            Home
          </Link>
          <Link to='/tutorials' className='block rounded-lg border border-ink-200/60 dark:border-ink-700/60 py-3 px-4 hover:bg-ink-50 dark:hover:bg-ink-800/60 transition'>
            Tutorials
          </Link>
          <Link to='/quizzes' className='block rounded-lg border border-ink-200/60 dark:border-ink-700/60 py-3 px-4 hover:bg-ink-50 dark:hover:bg-ink-800/60 transition'>
            Quizzes
          </Link>
          <Link to='/problems' className='block rounded-lg border border-ink-200/60 dark:border-ink-700/60 py-3 px-4 hover:bg-ink-50 dark:hover:bg-ink-800/60 transition'>
            Problems
          </Link>
        </div>
      </div>
    </div>
  );
}
