// src/components/ClapButton.jsx
import { useState, useEffect } from 'react';
import { Button } from 'flowbite-react';
import { HiOutlineHandThumbUp } from 'react-icons/hi2';
import { useSelector } from 'react-redux';

export default function ClapButton({ post }) {
    const { currentUser } = useSelector((state) => state.user);
    const [claps, setClaps] = useState(post.claps || 0);
    const [isClapped, setIsClapped] = useState(false);

    // Check if the user has already clapped this post on component mount
    useEffect(() => {
        if (currentUser && post.clappedBy && post.clappedBy.includes(currentUser._id)) {
            setIsClapped(true);
        }
    }, [currentUser, post.clappedBy]);


    const handleClap = async () => {
        if (!currentUser) {
            // Or trigger a modal to prompt login
            alert('You must be logged in to clap!');
            return;
        }
        try {
            const res = await fetch(`/api/post/clap/${post._id}`, {
                method: 'PUT',
            });
            if (res.ok) {
                const data = await res.json();
                setClaps(data.claps);
                setIsClapped(data.clappedBy.includes(currentUser._id));
            }
        } catch (error) {
            console.error('Failed to clap:', error);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                outline
                gradientDuoTone='purpleToBlue'
                onClick={handleClap}
                className={`transition-all duration-200 ${isClapped ? 'ring-2 ring-cyan-500' : ''}`}
            >
                <HiOutlineHandThumbUp className={`h-6 w-6 ${isClapped ? 'text-cyan-500' : ''}`} />
            </Button>
            <span className='text-gray-500 dark:text-gray-400'>{claps} claps</span>
        </div>
    );
}