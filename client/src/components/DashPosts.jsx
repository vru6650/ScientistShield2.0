import { Modal, Table, Button, Spinner, Alert } from 'flowbite-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { getAdminPosts, deletePost } from '../services/postService';

export default function DashPosts() {
  const { currentUser } = useSelector((state) => state.user);
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  // 1. UPDATED: State now holds an object for the post to delete
  const [postToDelete, setPostToDelete] = useState(null);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    // Pass the current user's ID to fetch only their posts
    queryKey: ['adminPosts', currentUser._id],
    queryFn: getAdminPosts, // This function will receive the queryKey and pageParam
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.posts.length < 9) return undefined;
      // Use the count of all fetched posts as the next starting index
      return allPages.reduce((acc, page) => acc + page.posts.length, 0);
    },
    enabled: !!currentUser?.isAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPosts', currentUser._id] });
    },
  });

  // 3. UPDATED: Pass the entire postToDelete object to the mutation
  const handleDeletePost = () => {
    setShowModal(false);
    if (postToDelete) {
      deleteMutation.mutate(postToDelete);
    }
  };

  const posts = data?.pages.flatMap(page => page.posts) ?? [];

  return (
      <div className='table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500'>
        {isLoading && (
            <div className='flex justify-center items-center min-h-screen'>
              <Spinner size='xl' />
            </div>
        )}
        {isError && (
            <Alert color='failure' className='my-4'>
              Error fetching posts: {error.message}
            </Alert>
        )}
        {deleteMutation.isError && (
            <Alert color='failure' onDismiss={() => deleteMutation.reset()}>
              Failed to delete post: {deleteMutation.error.message}
            </Alert>
        )}

        {currentUser.isAdmin && posts.length > 0 ? (
            <>
              <Table hoverable className='shadow-md'>
                <Table.Head>
                  <Table.HeadCell>Date updated</Table.HeadCell>
                  <Table.HeadCell>Post image</Table.HeadCell>
                  <Table.HeadCell>Post title</Table.HeadCell>
                  <Table.HeadCell>Category</Table.HeadCell>
                  <Table.HeadCell>Delete</Table.HeadCell>
                  <Table.HeadCell>
                    <span>Edit</span>
                  </Table.HeadCell>
                </Table.Head>
                <Table.Body className='divide-y'>
                  {posts.map((post) => (
                      <Table.Row key={post._id} className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                        <Table.Cell>{new Date(post.updatedAt).toLocaleDateString()}</Table.Cell>
                        <Table.Cell>
                          <Link to={`/post/${post.slug}`}>
                            <img src={post.image} alt={post.title} className='w-20 h-10 object-cover bg-gray-500' />
                          </Link>
                        </Table.Cell>
                        <Table.Cell>
                          <Link className='font-medium text-gray-900 dark:text-white' to={`/post/${post.slug}`}>{post.title}</Link>
                        </Table.Cell>
                        <Table.Cell>{post.category}</Table.Cell>
                        <Table.Cell>
                          {/* 2. UPDATED: Set an object with both postId and userId */}
                          <span
                              onClick={() => {
                                setShowModal(true);
                                setPostToDelete({ postId: post._id, userId: post.userId });
                              }}
                              className='font-medium text-red-500 hover:underline cursor-pointer'
                          >
                      Delete
                    </span>
                        </Table.Cell>
                        <Table.Cell>
                          <Link className='text-teal-500 hover:underline' to={`/update-post/${post._id}`}>
                            <span>Edit</span>
                          </Link>
                        </Table.Cell>
                      </Table.Row>
                  ))}
                </Table.Body>
              </Table>
              {hasNextPage && (
                  <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className='w-full text-teal-500 self-center text-sm py-7'
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Show more'}
                  </button>
              )}
            </>
        ) : (
            !isLoading && <p>You have no posts yet!</p>
        )}

        <Modal show={showModal} onClose={() => setShowModal(false)} popup size='md'>
          <Modal.Header />
          <Modal.Body>
            <div className='text-center'>
              <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
              <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>Are you sure you want to delete this post?</h3>
              <div className='flex justify-center gap-4'>
                <Button color='failure' onClick={handleDeletePost} isProcessing={deleteMutation.isPending}>
                  Yes, I'm sure
                </Button>
                <Button color='gray' onClick={() => setShowModal(false)} disabled={deleteMutation.isPending}>
                  No, cancel
                </Button>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      </div>
  );
}