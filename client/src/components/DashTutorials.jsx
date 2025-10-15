import { Modal, Table, Button, Spinner, Alert } from 'flowbite-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { getTutorials as getTutorialsService, deleteTutorial as deleteTutorialService } from '../services/tutorialService';

export default function DashTutorials() {
    const { currentUser } = useSelector((state) => state.user);
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [tutorialToDelete, setTutorialToDelete] = useState(null);

    const {
        data,
        isLoading,
        isError,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        // The queryKey is fine as is
        queryKey: ['adminTutorials', currentUser._id],
        queryFn: ({ pageParam = 0 }) => getTutorialsService(`authorId=${currentUser._id}&startIndex=${pageParam}`),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.tutorials.length < 9) return undefined;
            return allPages.reduce((acc, page) => acc + page.tutorials.length, 0);
        },
        enabled: !!currentUser?.isAdmin,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteTutorialService,
        onSuccess: () => {
            // Invalidate the cache to refetch the list of tutorials
            queryClient.invalidateQueries({ queryKey: ['adminTutorials', currentUser._id] });
        },
    });

    const handleDeleteTutorial = () => {
        setShowModal(false);
        // =================================================================
        // FIX: Pass the correct object structure to the mutation
        // =================================================================
        if (tutorialToDelete) {
            deleteMutation.mutate({
                tutorialId: tutorialToDelete.tutorialId,
                userId: currentUser._id // Use the current user's ID for consistency
            });
        }
    };

    const tutorials = data?.pages.flatMap(page => page.tutorials) ?? [];

    return (
        <div className='table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500'>
            {isLoading && (
                <div className='flex justify-center items-center min-h-screen'>
                    <Spinner size='xl' />
                </div>
            )}
            {isError && (
                <Alert color='failure' className='my-4'>
                    Error fetching tutorials: {error.message}
                </Alert>
            )}
            {deleteMutation.isError && (
                <Alert color='failure' onDismiss={() => deleteMutation.reset()}>
                    Failed to delete tutorial: {deleteMutation.error.message}
                </Alert>
            )}

            {currentUser.isAdmin && tutorials.length > 0 ? (
                <>
                    <Table hoverable className='shadow-md'>
                        <Table.Head>
                            <Table.HeadCell>Date updated</Table.HeadCell>
                            <Table.HeadCell>Thumbnail</Table.HeadCell>
                            <Table.HeadCell>Tutorial title</Table.HeadCell>
                            <Table.HeadCell>Category</Table.HeadCell>
                            <Table.HeadCell>Chapters</Table.HeadCell>
                            <Table.HeadCell>Delete</Table.HeadCell>
                            <Table.HeadCell>
                                <span>Edit</span>
                            </Table.HeadCell>
                        </Table.Head>
                        <Table.Body className='divide-y'>
                            {tutorials.map((tutorial) => (
                                <Table.Row key={tutorial._id} className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                    <Table.Cell>{new Date(tutorial.updatedAt).toLocaleDateString()}</Table.Cell>
                                    <Table.Cell>
                                        <Link to={`/tutorials/${tutorial.slug}`}>
                                            <img src={tutorial.thumbnail} alt={tutorial.title} className='w-20 h-10 object-cover bg-gray-500' />
                                        </Link>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Link className='font-medium text-gray-900 dark:text-white' to={`/tutorials/${tutorial.slug}`}>{tutorial.title}</Link>
                                    </Table.Cell>
                                    <Table.Cell>{tutorial.category}</Table.Cell>
                                    <Table.Cell>{tutorial.chapters.length}</Table.Cell>
                                    <Table.Cell>
                                        <span
                                            onClick={() => {
                                                setShowModal(true);
                                                // =================================================================
                                                // FIX: Only store the tutorial ID in state
                                                // =================================================================
                                                setTutorialToDelete({ tutorialId: tutorial._id });
                                            }}
                                            className='font-medium text-red-500 hover:underline cursor-pointer'
                                        >
                                            Delete
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        {/* You're linking to a route, this is fine, no change needed here */}
                                        <Link className='text-teal-500 hover:underline' to={`/update-tutorial/${tutorial._id}`}>
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
                !isLoading && <p>You have no tutorials yet!</p>
            )}

            <Modal show={showModal} onClose={() => setShowModal(false)} popup size='md'>
                <Modal.Header />
                <Modal.Body>
                    <div className='text-center'>
                        <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
                        <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>Are you sure you want to delete this tutorial?</h3>
                        <div className='flex justify-center gap-4'>
                            <Button color='failure' onClick={handleDeleteTutorial} isProcessing={deleteMutation.isPending}>
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