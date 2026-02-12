import { success, error } from "../components/alert/Toast";

/**
 * Copy the given text to the clipboard.
 * @param text - The text to be copied to the clipboard.
 */
export const copyToClipboard = async (text: string) => {
  try {
    // Check if the Clipboard API with writeText is supported by the browser
    if (navigator.clipboard && navigator.clipboard.writeText) {
      // Check clipboard write permissions
      const permissionResult = await navigator.permissions.query({
        name: "clipboard-write" as PermissionName,
      });
      if (
        permissionResult.state === "granted" ||
        permissionResult.state === "prompt"
      ) {
        // Use the Clipboard API to write text to the clipboard
        await navigator.clipboard.writeText(text);
        success("Copied to clipboard");
      } else {
        error("Clipboard write permission not available");
      }
    } else {
      // Fallback to older method for browsers without Clipboard API support
      const input = document.createElement("input");
      input.value = text;

      // Append the input element to the DOM
      document.body.appendChild(input);

      // Select the input's content
      input.select();

      // Execute the copy command
      document.execCommand("copy");

      // Clean up by removing the temporary input element
      document.body.removeChild(input);

      success("Copied to clipboard");
    }
  } catch (err: any) {
    error("Error copying text to clipboard:", err);
  }
};
