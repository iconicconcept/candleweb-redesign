import { IButtonClasses } from "./Button";

export default <IButtonClasses>{
  base: "!transition !duration-300 !ease-in-out flex justify-center items-center py-2 whitespace-nowrap rounded-full outline-none shadow-sm text-sm font-[500] select-none cursor-pointer motion-safe:transition-colors disabled:cursor-not-allowed disabled:!shadow-none relative",
  gbase:
    "!transition !duration-300 !ease-in-out flex justify-center items-center py-2 whitespace-nowrap rounded-full outline-none shadow-sm text-sm font-[500] select-none cursor-pointer motion-safe:transition-colors disabled:cursor-not-allowed disabled:!shadow-none relative",
  width: "w-web",
  size: {
    xs: "py-2 px-4 text-sm",
    sm: "py-2 px-6 text-base",
    md: "py-2 px-8 text-base",
    lg: "py-3 px-10 text-lg",
    xl: "py-3 px-12 text-xl",
    "2xl": "py-[20px] px-[40px] text-2xl",
  },
  icon: "mr-2 text-[1.2rem]",
  iconRight: "ml-2 text-[1.2rem]",
  variant: {
    primary:
      "primary_btn bg-primary text-dark hover:bg-txt-primary disabled:bg-[#4F545C] disabled:text-dark",
    secondary:
      "bg-secondary text-dark hover:bg-secondary50 disabled:bg-gray-100 hover:scale-[0.98]",
    gradient:
      "bg-gradient-to-r from-primary to-secondary text-dark hover:bg-gradient-to-r hover:from-primary50 hover:to-secondary50 disabled:!bg-gray-500 hover:scale-[0.98] disabled:hover:scale-100 disabled:hover:!bg-gray-500 py-3",
    transparent:
      "bg-transparent text-white disabled:bg-gray-100 hover:scale-[0.98] hover:text-primary",
    border:
      "bg-transparent border border-solid text-white disabled:bg-gray-100 hover:scale-[0.98]",
  },
};
