// client/src/components/BlurryBlobs.jsx

import React from 'react';

const BlurryBlobs = () => {
    return (
        <div className="absolute inset-0 overflow-hidden z-0">
            {/* Blurry Blob 1 */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>

            {/* Blurry Blob 2 */}
            <div className="absolute top-1/2 left-3/4 w-96 h-96 bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

            {/* Blurry Blob 3 */}
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
    );
};

export default BlurryBlobs;