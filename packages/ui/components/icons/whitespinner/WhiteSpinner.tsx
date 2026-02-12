import React from "react";
import { joinClasses } from "../../../utils/join-classes";
import { ILoaderClasses } from "../../feedback/loader";
import classes from "../bluespinner/BlueSpinner.classes";

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

export interface ISpinnerIconProps extends React.SVGProps<SVGSVGElement> {
  size?: keyof ILoaderClasses["size"];
}

const WhiteSpinner = (props: ISpinnerIconProps) => {
  return (
    <svg
      width="19"
      height="18"
      viewBox="0 0 19 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={joinClasses(
        classes.size[props.size ?? "sm"],
        classes.animation["spin"]
      )}
    >
      <g clipPath="url(#clip0_621_37858)">
        <mask
          id="mask0_621_37858"
          mask-type="alpha"
          maskUnits="userSpaceOnUse"
          x="-1"
          y="-1"
          width="21"
          height="20"
        >
          <path
            d="M9.86328 3V0M14.1133 4.7501L16.2633 2.6001M15.8633 9H18.8633M14.1133 13.25L16.2633 15.4M9.86328 15V18M5.61329 13.25L3.46329 15.4M3.86328 9H0.863281M5.61329 4.7501L3.46329 2.6001"
            stroke="#FCFDFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </mask>
        <g mask="url(#mask0_621_37858)">
          <rect
            width="25.2"
            height="25.2"
            transform="matrix(1 0 0 -1 -2.88672 21.4502)"
            fill="url(#paint0_angular_621_37858)"
          />
        </g>
      </g>
      <defs>
        <radialGradient
          id="paint0_angular_621_37858"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(12.6 12.6) rotate(90) scale(12.6)"
        >
          <stop stopColor="#F5F9FF" />
          <stop offset="1" stopColor="#F5F9FF" stopOpacity="0" />
        </radialGradient>
        <clipPath id="clip0_621_37858">
          <rect
            width="18"
            height="18"
            fill="white"
            transform="translate(0.863281)"
          />
        </clipPath>
      </defs>
    </svg>
  );
};

export default WhiteSpinner;
