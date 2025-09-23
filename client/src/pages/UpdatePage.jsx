import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Spinner } from 'flowbite-react';
import PageForm from '../components/PageForm.jsx';
import { getPageById, updatePage } from '../services/pageService.js';

const UpdatePage = () => {
    const { pageId } = useParams();
    const queryClient = useQueryClient();
    const [successMessage, setSuccessMessage] = useState('');

    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['adminPage', pageId],
        queryFn: () => getPageById(pageId),
        enabled: Boolean(pageId),
    });

    const mutation = useMutation({
        mutationFn: (payload) => updatePage({ pageId, payload }),
        onSuccess: (updatedPage) => {
            queryClient.setQueryData(['adminPage', pageId], updatedPage);
            queryClient.invalidateQueries({ queryKey: ['adminPages'] });

            if (data?.slug) {
                queryClient.invalidateQueries({ queryKey: ['contentPage', data.slug] });
            }

            queryClient.invalidateQueries({ queryKey: ['contentPage', updatedPage.slug] });
            setSuccessMessage('Page updated successfully.');
        },
    });

    const handleUpdate = async (payload) => {
        await mutation.mutateAsync(payload);
    };

    if (isLoading) {
        return (
            <div className='flex min-h-[60vh] items-center justify-center'>
                <Spinner size='xl' />
            </div>
        );
    }

    if (isError) {
        return (
            <div className='mx-auto max-w-4xl px-4 py-10'>
                <Alert color='failure'>
                    {error?.response?.data?.message || error?.message || 'Unable to load this page.'}
                </Alert>
            </div>
        );
    }

    return (
        <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
            <div className='mb-6 flex flex-col gap-2'>
                <h1 className='text-3xl font-semibold text-gray-900 dark:text-white'>Edit page</h1>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    Iterate on copy, visuals, and layout to keep your content fresh.
                </p>
            </div>

            {successMessage && (
                <Alert color='success' className='mb-6' onDismiss={() => setSuccessMessage('')}>
                    {successMessage}
                </Alert>
            )}

            {mutation.isError && (
                <Alert color='failure' className='mb-6'>
                    {mutation.error?.response?.data?.message || mutation.error?.message || 'Failed to update the page.'}
                </Alert>
            )}

            <PageForm
                initialValues={data}
                onSubmit={handleUpdate}
                isSubmitting={mutation.isPending}
                submitLabel='Save changes'
            />
        </div>
    );
};

export default UpdatePage;
