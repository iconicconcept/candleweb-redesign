/**
 * Generates a random light color in hexadecimal format.
 * The generated color will have at least one component with a higher value,
 * making it brighter and not too dark.
 *
 * @returns {string} A randomly generated light color in the format "#RRGGBB".
 */
export function generateRandomLightColor(): string {
  const letters = "0123456789ABCDEF";
  let color = "#";

  // Generate a color with a higher value for at least one RGB component
  let baseComponent = Math.floor(Math.random() * 3); // Select R, G, or B

  for (let i = 0; i < 6; i++) {
    if (i === baseComponent * 2 || i === baseComponent * 2 + 1) {
      // Generate a higher value for the selected component
      color += letters[Math.floor(Math.random() * 4) + 12]; // Use letters A to F
    } else {
      color += letters[Math.floor(Math.random() * 9)]; // Use letters 0 to 8
    }
  }

  return color;
}

export function splitByThirds(text: string): {
  firstThird: string;
  lastThird: string;
} {
  // Split the text into words
  const words = text.trim().split(/\s+/);

  // Handle empty or single word cases
  if (words.length <= 1) {
    return { firstThird: text, lastThird: "" };
  }

  // Calculate the number of words in each third
  const totalThirds = Math.ceil(words.length / 3);
  const firstThirdWords = words.slice(0, totalThirds);
  const lastThirdWords = words.slice(words.length - totalThirds);

  // Calculate the middle words
  const middleWords = words.slice(totalThirds, words.length - totalThirds);

  // Join the words back into strings
  const missingWords = middleWords.join(" ");
  const firstThird = firstThirdWords.join(" ") + " " + missingWords + " ";
  const lastThird = lastThirdWords.join(" ");

  return { firstThird, lastThird };
}
