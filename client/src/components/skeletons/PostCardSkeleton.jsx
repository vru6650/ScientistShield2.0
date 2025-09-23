export default function PostCardSkeleton() {
    return (
        <div className='w-full border dark:border-slate-700 border-gray-200 h-[460px] overflow-hidden rounded-xl sm:w-[380px] mx-auto shadow-lg relative animate-fade-in'>
            {/* Media part - Mimics the slight shadow/lift of the actual image */}
            <div className='h-[220px] w-full bg-gray-200 dark:bg-slate-700 animate-pulse-slow rounded-t-xl overflow-hidden relative'>
                {/* Subtle gradient overlay to mimic media depth */}
                <div className='absolute inset-0 bg-gradient-to-t from-black/5 to-transparent'></div>
            </div>

            {/* Buttons Skeleton (Mimicking the actual PostCard's interactive elements) */}
            <div className='absolute top-3 right-3 z-20 flex items-center gap-3 bg-gray-100/70 dark:bg-slate-600/50 backdrop-blur-sm p-2 rounded-full shadow-md'>
                {/* Bookmark Button Placeholder */}
                <div className='h-5 w-5 rounded-full bg-gray-300 dark:bg-slate-500 animate-pulse-slow'></div>
                {/* Like Button Placeholder with Count */}
                <div className='flex items-center gap-1 border-l border-gray-300 dark:border-slate-500 pl-2'>
                    <div className='h-5 w-5 rounded-full bg-gray-300 dark:bg-slate-500 animate-pulse-slow'></div>
                    <div className='h-4 w-6 bg-gray-300 dark:bg-slate-500 animate-pulse-slow rounded'></div>
                </div>
                {/* Share Button Placeholder */}
                <div className='flex items-center gap-1 border-l border-gray-300 dark:border-slate-500 pl-2'>
                    <div className='h-5 w-5 rounded-full bg-gray-300 dark:bg-slate-500 animate-pulse-slow'></div>
                </div>
            </div>

            {/* Content part - Enhanced placeholders */}
            <div className='p-4 flex flex-col gap-2 bg-white dark:bg-slate-800 flex-grow h-[240px]'>
                {/* Category & Reading Time */}
                <div className='flex justify-between items-center text-xs'>
                    <div className='h-5 w-20 bg-teal-100/50 dark:bg-teal-900/50 animate-pulse-slow rounded-full shadow-sm'></div> {/* Softer teal for category */}
                    <div className='h-4 w-24 bg-gray-200 dark:bg-slate-700 animate-pulse-slow rounded'></div>
                </div>

                {/* Title */}
                <div className='h-6 w-11/12 bg-gray-200 dark:bg-slate-700 animate-pulse-slow rounded mt-2'></div>
                <div className='h-6 w-10/12 bg-gray-200 dark:bg-slate-700 animate-pulse-slow rounded'></div>

                {/* Author Section */}
                <div className='flex items-center gap-2 mt-2'>
                    <div className='w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse-slow border-2 border-teal-200 dark:border-teal-700'></div> {/* Mimics actual avatar border */}
                    <div className='h-4 w-28 bg-gray-200 dark:bg-slate-700 animate-pulse-slow rounded'></div>
                </div>

                {/* Spacer to push CTA to bottom */}
                <div className='flex-grow'></div>

                {/* Read Article Button */}
                <div className='mt-auto h-11 w-full bg-teal-500/30 dark:bg-teal-700/30 animate-pulse-slow rounded-lg'></div> {/* Softer teal for CTA */}
            </div>
        </div>
    );
}