/**
 * Extracts the first and last letter of a given username and returns them as a string.
 *
 * @param {string} username - The input username from which to extract the first and last letters.
 * @returns {string} A string containing the first and last letters of the username.
 */
export const getFirstAndLastLetter = (username: string): string => {
  // Get the first letter of the username using charAt(0).
  const firstName = username.charAt(0);

  // Get the last letter of the username using charAt(username.length - 1).
  const lastName = username.charAt(username.length - 1);

  // Combine the first and last letters and return them as a single string.
  return firstName + lastName;
};

const colors: string[] = [
  "#1ea895",
  "#1cb08d",
  "#1aad8c",
  "#1ba688",
  "#18a17f",
];

/**
 * Generates a random color from a list of declared colors.
 *
 * @returns {string} A random color string from the list of colors.
 */
export const getRandomColor = (): string => {
  // Calculate a random index within the bounds of the colors array length.
  const randomIndex = Math.floor(Math.random() * colors.length);

  // Return the color at the randomly generated index.
  return colors[randomIndex];
};

export const imageUri = "https://res.cloudinary.com/dguemmmfk/";
