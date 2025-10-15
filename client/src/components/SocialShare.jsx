import React from 'react';
import {
    FacebookShareButton,
    TwitterShareButton,
    LinkedinShareButton,
    WhatsappShareButton,
    FacebookIcon,
    TwitterIcon,
    LinkedinIcon,
    WhatsappIcon,
} from 'react-share';

const SocialShare = ({ post }) => {
    // The URL of the current page to be shared.
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const title = post.title;

    return (
        <div className="flex flex-col items-center justify-center my-6 py-4 border-t border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-3">Share this post</h3>
            <div className="flex gap-4">
                <TwitterShareButton url={shareUrl} title={title}>
                    <TwitterIcon size={38} round />
                </TwitterShareButton>

                <FacebookShareButton url={shareUrl} quote={title}>
                    <FacebookIcon size={38} round />
                </FacebookShareButton>

                <LinkedinShareButton url={shareUrl} title={title}>
                    <LinkedinIcon size={38} round />
                </LinkedinShareButton>

                <WhatsappShareButton url={shareUrl} title={title} separator=":: ">
                    <WhatsappIcon size={38} round />
                </WhatsappShareButton>
            </div>
        </div>
    );
};

export default SocialShare;