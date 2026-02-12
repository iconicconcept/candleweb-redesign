/**
 * Masks a wallet address by replacing most of its characters with asterisks.
 *
 * @param {string} walletAddress - The wallet address to be masked.
 * @returns {string} The masked wallet address with most characters replaced by asterisks.
 * @throws {Error} If the provided wallet address is invalid or too short (less than 10 characters).
 */
export function maskWalletAddress(walletAddress: string): string {
  // Check if the wallet address is provided and has at least 10 characters.
  if (!walletAddress || walletAddress.length < 10) {
    return "";
  }

  // Define the length of characters to show at the beginning and end of the address.
  const maskLength = 5;

  // Extract the first 5 characters (prefix) and last 5 characters (suffix) of the wallet address.
  const prefix = walletAddress.slice(0, maskLength);
  const suffix = walletAddress.slice(-maskLength);

  // Combine the prefix, asterisks, and suffix to create the masked wallet address.
  return `${prefix}*****${suffix}`;
}


/**
 * Masks a string by replacing characters after the first 5 characters with asterisks.
 * If the input string is 5 characters or shorter, it remains unchanged.
 * 
 * @param str - The input string to be masked.
 * @returns The masked string with characters replaced by asterisks if necessary.
 */
export function maskString(str: string): string {
  // Check if the length of the input string is greater than 5 characters
  if (str.length > 5) {
    // If so, replace characters after the first 5 characters with asterisks
    return str.substring(0, 5) + '*****';
  } else {
    // If the input string is 5 characters or shorter, return it unchanged
    return str;
  }
}
