/** Function that joins different style classes */

export const joinClasses = (...classes: (string | false | undefined)[]) =>
  classes
    .filter((c) => !!c)
    .join(" ")
    .replace(/ +/g, " ");
