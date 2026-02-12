import { useState, useEffect } from "react";

/**
 * A custom hook to handle storing and retrieving data from localStorage.
 * @param key - The key to use for storing and retrieving the data in localStorage.
 * @param fallbackValue - The initial value to use if the key is not found in localStorage.
 * @returns A tuple containing the current value and a function to set the value.
 */
export function useLocalStorage<T>(key: string, fallbackValue: T) {
  // State to hold the current value retrieved from localStorage
  const [value, setValue] = useState<typeof fallbackValue>(fallbackValue);

  // On component mount, retrieve the value from localStorage if it exists
  useEffect(() => {
    const stored = localStorage.getItem(key);
    setValue(stored ? JSON.parse(stored) : fallbackValue);
  }, []);

  // When the "key" or "value" changes, update the value in localStorage
  useEffect(() => {
    if (JSON.stringify(value).length > 5) {
      localStorage.setItem(key, JSON.stringify(value));
    }

    // Return a cleanup function to remove the item from localStorage when the component unmounts
    // return () => localStorage.removeItem(key);
  }, [key, value]);

  // Return a tuple containing the current value and the function to set the value
  return [value, setValue] as const;
}
