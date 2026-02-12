import * as React from "react";
import classes from "./Heading.classes";
import { joinClasses } from "../../utils/join-classes";

export interface IHeadingClasses {
  alignment: {
    center: string;
    left: string;
    right: string;
  };
  boldness: {
    extralight: string;
    light: string;
    normal: string;
    med: string;
    semibold: string;
    bold: string;
    extrabold: string;
  };
  textsize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
    "4xl": string;
    "5xl": string;
    "6xl": string;
    "7xl": string;
  };
}
export interface IHeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  classstyle?: string;
  align?: keyof IHeadingClasses["alignment"];
  boldness?: keyof IHeadingClasses["boldness"];
  textsize: keyof IHeadingClasses["textsize"];
}

export const Heading = (props: IHeadingProps) => {
  return (
    <>
      {props.textsize === "6xl" && (
        <>
          <h6
            {...props}
            className={joinClasses(
              props.classstyle,

              classes.alignment[props.align ?? "left"],
              classes.boldness[props.boldness ?? "bold"],
              classes.textsize[props.textsize]
            )}
          >
            {props.children}
          </h6>
        </>
      )}

      {props.textsize === "5xl" && (
        <>
          <h6
            {...props}
            className={joinClasses(
              classes.alignment[props.align ?? "left"],
              classes.boldness[props.boldness ?? "bold"],
              classes.textsize[props.textsize],
              props.classstyle
            )}
          >
            {props.children}
          </h6>
        </>
      )}

      {props.textsize === "4xl" && (
        <>
          <h6
            {...props}
            className={joinClasses(
              classes.alignment[props.align ?? "left"],
              classes.boldness[props.boldness ?? "bold"],
              classes.textsize[props.textsize],
              props.classstyle
            )}
          >
            {props.children}
          </h6>
        </>
      )}

      {props.textsize === "3xl" && (
        <>
          <h6
            {...props}
            className={joinClasses(
              classes.alignment[props.align ?? "left"],
              classes.boldness[props.boldness ?? "bold"],
              classes.textsize[props.textsize],
              props.classstyle
            )}
          >
            {props.children}
          </h6>
        </>
      )}

      {props.textsize === "2xl" && (
        <>
          <h1
            {...props}
            className={joinClasses(
              classes.alignment[props.align ?? "left"],
              classes.boldness[props.boldness ?? "bold"],
              classes.textsize[props.textsize],
              props.classstyle
            )}
          >
            {props.children}
          </h1>
        </>
      )}

      {props.textsize === "xl" && (
        <>
          <h2
            {...props}
            className={joinClasses(
              classes.alignment[props.align ?? "left"],
              classes.boldness[props.boldness ?? "bold"],
              classes.textsize[props.textsize],
              props.classstyle
            )}
          >
            {props.children}
          </h2>
        </>
      )}

      {props.textsize === "lg" && (
        <>
          <h3
            {...props}
            className={joinClasses(
              classes.alignment[props.align ?? "left"],
              classes.boldness[props.boldness ?? "bold"],
              classes.textsize[props.textsize],
              props.classstyle
            )}
          >
            {props.children}
          </h3>
        </>
      )}

      {props.textsize === "md" && (
        <>
          <h4
            {...props}
            className={joinClasses(
              classes.alignment[props.align ?? "left"],
              classes.boldness[props.boldness ?? "bold"],
              classes.textsize[props.textsize],
              props.classstyle
            )}
          >
            {props.children}
          </h4>
        </>
      )}

      {props.textsize === "sm" && (
        <>
          <h5
            {...props}
            className={joinClasses(
              classes.alignment[props.align ?? "left"],
              classes.boldness[props.boldness ?? "bold"],
              classes.textsize[props.textsize],
              props.classstyle
            )}
          >
            {props.children}
          </h5>
        </>
      )}

      {props.textsize === "xs" && (
        <>
          <h6
            {...props}
            className={joinClasses(
              classes.alignment[props.align ?? "left"],
              classes.boldness[props.boldness ?? "bold"],
              classes.textsize[props.textsize],
              props.classstyle
            )}
          >
            {props.children}
          </h6>
        </>
      )}
    </>
  );
};
