// client/types.ts (or client/src/types.ts)
export interface Post {
    _id: string;
    title: string;
    content: string;
    category: string;
    slug: string;
    createdAt: string;
    image?: string; // Optional property
    mediaUrl?: string; // Optional property
    mediaType?: 'image' | 'video'; // Optional and specific property
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
    contentType?: 'text' | 'code-interactive' | 'quiz'; // NEW
    initialCode?: string; // NEW
    expectedOutput?: string; // NEW
    quizId?: string; // NEW
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

// NEW: Quiz related types
export interface QuizOption {
    text: string;
    isCorrect: boolean;
}

export interface QuizQuestion {
    _id: string;
    questionText: string;
    questionType: 'mcq' | 'fill-in-the-blank' | 'code-output';
    options?: QuizOption[]; // For MCQ
    correctAnswer?: string; // For fill-in-the-blank or code-output
    codeSnippet?: string; // For code-output
    explanation?: string;
}

export interface Quiz {
    _id: string;
    title: string;
    slug: string;
    description?: string;
    category?: string;
    questions: QuizQuestion[];
    createdBy: string; // User ID
    relatedTutorials?: { _id: string; title: string; slug: string }[];
    createdAt: string;
    updatedAt: string;
}

// NEW: Quiz Submission result types
export interface QuestionResult {
    questionId: string;
    questionText: string;
    userAnswer: any;
    correctAnswer: any;
    isCorrect: boolean;
    explanation?: string;
    feedback?: string;
}

export interface QuizSubmissionResult {
    score: number;
    totalQuestions: number;
    results: QuestionResult[];
    message: string;
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