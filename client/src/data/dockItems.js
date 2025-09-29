import homeIcon from '../assets/dock/home.svg';
import tutorialsIcon from '../assets/dock/tutorials.svg';
import quizzesIcon from '../assets/dock/quizzes.svg';
import toolsIcon from '../assets/dock/tools.svg';
import problemsIcon from '../assets/dock/problems.svg';
import visualizerIcon from '../assets/dock/visualizer.svg';
import dashboardIcon from '../assets/dock/dashboard.svg';
import quickAddIcon from '../assets/dock/quick-add.svg';
import themeIcon from '../assets/dock/theme.svg';

export const baseDockItems = [
    {
        key: 'home',
        to: '/',
        label: 'Home',
        iconSrc: homeIcon,
        iconAlt: 'Home dock icon',
        match: (path) => path === '/',
    },
    {
        key: 'tutorials',
        to: '/tutorials',
        label: 'Tutorials',
        iconSrc: tutorialsIcon,
        iconAlt: 'Tutorials dock icon',
        match: (path) => path.startsWith('/tutorials'),
    },
    {
        key: 'quizzes',
        to: '/quizzes',
        label: 'Quizzes',
        iconSrc: quizzesIcon,
        iconAlt: 'Quizzes dock icon',
        match: (path) => path.startsWith('/quizzes'),
    },
    {
        key: 'tools',
        to: '/tools',
        label: 'Tools',
        iconSrc: toolsIcon,
        iconAlt: 'Tools dock icon',
        match: (path) => path.startsWith('/tools'),
    },
    {
        key: 'problems',
        to: '/problems',
        label: 'Problems',
        iconSrc: problemsIcon,
        iconAlt: 'Problems dock icon',
        match: (path) => path.startsWith('/problems'),
    },
    {
        key: 'visualizer',
        to: '/visualizer',
        label: 'Code Visualizer',
        iconSrc: visualizerIcon,
        iconAlt: 'Visualizer dock icon',
        match: (path) => path.startsWith('/visualizer'),
    },
];

export const dashboardDockItem = {
    key: 'dashboard',
    to: '/dashboard',
    label: 'Dashboard',
    iconSrc: dashboardIcon,
    iconAlt: 'Dashboard dock icon',
    match: (path) => path.startsWith('/dashboard'),
    requiresAuth: true,
};

export const quickAddDockItem = {
    key: 'quick-add',
    type: 'quick-add',
    label: 'Quick Add',
    iconSrc: quickAddIcon,
    iconAlt: 'Open quick add shortcuts',
};

export const themeDockItem = {
    key: 'theme',
    type: 'theme',
    label: 'Theme',
    iconSrc: themeIcon,
    iconAlt: 'Toggle theme',
};

export const baseDockSequence = [...baseDockItems, quickAddDockItem, themeDockItem];

export const dockSequenceWithDashboard = [
    ...baseDockItems,
    dashboardDockItem,
    quickAddDockItem,
    themeDockItem,
];
