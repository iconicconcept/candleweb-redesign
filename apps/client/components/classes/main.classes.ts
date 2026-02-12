export interface IMainClasses {
  h1: string;
  h2: string;
  h3: string;
  sub: string;
  body: string;
  sm: string;
  pre: string;
  btn: string;
  link: string;
}

export default <IMainClasses>{
  h1: "roboto text-[80px] font-bold -tracking-[2%]",
  h2: "roboto text-[50px] font-bold -tracking-[2%]",
  h3: "roboto text-[24px] font-bold -tracking-[2%]",
  sub: "roboto font-medium text-[18px]",
  body: "roboto font-medium text-[16px] leading-[140%]",
  sm: "roboto text-[14px] font-medium",
  pre: "",
  btn: "roboto text-[10px] tracking-[3%]",
  link: "roboto font-bold text-[16px] underline",
};
