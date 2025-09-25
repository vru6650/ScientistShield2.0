export interface Post {
    _id: string;
    title: string;
    content: string;
    category: string;
    slug: string;
    createdAt: string;
    image?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    claps?: number;
    clappedBy?: string[];
    bookmarkedBy?: string[];
    author?: {
        name?: string;
        profilePicture?: string;
    };
}

export interface TutorialChapter {
    _id: string;
    chapterTitle: string;
    chapterSlug: string;
    content: string;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface Tutorial {
    _id: string;
    title: string;
    slug: string;
    description: string;
    thumbnail?: string;
    category: string;
    authorId: string;
    chapters: TutorialChapter[]; // Array of embedded chapters
    createdAt: string;
    updatedAt: string;
}

export interface PageSectionItem {
    title?: string;
    body?: string;
    icon?: string;
}

export interface PageSection {
    _id?: string;
    type: 'hero' | 'rich-text' | 'feature-grid' | 'cta' | 'custom';
    title?: string;
    subtitle?: string;
    body?: string;
    alignment?: 'left' | 'center' | 'right';
    background?: string;
    media?: {
        url?: string;
        alt?: string;
    };
    cta?: {
        label?: string;
        url?: string;
    };
    items?: PageSectionItem[];
    order?: number;
}

export interface PageContent {
    _id: string;
    title: string;
    slug: string;
    description?: string;
    status: 'draft' | 'published';
    sections: PageSection[];
    createdAt: string;
    updatedAt: string;
}