import { Button, Select, TextInput, Spinner } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { usePostSearch } from '../hooks/usePostSearch'; // <-- Import the custom hook

export default function Search() {
  const [sidebarData, setSidebarData] = useState({
    searchTerm: '',
    sort: 'desc',
    category: 'uncategorized',
  });

  // 1. All logic for fetching and managing posts is now in the hook
  const { posts, loading, showMore, error, fetchMorePosts } = usePostSearch();

  const location = useLocation();
  const navigate = useNavigate();

  // 2. This effect syncs the URL to the form state on initial load/navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchTerm') || '';
    const sortFromUrl = urlParams.get('sort') || 'desc';
    const categoryFromUrl = urlParams.get('category') || 'uncategorized';

    setSidebarData({
      searchTerm: searchTermFromUrl,
      sort: sortFromUrl,
      category: categoryFromUrl,
    });
  }, [location.search]);

  // 3. The form handlers remain, as they are part of the UI component's responsibility
  const handleChange = (e) => {
    const { id, value } = e.target;
    setSidebarData({ ...sidebarData, [id]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('searchTerm', sidebarData.searchTerm);
    urlParams.set('sort', sidebarData.sort);
    urlParams.set('category', sidebarData.category);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  return (
      <div className='flex flex-col md:flex-row'>
        <div className='p-7 border-b md:border-r md:min-h-screen border-gray-500'>
          <form className='flex flex-col gap-8' onSubmit={handleSubmit}>
            {/* Form inputs are now cleaner */}
            <div className='flex items-center gap-2'>
              <label className='whitespace-nowrap font-semibold'>Search Term:</label>
              <TextInput
                  placeholder='Search...'
                  id='searchTerm'
                  type='text'
                  value={sidebarData.searchTerm}
                  onChange={handleChange}
              />
            </div>
            <div className='flex items-center gap-2'>
              <label className='font-semibold'>Sort:</label>
              <Select onChange={handleChange} value={sidebarData.sort} id='sort'>
                <option value='desc'>Latest</option>
                <option value='asc'>Oldest</option>
              </Select>
            </div>
            <div className='flex items-center gap-2'>
              <label className='font-semibold'>Category:</label>
              <Select
                  onChange={handleChange}
                  value={sidebarData.category}
                  id='category'
              >
                <option value='uncategorized'>Uncategorized</option>
                <option value='reactjs'>React.js</option>
                <option value='nextjs'>Next.js</option>
                <option value='javascript'>JavaScript</option>
              </Select>
            </div>
            <Button type='submit' outline gradientDuoTone='purpleToPink'>
              Apply Filters
            </Button>
          </form>
        </div>
        <div className='w-full'>
          <h1 className='text-3xl font-semibold sm:border-b border-gray-500 p-3 mt-5'>
            Posts results:
          </h1>
          <div className='p-7 flex flex-wrap gap-4'>
            {/* 4. The rendering logic is much simpler and more declarative */}
            {loading && (
                <div className="flex justify-center items-center w-full">
                  <Spinner size="xl" />
                </div>
            )}
            {!loading && error && (
                <p className='text-xl text-gray-500'>{error}</p>
            )}
            {!loading && posts.length === 0 && !error && (
                <p className='text-xl text-gray-500'>No posts found.</p>
            )}
            {!loading &&
                posts.map((post) => <PostCard key={post._id} post={post} />)}

            {showMore && (
                <button
                    onClick={fetchMorePosts}
                    className='text-teal-500 text-lg hover:underline p-7 w-full'
                >
                  Show More
                </button>
            )}
          </div>
        </div>
      </div>
  );
}