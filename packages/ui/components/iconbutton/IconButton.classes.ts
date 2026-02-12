import { IButtonClasses } from "../button/Button";

export default <IButtonClasses>{
  base: "flex justify-center items-center space-x-[10px] py-2 px-4 whitespace-nowrap border rounded-md shadow-sm text-sm font-[500] focus:outline-none focus:ring-2 focus:ring-offset-1 select-none cursor-pointer motion-safe:transition-colors disabled:cursor-not-allowed disabled:!shadow-none",
  width: "w-full",
  size: {
    xs: "py-2 px-4 text-sm",
    sm: "py-2 px-6 text-base",
    md: "py-3 px-8 text-base",
    lg: "py-3 px-10 text-lg",
    xl: "py-3 px-12 text-xl",
    "2xl": "py-[20px] px-[40px] text-2xl",
  },
  variant: {
    primary:
      "bg-primary text-dark hover:bg-semBlue600 disabled:bg-[rgba(235,_235,_242,_1)] text-white disabled:text-[rgba(142,_138,_181,_1)] border-transparent focus:ring-[#F8EEE8]",
    secondary: "bg-secondary text-dark disabled:bg-gray-100",
    transparent:
      "bg-transparent text-white border-[1px] hover:bg-white disabled:bg-gray-100",
  },
};
