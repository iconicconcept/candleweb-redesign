"use client";
import { formatDistanceToNow, format, addMonths, addYears } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
/**
 * Converts a date string to the format "March 22, 2023".
 * @param {string} dateString - The input date string in the format "2023-08-04T20:48:50.531465+01:00".
 * @returns {string} The formatted date in the format "March 22, 2023".
 */
export const formatDate = (
  dateString: string | Date,
  withTime = false
): string => {
  // Convert the input date string to a Date object if it's not already
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;

  // Define options for formatting the date
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: withTime ? "numeric" : undefined,
    minute: withTime ? "numeric" : undefined,
    hour12: true,
  };

  // Format the date and return the formatted string
  return date.toLocaleDateString(undefined, options);
};

/**
 * Formats a given date into the format "Sunday, 1 Jan 2024".
 * @param date The date to be formatted.
 * @returns A string representing the formatted date.
 */
export const formatDateTime = (date: Date): string => {
  console.log("date");
  console.log(date);
  // Define options for formatting the date
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long", // Full name of the day of the week (e.g., Sunday)
    day: "numeric", // Numeric day of the month (e.g., 1)
    month: "short", // Abbreviated name of the month (e.g., Jan)
    year: "numeric", // Full numeric representation of the year (e.g., 2024)
  };

  // Format the date using Intl.DateTimeFormat
  return new Intl.DateTimeFormat("en-US", options).format(date);
};

export const formatBlogTime = (dateString?: string): string => {
  if (!dateString) {
    return "";
  }
  // Parse the date string into a Date object
  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    // throw new Error(`Invalid date string: ${dateString}`);
    return "";
  }

  // Define options for formatting the date
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long", // Full name of the day of the week (e.g., Sunday)
    day: "numeric", // Numeric day of the month (e.g., 1)
    month: "short", // Abbreviated name of the month (e.g., Jan)
    year: "numeric", // Full numeric representation of the year (e.g., 2024)
  };

  // Format the date using Intl.DateTimeFormat
  return new Intl.DateTimeFormat("en-US", options).format(date);
};

/**
 * Calculates the time ago from the given date in a human-readable format using 'date-fns' library.
 *
 * @param dateString - A date string in the format 'YYYY-MM-DDTHH:mm:ss.ssssss+hh:mm'.
 * @returns A string indicating the time difference between the given date and the current date, in a human-readable format.
 * For example: "in 9 hours", "2 days ago", etc.
 */
export const getTimeAgo = (dateString: Date | string): string => {
  const date = new Date(dateString);
  return formatDistanceToNow(date, { addSuffix: true });
};

/**
 * Gets the current date and time and returns it in the format "dd MMM. yyyy, hh:mm a".
 *
 * @returns A string representing the current date and time in the format "dd MMM. yyyy, hh:mm a".
 * For example: "01 Oct. 2022, 09:41 PM".
 */
export const getCurrentFormattedDate = (): string => {
  const currentDate = new Date();
  return format(currentDate, "dd MMM. yyyy, hh:mm a");
};

/**
 * Converts a date string or Date object to a formatted string including the date and time.
 * The time is represented in the format 'hh:mm a'.
 *
 * @param {string | Date} dateString - The input date as a string or Date object.
 * @returns {string} - Formatted date and time string in the format 'YYYY-MM-DD hh:mm AM/PM'.
 */
export const convertDate = (dateString: string | Date): string => {
  // Convert the input to a Date object
  const inputDate = new Date(dateString);

  // Extract year, month, and day components
  const year = inputDate.getFullYear();
  const month = String(inputDate.getMonth() + 1).padStart(2, "0");
  const day = String(inputDate.getDate()).padStart(2, "0");

  // Extract hours and minutes components
  let hours = inputDate.getHours();
  const minutes = String(inputDate.getMinutes()).padStart(2, "0");

  // Determine AM or PM
  const amOrPm = hours >= 12 ? "PM" : "AM";

  // Convert hours to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  // Construct and return the formatted date and time string
  return `${year}-${month}-${day} ${hours}:${minutes} ${amOrPm}`;
};

/**
 * Checks if an expiry date has been reached or passed compared to the current date.
 *
 * @param expiryDate - The expiry date in ISO format (e.g., "2024-06-09T19:30:15.123456+01:00").
 * @returns `true` if the expiry date has been reached or passed, `false` otherwise.
 */
export const hasExpired = (expiryDate: string | Date): boolean => {
  const currentDateTime = new Date();
  const expiryDateTime = new Date(expiryDate);

  // Compare the current date and time with the expiry date and time
  return currentDateTime >= expiryDateTime;
};

/**
 * Calculates the number of days between a given date and the current date.
 *
 * @param date - A date string in the format "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss.ssssss+HH:mm".
 * @returns The number of days between the given date and the current date.
 */
export const calculateDays = (date: string) => {
  // Get the current date and time
  const currentDate = new Date();

  // Convert the provided date string to a Date object
  const givenDate = new Date(date);

  // Calculate the time difference in milliseconds between the current date and the provided date
  const diffTime = Math.abs(currentDate.getTime() - givenDate.getTime());

  // Calculate the number of days by dividing the time difference by the number of milliseconds in a day
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Return the calculated number of days
  return diffDays;
};

/**
 * Adds a specified duration to the current date and time to create an expiration date.
 * @param isMonthly - If true, adds a month; if false, adds a year.
 * @returns The formatted expiration date string in the format "YYYY-MM-DDTHH:mm:ss.sssZZ:ZZ".
 */
export function addExpirationDate(isMonthly: boolean): string {
  // Create a new Date object representing the current date and time
  const currentDate = new Date();

  let newDate;

  // Depending on whether isMonthly is true or false, add a month or a year to the current date
  if (isMonthly) {
    newDate = addMonths(currentDate, 1);
  } else {
    newDate = addYears(currentDate, 1);
  }

  const zonedDate = utcToZonedTime(newDate, "Etc/UTC");

  // Format the new date back into the required string format
  const newDateStr = format(zonedDate, "yyyy-MM-dd HH:mm:ss.SSS'000+0000'");

  return newDateStr;
}

/**
 * Converts a given time in 24-hour format to 12-hour format with AM or PM suffix.
 *
 * @param {string} time - The time to be converted in the format "HH:mm" or "HH:mm:ss".
 * @returns {string} The time in 12-hour format with AM or PM suffix.
 */
export function convertTo12HrFormat(time: string | Date): string {
  // Create a new Date object with the given time string
  const date = new Date(time);

  // Get the hours and minutes from the date object
  let hours = date.getHours();
  const minutes = date.getMinutes();

  // Determine whether it's AM or PM based on the hours
  const suffix = hours >= 12 ? "PM" : "AM";

  // Convert hours to 12-hour format
  hours = hours % 12; // Convert hours greater than 12 to their 12-hour equivalent
  hours = hours ? hours : 12; // If hours is 0 (midnight), display it as 12

  // Return the formatted time string in 12-hour format with the suffix
  return `${hours}:${minutes} ${suffix}`;
}

/**
 * Checks if the difference between two dates is at least one month, indicating a monthly interval.
 *
 * @param created_at - The starting date.
 * @param expiry_date - The ending date.
 * @returns `true` if the difference between the dates is at least one month, `false` otherwise.
 */
export const isMonthly = (created_at: string, expiry_date: string): boolean => {
  // Convert the input date strings into Date objects
  const startDate = new Date(created_at);
  const endDate = new Date(expiry_date);

  // Calculate the absolute time difference in milliseconds between the two dates
  const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());

  // Calculate the approximate number of months in the time difference
  // Note: 30.44 is the average number of days in a month to account for varying month lengths
  const diffMonths = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 30.44));

  // Return `true` if the calculated difference in months is at least 1, indicating a monthly interval
  return diffMonths >= 1;
};
