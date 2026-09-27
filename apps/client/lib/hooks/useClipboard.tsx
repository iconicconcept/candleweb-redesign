/**
 * Copy text to the clipboard. Tries the async Clipboard API first, then falls
 * back to a hidden textarea + execCommand("copy") — the API is missing on
 * non-HTTPS origins (e.g. testing over a LAN IP) and can reject when the
 * document isn't focused. Resolves true only if the text was actually copied.
 */
export const writeClipboard = async (content: string): Promise<boolean> => {
    if (!content) return false;
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(content);
            return true;
        }
    } catch {
        // fall through to the legacy path
    }
    try {
        const ta = document.createElement("textarea");
        ta.value = content;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "0";
        ta.style.left = "0";
        ta.style.opacity = "0";
        ta.style.pointerEvents = "none";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, content.length);
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
    } catch {
        return false;
    }
};

const useCopyToClipboard = () => {
    const copyToClipboard = writeClipboard;
    return { copyToClipboard };
};

export default useCopyToClipboard;
