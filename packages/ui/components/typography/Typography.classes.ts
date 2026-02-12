import { ITypographyClasses } from "./Typography";

export default <ITypographyClasses>{
  base: "m-0 whitespace-normal",
  alignment: {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  },
  color: {
    black: "text-black",
    red: "text-red-500",
    blue: "text-blue-500",
    gray: "text-[rgba(188,188,188,1)]",
    white: "text-white",
  },
  textsize: {
    xs: "text-xs",
    sm: "text-[1rem] leading-6",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
  },
};
