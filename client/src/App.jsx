import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import { Spinner } from 'flowbite-react';
import 'highlight.js/styles/atom-one-dark.css';

import MainLayout from './components/MainLayout';
import { authRoutes, buildRouteElements, mainLayoutRoutes } from './routes/mainLayoutRoutes.jsx';

// A fallback component to show while pages are loading
const LoadingFallback = () => (
    <div className="flex justify-center items-center min-h-screen">
        <Spinner size="xl" />
    </div>
);

export default function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
                <Routes>
                    <Route path="/" element={<MainLayout />}>
                        {buildRouteElements(mainLayoutRoutes)}
                    </Route>

                    {authRoutes.map((route) => (
                        <Route key={route.path} path={route.path} element={route.element} />
                    ))}
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}
