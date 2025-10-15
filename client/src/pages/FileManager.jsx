import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
    HiOutlineFolder,
    HiOutlineDocumentText,
    HiOutlineTrash,
    HiOutlinePencilSquare,
    HiOutlineMagnifyingGlass,
    HiOutlineChevronRight,
    HiOutlineChevronDown,
    HiOutlineArrowUpOnSquare,
    HiOutlinePlus,
    HiOutlineSquare2Stack,
    HiOutlineListBullet,
    HiOutlineArrowsUpDown,
    HiOutlineArrowPath,
    HiOutlineEye,
    HiOutlineEllipsisHorizontal,
    HiOutlineSquares2X2,
    HiOutlinePhoto,
    HiOutlinePlayCircle,
    HiOutlineClock,
} from 'react-icons/hi2';
import {
    createFolder,
    deleteFileNode,
    getDirectory,
    getFolderTree,
    updateFileNode,
    uploadFile,
} from '../services/fileManagerService.js';
import folderIcon from '../assets/finder/folder.svg';
import imageIcon from '../assets/finder/image.svg';
import videoIcon from '../assets/finder/video.svg';
import audioIcon from '../assets/finder/audio.svg';
import documentIcon from '../assets/finder/document.svg';
import codeIcon from '../assets/finder/code.svg';
import archiveIcon from '../assets/finder/archive.svg';
import defaultIcon from '../assets/finder/default.svg';
import pdfIcon from '../assets/finder/pdf.svg';
import wordIcon from '../assets/finder/word.svg';
import excelIcon from '../assets/finder/excel.svg';
import powerpointIcon from '../assets/finder/powerpoint.svg';
import textIcon from '../assets/finder/text.svg';
import designIcon from '../assets/finder/design.svg';
import fontIcon from '../assets/finder/font.svg';

const DND_TYPE = 'FILE_NODE';

const FINDER_ICON_MAP = {
    folder: {
        key: 'finder/folder',
        fallback: folderIcon,
    },
    image: {
        key: 'finder/image',
        fallback: imageIcon,
    },
    video: {
        key: 'finder/video',
        fallback: videoIcon,
    },
    audio: {
        key: 'finder/audio',
        fallback: audioIcon,
    },
    document: {
        key: 'finder/document',
        fallback: documentIcon,
    },
    code: {
        key: 'finder/code',
        fallback: codeIcon,
    },
    archive: {
        key: 'finder/archive',
        fallback: archiveIcon,
    },
    pdf: {
        key: 'finder/pdf',
        fallback: pdfIcon,
    },
    word: {
        key: 'finder/word',
        fallback: wordIcon,
    },
    excel: {
        key: 'finder/excel',
        fallback: excelIcon,
    },
    powerpoint: {
        key: 'finder/powerpoint',
        fallback: powerpointIcon,
    },
    text: {
        key: 'finder/text',
        fallback: textIcon,
    },
    design: {
        key: 'finder/design',
        fallback: designIcon,
    },
    font: {
        key: 'finder/font',
        fallback: fontIcon,
    },
    default: {
        key: 'finder/default',
        fallback: defaultIcon,
    },
};

const FILE_EXTENSION_GROUPS = {
    image: new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'ico', 'heic', 'heif', 'raw']),
    audio: new Set(['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma']),
    video: new Set(['mp4', 'mov', 'avi', 'mkv', 'webm', 'mpeg', 'mpg', 'm4v']),
    code: new Set(['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'rb', 'php', 'go', 'rs', 'swift', 'kt', 'json', 'yaml', 'yml', 'html', 'css', 'scss', 'md']),
    document: new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'rtf', 'odt', 'key', 'pages', 'numbers']),
    archive: new Set(['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz']),
    design: new Set(['psd', 'ai', 'xd', 'sketch', 'fig', 'blend', 'figma']),
    font: new Set(['ttf', 'otf', 'woff', 'woff2', 'eot']),
};

const EXTENSION_ICON_OVERRIDES = new Map([
    ['pdf', 'pdf'],
    ['doc', 'word'],
    ['docx', 'word'],
    ['dot', 'word'],
    ['dotx', 'word'],
    ['rtf', 'word'],
    ['pages', 'word'],
    ['xls', 'excel'],
    ['xlsx', 'excel'],
    ['xlsm', 'excel'],
    ['csv', 'excel'],
    ['numbers', 'excel'],
    ['ppt', 'powerpoint'],
    ['pptx', 'powerpoint'],
    ['key', 'powerpoint'],
    ['txt', 'text'],
    ['md', 'text'],
    ['markdown', 'text'],
    ['log', 'text'],
    ['psd', 'design'],
    ['ai', 'design'],
    ['sketch', 'design'],
    ['fig', 'design'],
    ['xd', 'design'],
    ['blend', 'design'],
    ['ttf', 'font'],
    ['otf', 'font'],
    ['woff', 'font'],
    ['woff2', 'font'],
]);

const MIME_ICON_OVERRIDES = new Map([
    ['application/pdf', 'pdf'],
    ['application/msword', 'word'],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'word'],
    ['application/vnd.ms-excel', 'excel'],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'excel'],
    ['application/vnd.ms-powerpoint', 'powerpoint'],
    ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'powerpoint'],
    ['text/plain', 'text'],
]);

const getIconPack = () => {
    if (typeof window === 'undefined') return 'default';
    try {
        return localStorage.getItem('iconPack') || 'default';
    } catch (error) {
        return 'default';
    }
};

const buildFinderIconSrc = (key, fallback) => {
    const pack = getIconPack();
    if (pack === 'whitesur') {
        return `/icons/whitesur/${key}.svg`;
    }
    return fallback;
};

const FINDER_QUICK_FILTERS = [
    {
        value: 'all',
        label: 'All',
        description: 'Everything in view',
        icon: HiOutlineSquares2X2,
    },
    {
        value: 'folders',
        label: 'Folders',
        description: 'Only folders',
        icon: HiOutlineFolder,
    },
    {
        value: 'images',
        label: 'Images',
        description: 'Photos & graphics',
        icon: HiOutlinePhoto,
    },
    {
        value: 'documents',
        label: 'Documents',
        description: 'Docs & PDFs',
        icon: HiOutlineDocumentText,
    },
    {
        value: 'media',
        label: 'Media',
        description: 'Video & audio',
        icon: HiOutlinePlayCircle,
    },
    {
        value: 'recent',
        label: 'Recents',
        description: 'Updated last 7 days',
        icon: HiOutlineClock,
    },
];

const RECENT_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 7;

const getItemExtension = (item) => {
    if (!item) return '';
    if (item.extension) return item.extension.toLowerCase();
    const segments = (item.name || '').split('.');
    if (segments.length <= 1) return '';
    return segments.pop().toLowerCase();
};

const matchesFilterCategory = (item, category) => {
    if (!item || category === 'all') return true;

    if (category === 'folders') {
        return item.type === 'folder';
    }

    if (category === 'recent') {
        if (!item.updatedAt) return false;
        const updatedAt = new Date(item.updatedAt).getTime();
        if (Number.isNaN(updatedAt)) return false;
        return Date.now() - updatedAt <= RECENT_THRESHOLD_MS;
    }

    if (item.type !== 'file') return false;

    const extension = getItemExtension(item);
    const mime = item.mimeType || '';

    if (category === 'images') {
        return FILE_EXTENSION_GROUPS.image.has(extension) || mime.startsWith('image/');
    }

    if (category === 'documents') {
        return (
            FILE_EXTENSION_GROUPS.document.has(extension) ||
            MIME_ICON_OVERRIDES.get(mime) === 'pdf' ||
            MIME_ICON_OVERRIDES.get(mime) === 'word' ||
            MIME_ICON_OVERRIDES.get(mime) === 'excel' ||
            MIME_ICON_OVERRIDES.get(mime) === 'powerpoint' ||
            MIME_ICON_OVERRIDES.get(mime) === 'text'
        );
    }

    if (category === 'media') {
        return (
            FILE_EXTENSION_GROUPS.video.has(extension) ||
            FILE_EXTENSION_GROUPS.audio.has(extension) ||
            mime.startsWith('video/') ||
            mime.startsWith('audio/')
        );
    }

    return true;
};

export default function FileManager() {
    const queryClient = useQueryClient();
    const [currentFolder, setCurrentFolder] = useState(null);
    const [expandedFolders, setExpandedFolders] = useState(() => new Set([null]));
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('name-asc');
    const [quickLookItem, setQuickLookItem] = useState(null);
    const [filterCategory, setFilterCategory] = useState('all');

    const { data: directoryData, isFetching: isDirectoryLoading } = useQuery({
        queryKey: ['file-directory', currentFolder],
        queryFn: () => getDirectory(currentFolder),
    });

    const { data: treeData } = useQuery({
        queryKey: ['file-tree'],
        queryFn: getFolderTree,
    });

    const createFolderMutation = useMutation({
        mutationFn: createFolder,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['file-directory', variables.parentId ?? null] });
            queryClient.invalidateQueries({ queryKey: ['file-tree'] });
        },
    });

    const uploadFileMutation = useMutation({
        mutationFn: uploadFile,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['file-directory', variables.parentId ?? null] });
            queryClient.invalidateQueries({ queryKey: ['file-tree'] });
        },
    });

    const updateNodeMutation = useMutation({
        mutationFn: updateFileNode,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['file-directory'] });
            queryClient.invalidateQueries({ queryKey: ['file-tree'] });
        },
    });

    const deleteNodeMutation = useMutation({
        mutationFn: deleteFileNode,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['file-directory'] });
            queryClient.invalidateQueries({ queryKey: ['file-tree'] });
            setSelectedItemId(null);
        },
    });

    const items = useMemo(() => directoryData?.items ?? [], [directoryData]);
    const breadcrumbs = useMemo(() => directoryData?.breadcrumbs ?? [{ id: null, name: 'All Files' }], [directoryData]);

    const filteredItems = useMemo(() => {
        const lowered = searchTerm.trim().toLowerCase();
        return items.filter((item) => {
            const matchesSearch = !lowered || item.name.toLowerCase().includes(lowered);
            const matchesFilter = matchesFilterCategory(item, filterCategory);
            return matchesSearch && matchesFilter;
        });
    }, [items, searchTerm, filterCategory]);

    const sortedItems = useMemo(() => {
        const clone = [...filteredItems];
        const parseDate = (value) => new Date(value || Date.now()).getTime();
        const compare = {
            'name-asc': (a, b) => a.name.localeCompare(b.name),
            'name-desc': (a, b) => b.name.localeCompare(a.name),
            'date-desc': (a, b) => parseDate(b.updatedAt) - parseDate(a.updatedAt),
            'date-asc': (a, b) => parseDate(a.updatedAt) - parseDate(b.updatedAt),
            'size-desc': (a, b) => (b.size || 0) - (a.size || 0),
            'size-asc': (a, b) => (a.size || 0) - (b.size || 0),
        }[sortOption];
        clone.sort(compare);
        return clone;
    }, [filteredItems, sortOption]);

    const selectedItem = useMemo(
        () => sortedItems.find((item) => item.id === selectedItemId) ?? items.find((item) => item.id === selectedItemId) ?? null,
        [sortedItems, items, selectedItemId]
    );

    useEffect(() => {
        setSelectedItemId((prev) => {
            if (!prev) return prev;
            const exists = sortedItems.some((item) => item.id === prev);
            return exists ? prev : null;
        });
    }, [sortedItems]);

    useEffect(() => {
        if (selectedItem && selectedItem.parentId && selectedItem.parentId.toString() !== (currentFolder ?? '').toString()) {
            setSelectedItemId(null);
        }
    }, [selectedItem, currentFolder]);

    const handleNavigate = useCallback((folderId) => {
        setCurrentFolder(folderId);
        setSelectedItemId(null);
    }, []);

    const handleFolderToggle = useCallback((folderId) => {
        setExpandedFolders((prev) => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    }, []);

    const requestCreateFolder = useCallback(() => {
        const name = window.prompt('New folder name');
        if (!name) return;
        createFolderMutation.mutate({ name, parentId: currentFolder });
    }, [createFolderMutation, currentFolder]);

    const requestUpload = useCallback(
        (files) => {
            if (!files?.length) return;
            Array.from(files).forEach((file) => {
                uploadFileMutation.mutate({ file, parentId: currentFolder });
            });
        },
        [uploadFileMutation, currentFolder]
    );

    const requestRename = useCallback(
        (item) => {
            const name = window.prompt('Rename item', item.name);
            if (!name || name === item.name) return;
            updateNodeMutation.mutate({ id: item.id, payload: { name } });
        },
        [updateNodeMutation]
    );

    const requestDelete = useCallback(
        (item) => {
            const confirmed = window.confirm(`Delete "${item.name}"?`);
            if (!confirmed) return;
            deleteNodeMutation.mutate(item.id);
        },
        [deleteNodeMutation]
    );

    const requestMove = useCallback(
        (itemId, targetFolderId) => {
            updateNodeMutation.mutate({ id: itemId, payload: { newParentId: targetFolderId } });
        },
        [updateNodeMutation]
    );

    const handleItemOpen = useCallback(
        (item) => {
            if (item.type === 'folder') {
                handleNavigate(item.id);
                setExpandedFolders((prev) => new Set(prev).add(item.id));
            } else if (item.previewUrl) {
                window.open(item.previewUrl, '_blank', 'noopener,noreferrer');
            }
        },
        [handleNavigate]
    );

    const openQuickLook = useCallback(
        (item) => {
            if (item?.type === 'file') {
                setQuickLookItem(item);
            }
        },
        []
    );

    const closeQuickLook = useCallback(() => setQuickLookItem(null), []);

    const handleRefresh = useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: ['file-directory', currentFolder ?? null],
        });
        queryClient.invalidateQueries({
            queryKey: ['file-tree'],
        });
    }, [queryClient, currentFolder]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (!selectedItem) return;
            if (event.code === 'Space' && selectedItem.type === 'file') {
                event.preventDefault();
                openQuickLook(selectedItem);
            }
            if (event.key === 'Enter') {
                handleItemOpen(selectedItem);
            }
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'r') {
                event.preventDefault();
                requestRename(selectedItem);
            }
            if (event.key === 'Delete' || event.key === 'Backspace') {
                event.preventDefault();
                requestDelete(selectedItem);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedItem, handleItemOpen, requestRename, requestDelete, openQuickLook]);

    const originalItemsCount = items.length;
    const filteredCount = sortedItems.length;
    const aggregateSize = sortedItems.reduce((acc, item) => acc + (item.size || 0), 0);
    const activeFilter = FINDER_QUICK_FILTERS.find((option) => option.value === filterCategory) ?? FINDER_QUICK_FILTERS[0];

    return (
        <section className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 lg:px-0">
            <header className="flex flex-col gap-4 rounded-[28px] border border-slate-200/70 bg-slate-50/80 p-0.5 shadow-[0_30px_90px_-50px_rgba(15,23,42,0.7)] backdrop-blur">
                <div className="rounded-[26px] bg-gradient-to-b from-white/95 via-white/90 to-slate-100/80 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                    <FinderToolbar
                        breadcrumbs={breadcrumbs}
                        onNavigate={handleNavigate}
                        onCreateFolder={requestCreateFolder}
                        onUpload={requestUpload}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        sortOption={sortOption}
                        onSortChange={setSortOption}
                        isCreating={createFolderMutation.isPending}
                        isUploading={uploadFileMutation.isPending}
                        onQuickLook={() => openQuickLook(selectedItem)}
                        onRefresh={handleRefresh}
                        hasSelection={Boolean(selectedItem)}
                        filterCategory={filterCategory}
                        onFilterChange={setFilterCategory}
                    />
                </div>
            </header>
            <DndProvider backend={HTML5Backend}>
                <div className="flex w-full flex-col gap-4 lg:flex-row">
                    <FinderSidebar
                        tree={treeData}
                        activeId={currentFolder}
                        expandedFolders={expandedFolders}
                        onToggle={handleFolderToggle}
                        onNavigate={handleNavigate}
                        onMove={requestMove}
                    />
                    <FinderContentArea
                        items={sortedItems}
                        originalItems={items}
                        isLoading={isDirectoryLoading}
                        viewMode={viewMode}
                        selectedItemId={selectedItemId}
                        selectedItem={selectedItem}
                        onSelect={setSelectedItemId}
                        onOpen={handleItemOpen}
                        onRename={requestRename}
                        onDelete={requestDelete}
                        onMove={requestMove}
                        activeFolderId={currentFolder}
                        onQuickLook={openQuickLook}
                        filterCategory={filterCategory}
                        filterLabel={activeFilter?.label}
                        filterDescription={activeFilter?.description}
                    />
                    <FinderPreviewPane item={selectedItem} onRename={requestRename} onDelete={requestDelete} onQuickLook={openQuickLook} />
                </div>
                <FinderStatusBar
                    totalItems={originalItemsCount}
                    visibleItems={filteredCount}
                    totalSize={aggregateSize}
                    selection={selectedItem}
                    filterLabel={activeFilter?.label}
                    searchTerm={searchTerm.trim()}
                />
                <QuickLookModal item={quickLookItem} onClose={closeQuickLook} />
            </DndProvider>
        </section>
    );
}

function FinderToolbar({
    breadcrumbs,
    onNavigate,
    onCreateFolder,
    onUpload,
    viewMode,
    onViewModeChange,
    searchTerm,
    onSearchChange,
    sortOption,
    onSortChange,
    isCreating,
    isUploading,
    onQuickLook,
    onRefresh,
    hasSelection,
    filterCategory,
    onFilterChange,
}) {
    const fileInputRef = useRef(null);
    const activeBreadcrumb = breadcrumbs[breadcrumbs.length - 1] ?? { name: 'All Files' };
    const quickFilters = FINDER_QUICK_FILTERS;

    const handleUploadClick = () => fileInputRef.current?.click();
    const handleFileChange = (event) => {
        const files = event.target.files;
        onUpload(files);
        event.target.value = '';
    };

    return (
        <div className="flex flex-col gap-6 text-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                        <span className="h-3.5 w-3.5 rounded-full bg-[#ff6057] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
                        <span className="h-3.5 w-3.5 rounded-full bg-[#ffbd2e] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
                        <span className="h-3.5 w-3.5 rounded-full bg-[#28c940] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
                    </span>
                    <p className="rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 shadow-inner shadow-white/80">
                        Finder
                    </p>
                    <span className="hidden items-center gap-1 rounded-full border border-transparent bg-white/70 px-3 py-1 text-xs text-slate-500 shadow-inner shadow-white/70 sm:flex">
                        <HiOutlineFolder className="text-slate-400" />
                        {activeBreadcrumb.name}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 shadow-sm shadow-slate-200 transition hover:border-slate-400 hover:text-slate-700"
                        onClick={onRefresh}
                    >
                        <HiOutlineArrowPath className="text-sm" />
                        Refresh
                    </button>
                    <button
                        type="button"
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition ${
                            hasSelection
                                ? 'border-sky-200 bg-sky-50 text-sky-700 shadow-sm hover:border-sky-300 hover:bg-sky-100'
                                : 'cursor-not-allowed border-slate-200 bg-white text-slate-300'
                        }`}
                        onClick={onQuickLook}
                        disabled={!hasSelection}
                    >
                        <HiOutlineEye className="text-sm" />
                        Quick Look
                    </button>
                </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
                {quickFilters.map((filter) => {
                    const Icon = filter.icon;
                    const isActive = filterCategory === filter.value;
                    return (
                        <button
                            key={filter.value}
                            type="button"
                            onClick={() => onFilterChange(filter.value)}
                            className={`flex min-w-[10rem] items-center gap-3 rounded-2xl border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
                                isActive
                                    ? 'border-sky-200 bg-sky-50 text-sky-700 shadow-inner shadow-white/80'
                                    : 'border-transparent bg-white/60 text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-700'
                            }`}
                            aria-pressed={isActive}
                        >
                            <span
                                className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${
                                    isActive ? 'border-sky-200 bg-white text-sky-600' : 'border-slate-200 bg-slate-50 text-slate-500'
                                }`}
                            >
                                <Icon />
                            </span>
                            <span className="flex flex-1 flex-col leading-tight">
                                <span className="text-sm font-semibold">{filter.label}</span>
                                <span className="text-[0.7rem] text-slate-400">{filter.description}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <nav className="flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-600 shadow-sm shadow-white/70">
                    {breadcrumbs.map((crumb, index) => {
                        const isLast = index === breadcrumbs.length - 1;
                        return (
                            <span key={`${crumb.id ?? 'root'}-${index}`} className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => onNavigate(crumb.id ?? null)}
                                    className={`rounded-xl border px-3 py-1 transition ${
                                        isLast
                                            ? 'cursor-default border-sky-200 bg-sky-50 text-sky-700 shadow-inner shadow-white/80'
                                            : 'border-transparent bg-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                                    }`}
                                    disabled={isLast}
                                >
                                    {crumb.name}
                                </button>
                                {!isLast && <HiOutlineChevronRight className="text-slate-300" />}
                            </span>
                        );
                    })}
                </nav>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-inner shadow-white/70">
                        <button
                            type="button"
                            className={`flex items-center gap-1 px-3 py-1.5 text-sm transition ${
                                viewMode === 'grid'
                                    ? 'bg-sky-500/10 text-sky-700 shadow-inner shadow-white/80'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                            }`}
                            onClick={() => onViewModeChange('grid')}
                        >
                            <HiOutlineSquare2Stack />
                            Grid
                        </button>
                        <button
                            type="button"
                            className={`flex items-center gap-1 px-3 py-1.5 text-sm transition ${
                                viewMode === 'list'
                                    ? 'bg-sky-500/10 text-sky-700 shadow-inner shadow-white/80'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                            }`}
                            onClick={() => onViewModeChange('list')}
                        >
                            <HiOutlineListBullet />
                            List
                        </button>
                    </div>
                    <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm shadow-white/70">
                        <HiOutlineArrowsUpDown className="text-base text-slate-400" />
                        <span>Sort</span>
                        <select
                            value={sortOption}
                            onChange={(event) => onSortChange(event.target.value)}
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 outline-none transition focus:border-sky-300 focus:ring-0"
                        >
                            <option value="name-asc">Name · A–Z</option>
                            <option value="name-desc">Name · Z–A</option>
                            <option value="date-desc">Date · Newest</option>
                            <option value="date-asc">Date · Oldest</option>
                            <option value="size-desc">Size · Largest</option>
                            <option value="size-asc">Size · Smallest</option>
                        </select>
                    </label>
                </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={onCreateFolder}
                        disabled={isCreating}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-400 hover:text-slate-700 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                    >
                        <HiOutlinePlus className="text-base" />
                        New Folder
                    </button>
                    <button
                        type="button"
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-gradient-to-r from-sky-100 via-sky-50 to-white px-3 py-1.5 text-sm font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:from-sky-200 hover:text-sky-800 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-white disabled:text-slate-300"
                    >
                        <HiOutlineArrowUpOnSquare className="text-base" />
                        Upload
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        multiple
                        onChange={handleFileChange}
                    />
                </div>
                <div className="relative w-full max-w-md">
                    <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                        type="search"
                        placeholder="Search current folder"
                        value={searchTerm}
                        onChange={(event) => onSearchChange(event.target.value)}
                        className="h-11 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-600 shadow-inner shadow-white/80 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                    />
                </div>
            </div>
        </div>
    );
}

FinderToolbar.propTypes = {
    breadcrumbs: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
            name: PropTypes.string,
        })
    ).isRequired,
    onNavigate: PropTypes.func.isRequired,
    onCreateFolder: PropTypes.func.isRequired,
    onUpload: PropTypes.func.isRequired,
    viewMode: PropTypes.oneOf(['grid', 'list']).isRequired,
    onViewModeChange: PropTypes.func.isRequired,
    searchTerm: PropTypes.string.isRequired,
    onSearchChange: PropTypes.func.isRequired,
    sortOption: PropTypes.string.isRequired,
    onSortChange: PropTypes.func.isRequired,
    isCreating: PropTypes.bool.isRequired,
    isUploading: PropTypes.bool.isRequired,
    onQuickLook: PropTypes.func.isRequired,
    onRefresh: PropTypes.func.isRequired,
    hasSelection: PropTypes.bool.isRequired,
    filterCategory: PropTypes.string.isRequired,
    onFilterChange: PropTypes.func.isRequired,
};

function FinderSidebar({ tree, activeId, expandedFolders, onToggle, onNavigate, onMove }) {
    const [, drop] = useDrop({
        accept: DND_TYPE,
        drop: (item) => {
            onMove(item.id, null);
        },
    });

    const folders = tree?.folders ?? [];

    return (
        <aside
            ref={drop}
            className="h-[32rem] w-full rounded-[26px] border border-slate-200/70 bg-white/85 p-5 shadow-sm shadow-slate-200/70 backdrop-blur lg:h-[36rem] lg:w-64"
        >
            <h2 className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-400">Locations</h2>
            <div className="space-y-1">
                <SidebarNode
                    node={{ id: null, name: 'All Files', children: folders }}
                    depth={0}
                    activeId={activeId}
                    expandedFolders={expandedFolders}
                    onToggle={onToggle}
                    onNavigate={onNavigate}
                    onMove={onMove}
                />
            </div>
        </aside>
    );
}

FinderSidebar.propTypes = {
    tree: PropTypes.shape({
        folders: PropTypes.array,
    }),
    activeId: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
    expandedFolders: PropTypes.instanceOf(Set).isRequired,
    onToggle: PropTypes.func.isRequired,
    onNavigate: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
};

FinderSidebar.defaultProps = {
    tree: null,
    activeId: null,
};

function SidebarNode({ node, depth, activeId, expandedFolders, onToggle, onNavigate, onMove }) {
    const isActive = (activeId ?? null)?.toString() === (node.id ?? null)?.toString();
    const isExpanded = expandedFolders.has(node.id ?? null);

    const [{ isOver, canDrop }, drop] = useDrop({
        accept: DND_TYPE,
        canDrop: (item) => node.id !== item.id,
        drop: (item) => onMove(item.id, node.id ?? null),
        collect: (monitor) => ({
            isOver: monitor.isOver({ shallow: true }),
            canDrop: monitor.canDrop(),
        }),
    });

    const handleClick = () => {
        onNavigate(node.id ?? null);
        onToggle(node.id ?? null);
    };

    return (
        <div ref={drop} style={{ marginLeft: depth * 12 }}>
            <button
                type="button"
                onClick={handleClick}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition ${
                    isActive ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                } ${isOver && canDrop ? 'border border-dashed border-sky-300 bg-sky-50' : ''}`}
            >
                {node.children?.length ? (
                    <span
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggle(node.id ?? null);
                        }}
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm"
                    >
                        {isExpanded ? (
                            <HiOutlineChevronDown className="text-xs" />
                        ) : (
                            <HiOutlineChevronRight className="text-xs" />
                        )}
                    </span>
                ) : (
                    <span className="h-6 w-6 flex-shrink-0" />
                )}
                <HiOutlineFolder className="text-sky-500" />
                <span className="truncate text-sm">{node.name}</span>
            </button>
            {isExpanded &&
                node.children?.map((child) => (
                    <SidebarNode
                        key={child.id}
                        node={child}
                        depth={depth + 1}
                        activeId={activeId}
                        expandedFolders={expandedFolders}
                        onToggle={onToggle}
                        onNavigate={onNavigate}
                        onMove={onMove}
                    />
                ))}
        </div>
    );
}

SidebarNode.propTypes = {
    node: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
        name: PropTypes.string.isRequired,
        children: PropTypes.array,
    }).isRequired,
    depth: PropTypes.number.isRequired,
    activeId: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
    expandedFolders: PropTypes.instanceOf(Set).isRequired,
    onToggle: PropTypes.func.isRequired,
    onNavigate: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
};

SidebarNode.defaultProps = {
    activeId: null,
};

function FinderContentArea({
    items,
    originalItems,
    isLoading,
    viewMode,
    selectedItemId,
    selectedItem,
    onSelect,
    onOpen,
    onRename,
    onDelete,
    onMove,
    activeFolderId,
    onQuickLook,
    filterCategory,
    filterLabel,
    filterDescription,
}) {
    const [{ isOver: isRootOver, canDrop: canDropRoot }, drop] = useDrop({
        accept: DND_TYPE,
        drop: (item) => {
            onMove(item.id, activeFolderId ?? null);
        },
        collect: (monitor) => ({
            isOver: monitor.isOver({ shallow: true }),
            canDrop: monitor.canDrop(),
        }),
    });

    const emptyState =
        !isLoading && originalItems.length === 0
            ? 'This folder is empty.'
            : !isLoading && items.length === 0
            ? 'No items match your search.'
            : null;

    return (
        <div
            ref={drop}
            className={`relative flex h-[32rem] flex-1 flex-col gap-4 rounded-[26px] border border-slate-200/70 bg-white/85 p-5 shadow-sm shadow-slate-200/70 backdrop-blur transition lg:h-[36rem] ${
                isRootOver && canDropRoot ? 'ring-2 ring-sky-300' : ''
            }`}
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-500">Contents</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    {filterCategory !== 'all' ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-500">
                            {filterLabel}
                            <span className="text-[0.65rem] uppercase tracking-[0.18em] text-slate-400">Filter</span>
                        </span>
                    ) : null}
                    {filterCategory !== 'all' && filterDescription ? (
                        <span className="hidden text-[0.7rem] text-slate-400 sm:inline">{filterDescription}</span>
                    ) : null}
                    {isLoading ? <span className="text-slate-400">Refreshing…</span> : null}
                    <button
                        type="button"
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[0.7rem] transition ${
                            selectedItem
                                ? 'border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800'
                                : 'cursor-not-allowed border-slate-200 bg-white text-slate-300'
                        }`}
                        onClick={() => selectedItem && onQuickLook(selectedItem)}
                        disabled={!selectedItem}
                    >
                        <HiOutlineEye className="text-sm" />
                        Quick Look
                    </button>
                </div>
            </div>
            {emptyState ? (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-sm text-slate-500">
                    {emptyState}
                </div>
            ) : (
                <FinderItemsView
                    items={items}
                    viewMode={viewMode}
                    selectedItemId={selectedItemId}
                    onSelect={onSelect}
                    onOpen={onOpen}
                    onRename={onRename}
                    onDelete={onDelete}
                    onMove={onMove}
                    onQuickLook={onQuickLook}
                />
            )}
            {isRootOver && canDropRoot && (
                <div className="pointer-events-none absolute inset-0 rounded-[26px] border-2 border-dashed border-sky-300 bg-sky-100/40" />
            )}
        </div>
    );
}

FinderContentArea.propTypes = {
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
    originalItems: PropTypes.arrayOf(PropTypes.object).isRequired,
    isLoading: PropTypes.bool.isRequired,
    viewMode: PropTypes.oneOf(['grid', 'list']).isRequired,
    selectedItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
    selectedItem: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
        type: PropTypes.string,
    }),
    onSelect: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
    activeFolderId: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
    onQuickLook: PropTypes.func.isRequired,
    filterCategory: PropTypes.string.isRequired,
    filterLabel: PropTypes.string,
    filterDescription: PropTypes.string,
};

FinderContentArea.defaultProps = {
    selectedItemId: null,
    selectedItem: null,
    activeFolderId: null,
    filterLabel: 'All',
    filterDescription: '',
};

function FinderItemsView({ items, viewMode, selectedItemId, onSelect, onOpen, onRename, onDelete, onMove, onQuickLook }) {
    if (viewMode === 'list') {
        return (
            <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-inner shadow-white/70">
                <table className="min-w-full text-sm text-slate-600">
                    <thead className="sticky top-0 bg-slate-100/90 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Size</th>
                            <th className="px-4 py-3">Updated</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <FinderListRow
                                key={item.id}
                                item={item}
                                isSelected={selectedItemId === item.id}
                                onSelect={onSelect}
                                onOpen={onOpen}
                                onRename={onRename}
                                onDelete={onDelete}
                                onMove={onMove}
                                onQuickLook={onQuickLook}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="grid flex-1 grid-cols-2 gap-4 overflow-auto rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-inner shadow-white/70 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
                <FinderGridCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItemId === item.id}
                    onSelect={onSelect}
                    onOpen={onOpen}
                    onRename={onRename}
                    onDelete={onDelete}
                    onMove={onMove}
                    onQuickLook={onQuickLook}
                />
            ))}
        </div>
    );
}

FinderItemsView.propTypes = {
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
    viewMode: PropTypes.oneOf(['grid', 'list']).isRequired,
    selectedItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
    onSelect: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
    onQuickLook: PropTypes.func.isRequired,
};

FinderItemsView.defaultProps = {
    selectedItemId: null,
};

const resolveFinderIconKey = (item) => {
    if (!item) return 'default';
    if (item.type === 'folder') return 'folder';

    const extension = (item.extension || '').toLowerCase();
    const mimeType = (item.mimeType || '').split(';')[0];

    if (EXTENSION_ICON_OVERRIDES.has(extension)) {
        return EXTENSION_ICON_OVERRIDES.get(extension);
    }
    if (MIME_ICON_OVERRIDES.has(mimeType)) {
        return MIME_ICON_OVERRIDES.get(mimeType);
    }

    if (mimeType.startsWith('image/') || FILE_EXTENSION_GROUPS.image.has(extension)) {
        return 'image';
    }
    if (mimeType.startsWith('audio/') || FILE_EXTENSION_GROUPS.audio.has(extension)) {
        return 'audio';
    }
    if (mimeType.startsWith('video/') || FILE_EXTENSION_GROUPS.video.has(extension)) {
        return 'video';
    }
    if (FILE_EXTENSION_GROUPS.design.has(extension)) {
        return 'design';
    }
    if (FILE_EXTENSION_GROUPS.font.has(extension)) {
        return 'font';
    }
    if (FILE_EXTENSION_GROUPS.code.has(extension)) {
        return 'code';
    }
    if (FILE_EXTENSION_GROUPS.document.has(extension)) {
        return 'document';
    }
    if (FILE_EXTENSION_GROUPS.archive.has(extension)) {
        return 'archive';
    }
    return 'default';
};

const ICON_SIZE_STYLES = {
    sm: {
        container: 'h-12 w-12',
        radius: 'rounded-xl',
    },
    md: {
        container: 'h-20 w-20',
        radius: 'rounded-2xl',
    },
    lg: {
        container: 'h-28 w-28',
        radius: 'rounded-[1.75rem]',
    },
};

function FinderItemIcon({ item, size = 'md' }) {
    const iconKey = resolveFinderIconKey(item);
    const mapping = FINDER_ICON_MAP[iconKey] ?? FINDER_ICON_MAP.default;
    const sizeStyle = ICON_SIZE_STYLES[size] || ICON_SIZE_STYLES.md;
    const iconSrc = buildFinderIconSrc(mapping.key, mapping.fallback);

    return (
        <div
            className={`pointer-events-none select-none ${sizeStyle.container} ${sizeStyle.radius} overflow-hidden border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-[0_18px_36px_rgba(15,23,42,0.18)]`}
        >
            <img
                src={iconSrc}
                alt={`${iconKey} icon`}
                className="h-full w-full object-contain"
                draggable={false}
            />
        </div>
    );
}

FinderItemIcon.propTypes = {
    item: PropTypes.shape({
        type: PropTypes.string,
        extension: PropTypes.string,
        mimeType: PropTypes.string,
    }).isRequired,
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

FinderItemIcon.defaultProps = {
    size: 'md',
};

function FinderGridCard({ item, isSelected, onSelect, onOpen, onRename, onDelete, onMove, onQuickLook }) {
    const [{ isDragging }, drag] = useDrag({
        type: DND_TYPE,
        item: { id: item.id, type: item.type },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const [{ isOver, canDrop }, drop] = useDrop({
        accept: DND_TYPE,
        canDrop: (dragged) => item.type === 'folder' && dragged.id !== item.id,
        drop: (dragged) => onMove(dragged.id, item.id),
        collect: (monitor) => ({
            isOver: monitor.isOver({ shallow: true }),
            canDrop: monitor.canDrop(),
        }),
    });

    const ref = useRef(null);
    drag(drop(ref));

    return (
        <div
            ref={ref}
            onClick={() => onSelect((prev) => (prev === item.id ? null : item.id))}
            onDoubleClick={() => onOpen(item)}
            className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border px-4 py-5 text-center transition shadow-[0_12px_30px_-20px_rgba(15,23,42,0.22)] ${
                isSelected
                    ? 'border-sky-300 bg-sky-50 text-sky-800 shadow-[0_18px_40px_-18px_rgba(56,189,248,0.35)]'
                    : 'border-slate-200/70 bg-white text-slate-600 hover:border-slate-300 hover:shadow-[0_18px_44px_-22px_rgba(15,23,42,0.28)]'
            } ${isDragging ? 'opacity-60' : ''} ${isOver && canDrop ? 'ring-2 ring-sky-300' : ''}`}
        >
            <FinderItemIcon item={item} size="md" />
            <span className="line-clamp-2 text-sm font-medium leading-tight">{item.name}</span>
            <div className="flex items-center gap-2 text-xs text-slate-500">
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onRename(item);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 transition hover:border-slate-300 hover:text-slate-700"
                >
                    Rename
                </button>
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onDelete(item);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-rose-500 transition hover:border-rose-300 hover:text-rose-600"
                >
                    Delete
                </button>
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onQuickLook(item);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sky-600 transition hover:border-sky-300 hover:text-sky-700"
                >
                    View
                </button>
            </div>
        </div>
    );
}

FinderGridCard.propTypes = {
    item: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
        name: PropTypes.string,
        type: PropTypes.string,
    }).isRequired,
    isSelected: PropTypes.bool,
    onSelect: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
    onQuickLook: PropTypes.func.isRequired,
};

FinderGridCard.defaultProps = {
    isSelected: false,
};

function FinderListRow({ item, isSelected, onSelect, onOpen, onRename, onDelete, onMove, onQuickLook }) {
    const [{ isDragging }, drag] = useDrag({
        type: DND_TYPE,
        item: { id: item.id, type: item.type },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const [{ isOver, canDrop }, drop] = useDrop({
        accept: DND_TYPE,
        canDrop: (dragged) => item.type === 'folder' && dragged.id !== item.id,
        drop: (dragged) => onMove(dragged.id, item.id),
        collect: (monitor) => ({
            isOver: monitor.isOver({ shallow: true }),
            canDrop: monitor.canDrop(),
        }),
    });

    const ref = useRef(null);
    drag(drop(ref));

    return (
        <tr
            ref={ref}
            onClick={() => onSelect((prev) => (prev === item.id ? null : item.id))}
            onDoubleClick={() => onOpen(item)}
            className={`cursor-pointer border-b border-slate-200/70 text-sm transition ${
                isSelected ? 'bg-sky-50 text-sky-800' : 'hover:bg-slate-50'
            } ${isDragging ? 'opacity-60' : ''} ${isOver && canDrop ? 'outline outline-2 outline-sky-300' : ''}`}
        >
            <td className="flex items-center gap-3 px-4 py-3">
                <FinderItemIcon item={item} size="sm" />
                <span className="truncate text-slate-600">{item.name}</span>
            </td>
            <td className="px-4 py-3 capitalize text-slate-500">{item.type}</td>
            <td className="px-4 py-3 text-slate-500">{item.type === 'file' ? formatSize(item.size) : '—'}</td>
            <td className="px-4 py-3 text-slate-500">{new Date(item.updatedAt).toLocaleString()}</td>
            <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2 text-xs">
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onRename(item);
                        }}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 transition hover:border-slate-300 hover:text-slate-700"
                    >
                        <HiOutlinePencilSquare />
                        Rename
                    </button>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onDelete(item);
                        }}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-rose-500 transition hover:border-rose-300 hover:text-rose-600"
                    >
                        <HiOutlineTrash />
                        Delete
                    </button>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onQuickLook(item);
                        }}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sky-600 transition hover:border-sky-300 hover:text-sky-700"
                    >
                        <HiOutlineEye />
                        View
                    </button>
                </div>
            </td>
        </tr>
    );
}

FinderListRow.propTypes = {
    item: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
        name: PropTypes.string,
        type: PropTypes.string,
        size: PropTypes.number,
        updatedAt: PropTypes.string,
    }).isRequired,
    isSelected: PropTypes.bool,
    onSelect: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
    onQuickLook: PropTypes.func.isRequired,
};

FinderListRow.defaultProps = {
    isSelected: false,
};

function FinderPreviewPane({ item, onRename, onDelete, onQuickLook }) {
    const [textPreview, setTextPreview] = useState('');
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setTextPreview('');
        if (!item || item.type !== 'file') {
            setIsLoadingPreview(false);
            return () => {
                cancelled = true;
            };
        }

        const supportsText = item.mimeType?.startsWith('text/') || ['json', 'md', 'txt', 'js', 'ts', 'css', 'html'].includes(item.extension);
        if (!supportsText || !item.previewUrl) {
            setIsLoadingPreview(false);
            return () => {
                cancelled = true;
            };
        }

        setIsLoadingPreview(true);
        fetch(item.previewUrl)
            .then((res) => res.text())
            .then((content) => {
                if (!cancelled) {
                    setTextPreview(content.slice(0, 2000));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setTextPreview('Unable to load preview.');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoadingPreview(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [item]);

    if (!item) {
        return (
            <aside className="hidden h-[32rem] w-full flex-col items-center justify-center rounded-[26px] border border-slate-200/70 bg-white/80 p-5 text-center text-sm text-slate-500 shadow-sm shadow-slate-200/70 lg:flex lg:h-[36rem] lg:w-72">
                Select a file or folder to see details.
            </aside>
        );
    }

    const isImage = item.mimeType?.startsWith('image/');

    return (
        <aside className="hidden h-[32rem] w-full flex-col gap-4 rounded-[26px] border border-slate-200/70 bg-white/85 p-5 text-sm text-slate-600 shadow-sm shadow-slate-200/70 lg:flex lg:h-[36rem] lg:w-72">
            <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-sm font-semibold text-slate-700">{item.name}</h3>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-slate-500">
                    {item.type}
                </span>
            </div>
            <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100">
                {item.type === 'file' && isImage && item.previewUrl ? (
                    <img src={item.previewUrl} alt={item.name} className="h-full w-full rounded-[18px] object-cover" />
                ) : (
                    <FinderItemIcon item={item} size="lg" />
                )}
            </div>
            <dl className="space-y-3 text-xs text-slate-500">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                    <dt className="uppercase tracking-[0.18em] text-slate-400">Modified</dt>
                    <dd className="text-slate-600">{new Date(item.updatedAt).toLocaleString()}</dd>
                </div>
            </dl>
            {item.type === 'file' && (
                <>
                    <dl className="space-y-3 text-xs text-slate-500">
                        <div className="flex justify-between">
                            <dt className="uppercase tracking-[0.18em] text-slate-400">Size</dt>
                            <dd className="text-slate-600">{formatSize(item.size)}</dd>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <dt className="uppercase tracking-[0.18em] text-slate-400">Type</dt>
                            <dd className="text-slate-600">{item.mimeType || 'Unknown'}</dd>
                        </div>
                    </dl>
                    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95">
                        <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Preview
                        </div>
                        <div className="flex-1 overflow-auto px-3 py-3 text-xs leading-relaxed text-slate-600">
                            {isImage ? (
                                <p className="text-center text-slate-400">Image preview shown above.</p>
                            ) : isLoadingPreview ? (
                                <p className="text-center text-slate-400">Loading preview…</p>
                            ) : textPreview ? (
                                <pre className="whitespace-pre-wrap break-words">{textPreview}</pre>
                            ) : (
                                <p className="text-center text-slate-400">Preview unavailable.</p>
                            )}
                        </div>
                    </div>
                </>
            )}
            <div className="mt-auto flex items-center justify-between gap-2 text-xs">
                <button
                    type="button"
                    onClick={() => onRename(item)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-2 transition hover:border-slate-300 hover:text-slate-700"
                >
                    <HiOutlinePencilSquare />
                    Rename
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-rose-500 transition hover:border-rose-300 hover:text-rose-600"
                >
                    <HiOutlineTrash />
                    Delete
                </button>
                {item.type === 'file' ? (
                    <button
                        type="button"
                        onClick={() => onQuickLook(item)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sky-600 transition hover:border-sky-300 hover:text-sky-700"
                    >
                        <HiOutlineEye />
                        Quick Look
                    </button>
                ) : null}
            </div>
        </aside>
    );
}

FinderPreviewPane.propTypes = {
    item: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
        name: PropTypes.string,
        type: PropTypes.string,
        size: PropTypes.number,
        updatedAt: PropTypes.string,
        mimeType: PropTypes.string,
        extension: PropTypes.string,
        previewUrl: PropTypes.string,
    }),
    onRename: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onQuickLook: PropTypes.func.isRequired,
};

FinderPreviewPane.defaultProps = {
    item: null,
};

const formatSize = (size) => {
    if (!size && size !== 0) return '—';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

function FinderStatusBar({ totalItems, visibleItems, totalSize, selection, filterLabel, searchTerm }) {
    const info = selection
        ? `${selection.name} · ${selection.type === 'file' ? formatSize(selection.size) : 'Folder'}`
        : `${visibleItems} item${visibleItems === 1 ? '' : 's'} shown${visibleItems !== totalItems ? ` · ${totalItems} total` : ''}`;
    const sizeInfo = selection ? new Date(selection.updatedAt).toLocaleString() : `Combined size ${formatSize(totalSize)}`;
    const isFiltering = !selection && (Boolean(searchTerm) || (filterLabel && filterLabel !== 'All'));

    return (
        <footer className="mt-4 flex flex-col gap-2 rounded-[24px] border border-slate-200/70 bg-white/85 px-6 py-3 text-xs text-slate-500 shadow-sm shadow-slate-200/70 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
                <HiOutlineEllipsisHorizontal className="text-lg text-slate-400" />
                <span className="font-medium text-slate-600">{info}</span>
                {filterLabel && filterLabel !== 'All' ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {filterLabel}
                    </span>
                ) : null}
                {searchTerm ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Search "{searchTerm}"
                    </span>
                ) : null}
            </div>
            <span className={`text-slate-400 ${isFiltering ? 'font-medium text-slate-500' : ''}`}>{sizeInfo}</span>
        </footer>
    );
}

FinderStatusBar.propTypes = {
    totalItems: PropTypes.number.isRequired,
    visibleItems: PropTypes.number.isRequired,
    totalSize: PropTypes.number.isRequired,
    selection: PropTypes.shape({
        name: PropTypes.string,
        type: PropTypes.string,
        size: PropTypes.number,
        updatedAt: PropTypes.string,
    }),
    filterLabel: PropTypes.string,
    searchTerm: PropTypes.string,
};

FinderStatusBar.defaultProps = {
    selection: null,
    filterLabel: 'All',
    searchTerm: '',
};

function QuickLookModal({ item, onClose }) {
    const dialogRef = useRef(null);
    const [previewContent, setPreviewContent] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!item || item.type !== 'file' || !item.previewUrl) {
            setPreviewContent('');
            return;
        }

        let cancelled = false;
        const supportsText = item.mimeType?.startsWith('text/') || ['json', 'md', 'txt', 'js', 'ts', 'css', 'html', 'svg'].includes(item.extension);
        const supportsImage = item.mimeType?.startsWith('image/');

        if (!supportsText || supportsImage) {
            setPreviewContent('');
            return;
        }

        setLoading(true);
        fetch(item.previewUrl)
            .then((res) => res.text())
            .then((content) => {
                if (!cancelled) {
                    setPreviewContent(content.slice(0, 5000));
                }
            })
            .catch(() => {
                if (!cancelled) setPreviewContent('');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [item]);

    useEffect(() => {
        if (!item) return undefined;
        const handleKey = (event) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [item, onClose]);

    if (!item) return null;

    const isImage = item.mimeType?.startsWith('image/');

    return (
        <div
            ref={dialogRef}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 px-4 py-8 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`${item.name} quick look`}
            onClick={onClose}
        >
            <div
                className="relative flex max-h-full w-full max-w-3xl flex-col gap-5 rounded-[30px] border border-slate-200/70 bg-white/95 p-6 shadow-[0_48px_120px_-40px_rgba(15,23,42,0.6)]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-700">{item.name}</h2>
                        <p className="text-xs text-slate-400">
                            {item.mimeType || 'Unknown'} · {formatSize(item.size)} · {new Date(item.updatedAt).toLocaleString()}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
                <div className="flex flex-1 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                    {isImage && item.previewUrl ? (
                        <img src={item.previewUrl} alt={item.name} className="max-h-full max-w-full rounded-2xl object-contain" />
                    ) : loading ? (
                        <p className="text-sm text-slate-500">Loading preview…</p>
                    ) : previewContent ? (
                        <div className="flex max-h-[26rem] w-full flex-col gap-4 overflow-hidden">
                            <div className="flex items-center gap-3">
                                <FinderItemIcon item={item} size="sm" />
                                <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Quick Look</span>
                            </div>
                            <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-600 shadow-inner shadow-white/70">
                                {previewContent}
                            </pre>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-sm text-slate-500">
                            <FinderItemIcon item={item} size="md" />
                            <p>Quick Look preview unavailable for this file type.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

QuickLookModal.propTypes = {
    item: PropTypes.shape({
        name: PropTypes.string,
        mimeType: PropTypes.string,
        size: PropTypes.number,
        updatedAt: PropTypes.string,
        previewUrl: PropTypes.string,
        type: PropTypes.string,
    }),
    onClose: PropTypes.func.isRequired,
};

QuickLookModal.defaultProps = {
    item: null,
};
