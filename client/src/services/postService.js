// client/src/services/postService.js
/**
 * A service file for post-related API calls.
 */

// This function remains correct for general-purpose fetching.
export const getPosts = async (searchQuery) => {
    const res = await fetch(`/api/post/getposts?${searchQuery}`);
    if (!res.ok) {
        throw new Error('Failed to fetch posts');
    }
    const data = await res.json();
    return data;
};

/**
 * Fetches posts for a specific admin user for use with useInfiniteQuery.
 * @param {object} params - The object provided by React Query.
 * @param {Array} params.queryKey - The query key, where queryKey[1] is the userId.
 * @param {number} params.pageParam - The starting index for the next page.
 * @returns {Promise<object>} The data containing the posts array.
 */
export const getAdminPosts = async ({ queryKey, pageParam = 0 }) => {
    // UPDATED: Get the userId from the queryKey passed by React Query.
    const userId = queryKey[1];
    const res = await fetch(`/api/post/getposts?userId=${userId}&startIndex=${pageParam}`);
    if (!res.ok) throw new Error('Failed to fetch admin posts');
    return res.json();
};

/**
 * Deletes a post.
 * @param {object} params - An object containing the identifiers.
 * @param {string} params.postId - The ID of the post to delete.
 * @param {string} params.userId - The ID of the user who owns the post.
 * @returns {Promise<object>} The server's confirmation message.
 */
export const deletePost = async ({ postId, userId }) => {
    // UPDATED: The function now accepts an object and sends both IDs to the backend.
    const res = await fetch(`/api/post/deletepost/${postId}/${userId}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete post');
    return res.json();
};

// This function is correct.
export const getPost = async (postId) => {
    const res = await fetch(`/api/post/getposts?postId=${postId}`);
    if (!res.ok) throw new Error('Failed to fetch post data.');
    const data = await res.json();
    // The getposts route returns an array, so we take the first element.
    return data.posts[0];
};

// This function is correct.
export const updatePost = async ({ postId, userId, formData }) => {
    const res = await fetch(`/api/post/updatepost/${postId}/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update post.');
    }
    return res.json();
};

// This function is correct.
export const getRecentPosts = async () => {
    const res = await fetch('/api/post/getposts?limit=9');
    if (!res.ok) {
        throw new Error('Failed to fetch recent posts');
    }
    const data = await res.json();
    return data.posts;
};