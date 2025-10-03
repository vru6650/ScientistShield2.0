// client/src/pages/PostPage.jsx
import { Button, Alert, Tooltip } from 'flowbite-react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { useEffect, useState, useMemo, useCallback } from 'react';
import hljs from 'highlight.js';
import ImageViewer from 'react-simple-image-viewer';
import { Helmet } from 'react-helmet-async';
import { FaClock, FaBookOpen, FaCalendarAlt, FaArrowRight, FaCommentDots } from 'react-icons/fa';
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
import { ReadingSettingsProvider, useReadingSettingsContext } from '../context/ReadingSettingsContext.jsx';
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

function PostPageContent() {
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
    } = useReadingSettingsContext();

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
        if (!heroImage) {
            return {
                backgroundImage: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.88))',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            };
        }

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

    const heroDescriptionText = metaDescription;

    const scrollToElement = useCallback((elementId) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    const handleStartReading = useCallback(() => {
        scrollToElement('article-start');
    }, [scrollToElement]);

    const handleDiscuss = useCallback(() => {
        scrollToElement('comments-section');
    }, [scrollToElement]);

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

            <ReadingControlCenter />

            <ReadingProgressBar />
            <div className='min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 pb-16 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950'>
                <section
                    className='relative isolate overflow-hidden bg-slate-900 text-white'
                    style={heroBackgroundStyle}
                >
                    <div className='absolute inset-0 bg-slate-900/80 backdrop-blur-sm dark:bg-slate-950/85' />
                    <div className='absolute inset-x-0 -bottom-40 h-[420px] bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent opacity-80 blur-3xl dark:from-slate-950 dark:via-slate-950/80' aria-hidden />
                    <div className='absolute -left-32 top-24 h-64 w-64 rounded-full bg-gradient-to-br from-sky-500/40 via-cyan-400/30 to-emerald-400/40 blur-3xl' aria-hidden />
                    <div className='absolute -right-32 bottom-24 h-72 w-72 rounded-full bg-gradient-to-br from-purple-500/30 via-indigo-500/30 to-amber-400/30 blur-3xl' aria-hidden />
                    <div className='relative mx-auto flex max-w-5xl flex-col gap-8 px-6 py-24 text-center sm:py-32 lg:px-0'>
                        <div className='inline-flex flex-wrap items-center justify-center gap-3 self-center text-xs uppercase tracking-widest text-slate-100'>
                            <span className='inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 font-semibold backdrop-blur'>
                                <HiOutlineSparkles className='h-4 w-4 text-amber-300' aria-hidden />
                                Featured Insight
                            </span>
                            <Link
                                to={`/search?category=${categoryQuery}`}
                                className='inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1 font-medium backdrop-blur transition hover:border-white/50 hover:bg-white/20'
                            >
                                {formatCategory(post.category)}
                            </Link>
                        </div>
                        <h1 className='text-balance text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl'>
                            {post.title}
                        </h1>
                        {heroDescriptionText && (
                            <p className='mx-auto max-w-3xl text-base text-slate-200/90 sm:text-lg'>
                                {heroDescriptionText}
                            </p>
                        )}
                        <div className='flex flex-wrap items-center justify-center gap-3'>
                            <Button
                                gradientDuoTone='purpleToBlue'
                                className='group flex items-center gap-2 rounded-full px-6 py-2 text-sm font-semibold shadow-lg shadow-purple-500/30'
                                onClick={handleStartReading}
                            >
                                Start reading
                                <FaArrowRight className='h-4 w-4 transition-transform duration-300 group-hover:translate-x-1' />
                            </Button>
                            <Button
                                color='light'
                                className='group flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-2 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/20'
                                onClick={handleDiscuss}
                            >
                                Join the discussion
                                <FaCommentDots className='h-4 w-4 text-slate-200 transition-transform duration-300 group-hover:-translate-y-0.5' />
                            </Button>
                        </div>
                        <div className='mx-auto flex flex-wrap items-center justify-center gap-4 text-sm text-slate-200/90'>
                            {formattedPublishDate && (
                                <span className='inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur'>
                                    <FaCalendarAlt className='h-4 w-4 text-emerald-300' aria-hidden />
                                    {formattedPublishDate}
                                </span>
                            )}
                            {readingStats.readingMinutes > 0 && (
                                <span className='inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur'>
                                    <FaClock className='h-4 w-4 text-sky-300' aria-hidden />
                                    {readingStats.readingMinutes} minute read
                                </span>
                            )}
                            {readingStats.wordCount > 0 && (
                                <span className='inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur'>
                                    <FaBookOpen className='h-4 w-4 text-indigo-300' aria-hidden />
                                    {readingStats.wordCount.toLocaleString()} words
                                </span>
                            )}
                        </div>
                    </div>
                </section>

                <main className='mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 lg:flex-row lg:px-10'>
                    <article id='article-start' className='flex-1 space-y-10'>
                        {(heroImage || post.mediaType === 'video') && (
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
                                        src={heroImage}
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
                                className='post-content tiptap reading-surface w-full space-y-6 px-6 py-8 text-left text-slate-700 transition-all duration-300 dark:text-slate-200 sm:px-10 sm:py-12'
                                chapterId={post._id}
                            />
                        </div>

                        <div className='flex flex-col gap-6 rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-xl shadow-slate-200/70 backdrop-blur dark:border-white/5 dark:bg-slate-900/80 dark:shadow-slate-900/60 sm:flex-row sm:items-center sm:justify-between'>
                            <div className='flex flex-1 flex-col items-start gap-4 sm:flex-row sm:items-center'>
                                <ClapButton post={post} />
                                <div className='max-w-sm text-left'>
                                    <p className='text-sm font-semibold text-slate-600 dark:text-slate-200'>Enjoying this insight?</p>
                                    <p className='text-sm text-slate-500 dark:text-slate-400'>Applaud the author and let them know this story resonated with you.</p>
                                </div>
                            </div>
                            <div className='flex flex-1 flex-col items-start gap-2 sm:items-end'>
                                <Tooltip content='Share this insight'>
                                    <span className='inline-flex items-center gap-3 rounded-full bg-slate-100/70 px-4 py-2 text-slate-600 shadow-sm shadow-slate-200/60 transition hover:bg-slate-100 dark:bg-slate-800/70 dark:text-slate-200 dark:shadow-slate-900/40'>
                                        <SocialShare post={post} />
                                        <span className='text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500'>Share</span>
                                    </span>
                                </Tooltip>
                                <p className='text-xs text-slate-400 dark:text-slate-500'>Spread the insight with your community.</p>
                            </div>
                        </div>

                        <div id='comments-section' className='overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 shadow-xl shadow-slate-200/70 dark:border-white/5 dark:bg-slate-900/70 dark:shadow-slate-900/60'>
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

export default function PostPage() {
    return (
        <ReadingSettingsProvider>
            <PostPageContent />
        </ReadingSettingsProvider>
    );
}
