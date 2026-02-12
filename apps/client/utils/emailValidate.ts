export function validateEmailAddress(email: string): boolean {
  const emailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Masks most characters of the username in an email address, leaving only the last three characters visible.
 * @param email - The email address to be masked.
 * @returns The masked email address.
 */
export function maskEmailUsername(email: string): string {
  const atIndex = email ? email.indexOf("@") : -1;

  if (atIndex === -1) {
    return "";
  }

  const username = email.slice(0, atIndex);
  const visibleUsername = username.slice(-3).padStart(username.length, "*");

  return visibleUsername + email.slice(atIndex);
}
