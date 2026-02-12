import * as React from "react";
import classes from "./Typography.classes";
import { joinClasses } from "../../utils/join-classes";

export interface ITypographyClasses {
  base: string;
  alignment: {
    left: string;
    center: string;
    right: string;
  };
  color: {
    black: string;
    red: string;
    blue: string;
    gray: string;
    white: string;
  };
  textsize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
  };
}export interface ITypographyProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  classstyle?: string;
  align?: keyof ITypographyClasses["alignment"];
  color?: keyof ITypographyClasses["color"];
  textsize?: keyof ITypographyClasses["textsize"];
  tooltip?: string; // Add a tooltip prop
}

export const Typography = (props: ITypographyProps) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => props.tooltip && setShowTooltip(true)}
      onMouseLeave={() => props.tooltip && setShowTooltip(false)}
    >
      <p
        className={joinClasses(
          props.classstyle,
          classes.base,
          classes.alignment[props.align ?? "left"],
          classes.color[props.color ?? "white"],
          classes.textsize[props.textsize ?? "sm"],
          props.textsize
        )}
        {...props}
      >
        {props.children}
      </p>
      {props.tooltip && showTooltip && (
        <div className="absolute top-full mb-2 left-1/2 w-full transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded border border-txt-yellow leading-5 z-50" dangerouslySetInnerHTML={{ __html: props.tooltip }}>

        </div>
      )}
    </div>
  );
};