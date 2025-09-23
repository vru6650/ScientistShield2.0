// client/src/pages/PostPage.jsx
import { Button, Spinner, Alert } from 'flowbite-react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import { useEffect, useState, useMemo } from 'react';
import hljs from 'highlight.js';
import ImageViewer from 'react-simple-image-viewer';
import { Helmet } from 'react-helmet-async';

// --- Component Imports ---
import CommentSection from '../components/CommentSection';
import PostCard from '../components/PostCard';
import TableOfContents from '../components/TableOfContents';
import ReadingProgressBar from '../components/ReadingProgressBar';
import SocialShare from '../components/SocialShare';
import ClapButton from '../components/ClapButton';
import CodeEditor from '../components/CodeEditor';
import '../Tiptap.css';

// --- API fetching functions ---
const fetchPostBySlug = async (postSlug) => {
    const res = await fetch(`/api/post/getposts?slug=${postSlug}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch post.');
    if (data.posts.length === 0) throw new Error('Post not found.');
    return data.posts[0];
};

const fetchRelatedPosts = async (category) => {
    if (!category) return [];
    try {
        const res = await fetch(`/api/post/getposts?category=${category}&limit=3`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.posts;
    } catch (error) {
        console.error('Failed to fetch related posts:', error);
        return [];
    }
};

// --- Skeleton Component (Unchanged) ---
const PostPageSkeleton = () => (
    <main className='p-3 flex flex-col max-w-6xl mx-auto min-h-screen animate-pulse'>
        <div className='h-10 bg-gray-300 dark:bg-gray-600 rounded-md mt-10 p-3 max-w-2xl mx-auto w-full'></div>
        <div className='h-6 w-24 bg-gray-300 dark:bg-gray-600 rounded-full self-center mt-5'></div>
        <div className='mt-10 p-3 max-h-[600px] w-full h-96 bg-gray-300 dark:bg-gray-600 rounded-lg'></div>
        <div className='p-3 max-w-2xl mx-auto w-full mt-5'>
            <div className='h-4 bg-gray-300 dark:bg-gray-600 rounded-full w-full mb-4'></div>
            <div className='h-4 bg-gray-300 dark:bg-gray-600 rounded-full w-full mb-4'></div>
            <div className='h-4 bg-gray-300 dark:bg-gray-600 rounded-full w-3/4'></div>
        </div>
    </main>
);

// --- Helper functions (Unchanged) ---
const generateSlug = (text) => {
    if (!text) return '';
    return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
};
const getTextFromNode = (node) => {
    if (node.type === 'text') return node.data;
    if (node.type !== 'tag' || !node.children) return '';
    return node.children.map(getTextFromNode).join('');
};

export default function PostPage() {
    const { postSlug } = useParams();

    const { data: post, isLoading: isLoadingPost, error: postError } = useQuery({
        queryKey: ['post', postSlug],
        queryFn: () => fetchPostBySlug(postSlug),
        staleTime: 5 * 60 * 1000,
    });

    const { data: relatedPosts } = useQuery({
        queryKey: ['relatedPosts', post?.category],
        queryFn: () => fetchRelatedPosts(post.category),
        enabled: !!post,
    });

    const [currentImage, setCurrentImage] = useState(0);
    const [isViewerOpen, setIsViewerOpen] = useState(false);

    const sanitizedContent = useMemo(() => {
        return post?.content ? DOMPurify.sanitize(post.content) : '';
    }, [post?.content]);

    const headings = useMemo(() => {
        if (!sanitizedContent) return [];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sanitizedContent;
        const headingNodes = tempDiv.querySelectorAll('h2, h3');
        return Array.from(headingNodes).map(node => ({
            id: generateSlug(node.innerText),
            text: node.innerText,
            level: node.tagName.toLowerCase(),
        }));
    }, [sanitizedContent]);

    const imagesInPost = useMemo(() => {
        if (!sanitizedContent) return [];
        const imageSources = [];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sanitizedContent;
        const imageElements = tempDiv.querySelectorAll('img');
        imageElements.forEach(img => imageSources.push(img.src));
        return imageSources;
    }, [sanitizedContent]);

    const openImageViewer = (index) => {
        setCurrentImage(index);
        setIsViewerOpen(true);
    };
    const closeImageViewer = () => {
        setCurrentImage(0);
        setIsViewerOpen(false);
    };

    useEffect(() => {
        if (post?.content) {
            hljs.highlightAll();
            const preTags = document.querySelectorAll('.post-content pre');
            preTags.forEach(pre => {
                if (pre.querySelector('.copy-button')) return;
                const button = document.createElement('button');
                button.innerText = 'Copy';
                button.className = 'copy-button';
                button.addEventListener('click', () => {
                    const code = pre.querySelector('code').innerText;
                    navigator.clipboard.writeText(code).then(() => {
                        button.innerText = 'Copied!';
                        setTimeout(() => { button.innerText = 'Copy'; }, 2000);
                    });
                });
                pre.style.position = 'relative';
                pre.appendChild(button);
            });
        }
    }, [post]);

    if (isLoadingPost) return <PostPageSkeleton />;
    if (postError) return (
        <div className='flex justify-center items-center min-h-screen'>
            <Alert color='failure' className='text-xl'>Error: {postError.message}</Alert>
        </div>
    );
    if (!post) return null;

    const parserOptions = {
        replace: domNode => {
            if (domNode.type === 'tag' && (domNode.name === 'h2' || domNode.name === 'h3')) {
                const textContent = getTextFromNode(domNode);
                const id = generateSlug(textContent);
                if (id) domNode.attribs.id = id;
                return;
            }
            if (domNode.type === 'tag' && domNode.name === 'img') {
                const src = domNode.attribs.src;
                const index = imagesInPost.indexOf(src);
                if (index > -1) {
                    return (
                        <img
                            {...domNode.attribs}
                            onClick={() => openImageViewer(index)}
                            style={{ cursor: 'pointer' }}
                            loading="lazy"
                        />
                    );
                }
            }
            // NEW: Render the CodeEditor component
            if (domNode.type === 'tag' && domNode.name === 'div' && domNode.attribs['data-snippet-id']) {
                const snippetId = domNode.attribs['data-snippet-id'];
                return <CodeEditor snippetId={snippetId} />;
            }
        }
    };

    const createMetaDescription = (htmlContent) => {
        if (!htmlContent) return '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        return tempDiv.textContent.trim().slice(0, 155) + '...';
    };

    return (
        <>
            <Helmet>
                <title>{post.title}</title>
                <meta name="description" content={createMetaDescription(post.content)} />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={createMetaDescription(post.content)} />
                <meta property="og:image" content={post.mediaUrl || post.image} />
                <meta property="og:url" content={window.location.href} />
                <meta property="og:type" content="article" />
            </Helmet>

            <ReadingProgressBar />
            <main className='p-3 flex flex-col max-w-6xl mx-auto min-h-screen'>
                <h1 className='text-3xl mt-10 p-3 text-center font-serif max-w-2xl mx-auto lg:text-4xl'>{post.title}</h1>
                <Link to={`/search?category=${post.category}`} className='self-center mt-5'>
                    <Button color='gray' pill size='xs'>{post.category}</Button>
                </Link>
                <div className='mt-10 p-3 max-h-[600px] w-full flex justify-center'>
                    {post.mediaType === 'video' ? <video src={post.mediaUrl} controls className='w-full object-contain rounded-lg shadow-lg' /> : <img src={post.mediaUrl || post.image} alt={post.title} className='w-full object-contain rounded-lg shadow-lg' />}
                </div>
                <div className='flex justify-between p-3 border-b border-slate-500 mx-auto w-full max-w-2xl text-xs'>
                    <span>{new Date(post.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span className='italic'>{post.content ? `${Math.ceil(post.content.split(' ').length / 200)} min read` : '0 min read'}</span>
                </div>

                <div className="max-w-2xl mx-auto w-full">
                    <TableOfContents headings={headings} />
                </div>

                <div className='p-3 max-w-2xl mx-auto w-full post-content tiptap'>
                    {parse(sanitizedContent, parserOptions)}
                </div>

                <div className="max-w-2xl mx-auto w-full px-3 my-8 flex justify-between items-center">
                    <ClapButton post={post} />
                    <SocialShare post={post} />
                </div>

                <CommentSection postId={post._id} />

                <div className='flex flex-col justify-center items-center mb-5'>
                    <h1 className='text-xl mt-5'>Related articles</h1>
                    <div className='flex flex-wrap gap-5 mt-5 justify-center'>
                        {relatedPosts && relatedPosts.filter(p => p._id !== post._id).map((p) => <PostCard key={p._id} post={p} />)}
                    </div>
                </div>
            </main>

            {isViewerOpen && (
                <ImageViewer
                    src={imagesInPost}
                    currentIndex={currentImage}
                    disableScroll={true}
                    closeOnClickOutside={true}
                    onClose={closeImageViewer}
                    backgroundStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
                />
            )}
        </>
    );
}