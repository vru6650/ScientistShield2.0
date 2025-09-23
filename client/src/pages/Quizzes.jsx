import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Spinner, Alert, Button, TextInput, Select } from 'flowbite-react';
import { getQuizzes } from '../services/quizService.js';
import QuizCard from '../components/QuizCard'; // To be created next!

export default function Quizzes() {
    const location = useLocation();
    const navigate = useNavigate();

    const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('uncategorized');
    const [sort, setSort] = useState('desc');

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const searchTermFromUrl = urlParams.get('searchTerm') || '';
        const categoryFromUrl = urlParams.get('category') || 'uncategorized';
        const sortFromUrl = urlParams.get('sort') || 'desc';

        setSidebarSearchTerm(searchTermFromUrl);
        setSearchTerm(searchTermFromUrl);
        setCategory(categoryFromUrl);
        setSort(sortFromUrl);
    }, [location.search]);

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['quizzes', { searchTerm, category, sort }],
        queryFn: () => getQuizzes(`searchTerm=${searchTerm}&category=${category}&sort=${sort}`),
        staleTime: 1000 * 60 * 5,
        keepPreviousData: true,
    });

    const quizzes = data?.quizzes || [];

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const urlParams = new URLSearchParams(location.search);
        urlParams.set('searchTerm', sidebarSearchTerm);
        navigate({ search: urlParams.toString() });
    };

    const handleCategoryChange = (e) => {
        const newCategory = e.target.value;
        const urlParams = new URLSearchParams(location.search);
        urlParams.set('category', newCategory);
        navigate({ search: urlParams.toString() });
    };

    const handleSortChange = (e) => {
        const newSort = e.target.value;
        const urlParams = new URLSearchParams(location.search);
        urlParams.set('sort', newSort);
        navigate({ search: urlParams.toString() });
    };

    // Fetch dynamic categories for quizzes
    const { data: categoriesData, isLoading: categoriesLoading, isError: categoriesError } = useQuery({
        queryKey: ['quizCategories'],
        queryFn: async () => {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve([
                        'JavaScript', 'React.js', 'HTML', 'CSS', 'Node.js', 'Databases', 'Algorithms'
                    ]);
                }, 300);
            });
        },
        staleTime: Infinity,
    });

    const availableCategories = categoriesData || [];

    return (
        <div className="p-3 max-w-7xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-center my-10 leading-tight text-gray-900 dark:text-white">
                Practice with Quizzes
            </h1>

            {/* Filter and Search Section */}
            <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 animate-fade-in">
                <form onSubmit={handleSearchSubmit} className="flex gap-4 w-full md:w-auto">
                    <TextInput
                        type="text"
                        placeholder="Search quizzes..."
                        value={sidebarSearchTerm}
                        onChange={(e) => setSidebarSearchTerm(e.target.value)}
                        className="flex-grow md:flex-grow-0"
                    />
                    <Button type="submit" gradientDuoTone="purpleToBlue">Search</Button>
                </form>

                <div className="flex gap-4 w-full md:w-auto">
                    <Select value={category} onChange={handleCategoryChange} className="min-w-[150px]">
                        <option value="uncategorized">All Categories</option>
                        {categoriesLoading ? (
                            <option disabled>Loading categories...</option>
                        ) : categoriesError ? (
                            <option disabled>Error loading categories</option>
                        ) : (
                            availableCategories.map((cat, index) => (
                                <option key={index} value={cat.toLowerCase().replace(/\s/g, '-')}>{cat}</option>
                            ))
                        )}
                    </Select>

                    <Select value={sort} onChange={handleSortChange} className="min-w-[120px]">
                        <option value="desc">Latest</option>
                        <option value="asc">Oldest</option>
                    </Select>
                </div>
            </div>

            {/* Loading, Error, and No Results States */}
            {isLoading && (
                <div className="flex justify-center items-center h-96">
                    <Spinner size="xl" />
                </div>
            )}
            {isError && (
                <Alert color="failure" className="text-center mx-auto max-w-lg animate-fade-in">
                    Error loading quizzes: {error?.message || 'Please try again.'}
                </Alert>
            )}
            {!isLoading && quizzes.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 text-lg my-12 animate-fade-in">
                    No quizzes found matching your criteria. Try adjusting your search or filters!
                </p>
            )}

            {/* Quizzes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-10">
                {!isLoading && quizzes.map((quizItem) => (
                    <QuizCard key={quizItem._id} quiz={quizItem} />
                ))}
            </div>
        </div>
    );
}