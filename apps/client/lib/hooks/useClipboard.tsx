import { useState } from 'react';

const useCopyToClipboard = () => {


    const copyToClipboard = async (content: string) => {
        try {
            await navigator.clipboard.writeText(content);
            // setIsCopied(true);
            // setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
            return true;
        } catch (error) {
            // setIsCopied(false);
            return false;
        }
    };

    return { copyToClipboard };
};

export default useCopyToClipboard;
