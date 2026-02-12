import * as React from "react";

export type ButtonAlignment = "left" | "right" | "center";
export type ButtonWeight = "solid" | "shaded" | "outlined" | "ghost" | "inline";
export type ButtonType = "button" | "reset" | "submit";
export type ButtonShape = "pill" | "brick";
export type ButtonSize = "small" | "medium" | "large" | "relative";
export interface ISpinnerIconClasses {
  size: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
  };
  animation: {
    spin: string;
  };
}
export interface IconProps extends React.SVGAttributes<SVGElement> {
  children?: never;
  color?: string;
  height?: string;
  width?: string;
  className?: string;
}

export interface IPricing {
  tierOne: string;
  tierTwo: string;
  tierThree: string;
}
export interface ISignupFormInput {
  firstName: string;
  lastName: string;
  email: string;
  businessName: string;
  password: string;
}
export interface ILoginFormInput {
  email: string;
  password: string;
}
export interface IFundWalletModalInput {
  amount: string;
  name: string;
  email: string;
  remark: string;
}
