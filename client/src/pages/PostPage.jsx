// client/src/pages/PostPage.jsx
import { Button, Alert, Tooltip } from 'flowbite-react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { useEffect, useState, useMemo } from 'react';
import hljs from 'highlight.js';
import ImageViewer from 'react-simple-image-viewer';
import { Helmet } from 'react-helmet-async';
import { FaClock, FaBookOpen, FaCalendarAlt } from 'react-icons/fa';
import { HiOutlineSparkles } from 'react-icons/hi';

// --- Component Imports ---
import CommentSection from '../components/CommentSection';
import PostCard from '../components/PostCard';
import TableOfContents from '../components/TableOfContents';
import ReadingProgressBar from '../components/ReadingProgressBar';
import SocialShare from '../components/SocialShare';
import ClapButton from '../components/ClapButton';
import CodeEditor from '../components/CodeEditor';
import ReadingControlCenter from '../components/ReadingControlCenter';
import useReadingSettings from '../hooks/useReadingSettings';
import InteractiveReadingSurface from '../components/InteractiveReadingSurface.jsx';
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
    <div className='min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950'>
        <div className='relative isolate overflow-hidden bg-slate-900 text-white'>
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.3),_transparent_55%)]' />
            <div className='mx-auto flex max-w-4xl flex-col gap-6 px-6 py-24 text-center'>
                <div className='mx-auto h-7 w-24 rounded-full bg-white/30' />
                <div className='mx-auto h-14 w-3/4 rounded-2xl bg-white/30' />
                <div className='mx-auto flex w-full max-w-xl items-center justify-center gap-4'>
                    <div className='h-4 w-24 rounded-full bg-white/30' />
                    <div className='h-4 w-24 rounded-full bg-white/30' />
                    <div className='h-4 w-24 rounded-full bg-white/30' />
                </div>
            </div>
        </div>
        <main className='mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 lg:flex-row lg:px-10'>
            <div className='flex-1 space-y-6'>
                <div className='h-96 w-full rounded-3xl bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-200/70 dark:bg-slate-900/80 dark:shadow-slate-900/50 dark:ring-white/5' />
                <div className='space-y-4 rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200/70 dark:bg-slate-900/80 dark:shadow-slate-900/50 dark:ring-white/5'>
                    {[...Array(5).keys()].map((key) => (
                        <div key={key} className='h-4 w-full rounded-full bg-slate-200 dark:bg-slate-700' />
                    ))}
                </div>
            </div>
            <aside className='h-96 w-full rounded-3xl bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-200/70 dark:bg-slate-900/80 dark:shadow-slate-900/50 dark:ring-white/5 lg:w-80' />
        </main>
    </div>
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

const formatCategory = (category) => {
    if (!category) return 'Uncategorized';
    return category
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');
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

    const {
        settings: readingSettings,
        updateSetting: updateReadingSetting,
        resetSettings: resetReadingSettings,
        contentStyles,
        contentMaxWidth,
        surfaceClass,
        contentPadding,
    } = useReadingSettings();

    const sharedContentStyle = useMemo(
        () => ({
            maxWidth: contentMaxWidth,
            paddingInline: contentPadding,
        }),
        [contentMaxWidth, contentPadding]
    );

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

    useEffect(() => {
        const { classList } = document.body;
        const focusClass = 'reading-focus-active';
        const guideClass = 'reading-guide-active';
        const contrastClass = 'reading-contrast-active';

        if (readingSettings.focusMode) {
            classList.add(focusClass);
        } else {
            classList.remove(focusClass);
        }

        if (readingSettings.readingGuide) {
            classList.add(guideClass);
        } else {
            classList.remove(guideClass);
        }

        if (readingSettings.highContrast) {
            classList.add(contrastClass);
        } else {
            classList.remove(contrastClass);
        }

        return () => {
            classList.remove(focusClass, guideClass, contrastClass);
        };
    }, [readingSettings.focusMode, readingSettings.readingGuide, readingSettings.highContrast]);

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
        return `${tempDiv.textContent.trim().slice(0, 155)}...`;
    };

    const metaDescription = useMemo(() => createMetaDescription(post?.content), [post?.content]);

    const readingStats = useMemo(() => {
        if (!sanitizedContent) return { wordCount: 0, readingMinutes: 0 };
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sanitizedContent;
        const text = tempDiv.textContent || '';
        const words = text.trim().split(/\s+/).filter(Boolean);
        const wordCount = words.length;
        const readingMinutes = wordCount ? Math.max(1, Math.ceil(wordCount / 200)) : 0;
        return { wordCount, readingMinutes };
    }, [sanitizedContent]);

    const formattedPublishDate = useMemo(() => {
        if (!post?.createdAt) return '';
        try {
            return new Date(post.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        } catch (error) {
            return '';
        }
    }, [post?.createdAt]);

    const heroImage = useMemo(() => {
        if (!post) return null;
        if (post.mediaType === 'video') return post.image || null;
        return post.mediaUrl || post.image || null;
    }, [post]);

    const heroBackgroundStyle = useMemo(() => {
        if (!heroImage) return {};
        return {
            backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.35)), url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        };
    }, [heroImage]);

    const categoryQuery = useMemo(() => {
        if (!post?.category) return 'all';
        return encodeURIComponent(post.category);
    }, [post?.category]);

    return (
        <>
            <Helmet>
                <title>{post.title}</title>
                <meta name="description" content={metaDescription} />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:image" content={post.mediaUrl || post.image} />
                <meta property="og:url" content={window.location.href} />
                <meta property="og:type" content="article" />
            </Helmet>

            <ReadingControlCenter
                settings={readingSettings}
                onChange={updateReadingSetting}
                onReset={resetReadingSettings}
            />

            <ReadingProgressBar />
            <div className='min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 pb-16 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950'>
                <section
                    className='relative isolate overflow-hidden bg-slate-900 text-white'
                    style={heroBackgroundStyle}
                >
                    <div className='absolute inset-0 bg-slate-900/75 backdrop-blur-sm dark:bg-slate-950/80' />
                    <div className='relative mx-auto flex max-w-4xl flex-col gap-8 px-6 py-24 text-center sm:py-28 lg:px-0'>
                        <div className='inline-flex items-center justify-center gap-2 self-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-slate-100 backdrop-blur'>
                            <HiOutlineSparkles className='h-4 w-4 text-amber-300' aria-hidden />
                            Featured Insight
                        </div>
                        <Link to={`/search?category=${categoryQuery}`} className='inline-flex items-center justify-center self-center'>
                            <span className='inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-xs font-medium uppercase tracking-wide text-slate-100 ring-1 ring-white/30 backdrop-blur-sm transition hover:bg-white/30'>
                                {formatCategory(post.category)}
                            </span>
                        </Link>
                        <h1 className='text-balance text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl'>
                            {post.title}
                        </h1>
                        {metaDescription && (
                            <p className='mx-auto max-w-2xl text-base text-slate-200 sm:text-lg'>
                                {metaDescription}
                            </p>
                        )}
                        <div className='mx-auto flex flex-wrap items-center justify-center gap-6 text-sm text-slate-200'>
                            {formattedPublishDate && (
                                <span className='inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15'>
                                    <FaCalendarAlt className='h-4 w-4' aria-hidden />
                                    {formattedPublishDate}
                                </span>
                            )}
                            {readingStats.readingMinutes > 0 && (
                                <span className='inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15'>
                                    <FaClock className='h-4 w-4' aria-hidden />
                                    {readingStats.readingMinutes} min read
                                </span>
                            )}
                            {readingStats.wordCount > 0 && (
                                <span className='inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15'>
                                    <FaBookOpen className='h-4 w-4' aria-hidden />
                                    {readingStats.wordCount.toLocaleString()} words
                                </span>
                            )}
                        </div>
                    </div>
                </section>

                <main className='mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pt-10 lg:flex-row lg:px-8'>
                    <article className='flex-1 space-y-10'>
                        {(post.mediaUrl || post.image) && (
                            <div className='overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-xl shadow-slate-200/70 transition duration-500 hover:-translate-y-1 hover:shadow-2xl dark:border-white/5 dark:bg-slate-900/70 dark:shadow-slate-900/60'>
                                {post.mediaType === 'video' ? (
                                    <video
                                        src={post.mediaUrl}
                                        controls
                                        className='h-full w-full rounded-3xl object-cover'
                                        poster={post.image || undefined}
                                    />
                                ) : (
                                    <img
                                        src={post.mediaUrl || post.image}
                                        alt={post.title}
                                        className='h-full w-full object-cover'
                                        loading='lazy'
                                    />
                                )}
                            </div>
                        )}

                        <div
                            className='overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-xl shadow-slate-200/70 dark:border-white/5 dark:bg-slate-900/70 dark:shadow-slate-900/60'
                            style={sharedContentStyle}
                        >
                            <InteractiveReadingSurface
                                content={sanitizedContent}
                                parserOptions={parserOptions}
                                contentStyles={contentStyles}
                                contentMaxWidth={contentMaxWidth}
                                surfaceClass={surfaceClass}
                                className='post-content tiptap reading-surface w-full space-y-6 px-6 py-8 text-left text-slate-700 transition-all duration-300 dark:text-slate-200 sm:px-10 sm:py-12'
                                chapterId={post._id}
                            />
                        </div>

                        <div className='flex flex-col gap-6 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-xl shadow-slate-200/70 dark:border-white/5 dark:bg-slate-900/70 dark:shadow-slate-900/60 sm:flex-row sm:items-center sm:justify-between'>
                            <ClapButton post={post} />
                            <div className='flex items-center gap-3'>
                                <Tooltip content='Share this insight'>
                                    <span>
                                        <SocialShare post={post} />
                                    </span>
                                </Tooltip>
                            </div>
                        </div>

                        <div className='overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 shadow-xl shadow-slate-200/70 dark:border-white/5 dark:bg-slate-900/70 dark:shadow-slate-900/60'>
                            <CommentSection postId={post._id} />
                        </div>

                        {relatedPosts && relatedPosts.filter(p => p._id !== post._id).length > 0 && (
                            <section className='space-y-6 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-xl shadow-slate-200/70 dark:border-white/5 dark:bg-slate-900/70 dark:shadow-slate-900/60'>
                                <div className='flex items-center justify-between'>
                                    <h2 className='text-lg font-semibold text-slate-800 dark:text-slate-100'>Related articles</h2>
                                    <span className='text-xs uppercase tracking-wide text-slate-400'>Curated for you</span>
                                </div>
                                <div className='grid gap-5 md:grid-cols-2'>
                                    {relatedPosts
                                        .filter(p => p._id !== post._id)
                                        .map((p) => (
                                            <PostCard key={p._id} post={p} />
                                        ))}
                                </div>
                            </section>
                        )}
                    </article>

                    <aside className='w-full space-y-8 lg:w-80 lg:pt-6'>
                        <div className='sticky top-28 flex flex-col gap-8'>
                            <div className='overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 shadow-xl shadow-slate-200/70 dark:border-white/5 dark:bg-slate-900/70 dark:shadow-slate-900/60'>
                                <h2 className='text-base font-semibold text-slate-800 dark:text-slate-100'>On this page</h2>
                                <p className='mt-2 text-sm text-slate-500 dark:text-slate-400'>Navigate through the key sections of this story.</p>
                                <div className='mt-4 max-h-[60vh] overflow-y-auto pr-1 text-sm'>
                                    <TableOfContents headings={headings} />
                                </div>
                            </div>

                            <div className='rounded-3xl border border-slate-200/70 bg-white p-6 shadow-xl shadow-slate-200/70 dark:border-white/5 dark:bg-slate-900/70 dark:shadow-slate-900/60'>
                                <h3 className='text-base font-semibold text-slate-800 dark:text-slate-100'>Reading insights</h3>
                                <ul className='mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300'>
                                    {formattedPublishDate && (
                                        <li className='flex items-center gap-3 rounded-2xl bg-slate-100/60 px-3 py-2 dark:bg-slate-800/70'>
                                            <FaCalendarAlt className='h-4 w-4 text-slate-500 dark:text-slate-400' aria-hidden />
                                            Published on {formattedPublishDate}
                                        </li>
                                    )}
                                    {readingStats.readingMinutes > 0 && (
                                        <li className='flex items-center gap-3 rounded-2xl bg-slate-100/60 px-3 py-2 dark:bg-slate-800/70'>
                                            <FaClock className='h-4 w-4 text-slate-500 dark:text-slate-400' aria-hidden />
                                            {readingStats.readingMinutes} minute read
                                        </li>
                                    )}
                                    {readingStats.wordCount > 0 && (
                                        <li className='flex items-center gap-3 rounded-2xl bg-slate-100/60 px-3 py-2 dark:bg-slate-800/70'>
                                            <FaBookOpen className='h-4 w-4 text-slate-500 dark:text-slate-400' aria-hidden />
                                            {readingStats.wordCount.toLocaleString()} words to explore
                                        </li>
                                    )}
                                </ul>
                                <div className='mt-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 p-[1px]'>
                                    <div className='rounded-2xl bg-white p-5 text-center dark:bg-slate-950'>
                                        <p className='text-sm font-medium text-slate-700 dark:text-slate-200'>Adjust the reading experience to match your focus preference.</p>
                                        <p className='mt-2 text-xs text-slate-500 dark:text-slate-400'>Use the floating control center to tweak focus mode, guide lines and contrast.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </main>
            </div>

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