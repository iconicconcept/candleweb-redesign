import * as React from "react";
import classes from "./Button.classes";
import { joinClasses } from "../../utils/join-classes";
import type { ButtonType } from "../../types";

export interface IButtonClasses {
  base: string;
  width: string;
  variant: {
    primary: string;
    secondary: string;
    transparent: string;
    border: string;
    gradient: string;
  };
  icon: string;
  iconRight: string;
  size: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
  };
}

export interface IButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullwidth?: boolean;
  size?: keyof IButtonClasses["size"];
  variant?: keyof IButtonClasses["variant"];
  classstyle?: string;
  type?: ButtonType;
  disabled?: boolean;
  loading?: boolean;
  iconright?: boolean;
  icon?: React.ReactNode;
  onClick?: (
    event: React.MouseEvent | React.KeyboardEvent | React.TouchEvent
  ) => void;
}

export const Button = React.forwardRef<HTMLButtonElement, IButtonProps>(
  ({ fullwidth = false, iconright, loading, ...props }, ref) => {
    const handleClick = (
      event: React.MouseEvent | React.KeyboardEvent | React.TouchEvent
    ): void => {
      !props.disabled &&
        !loading &&
        props.onClick &&
        props.onClick(event);
    };
    return (
      <button
        {...props}
        type={props.type ?? "button"}
        disabled={props.disabled || loading}
        onClick={handleClick}
        ref={ref}
        className={joinClasses(
          classes.base,
          classes.variant[props.variant ?? "primary"],
          classes.size[props.size ?? "md"],
          fullwidth ? classes.width : "",
          loading && "cursor-not-allowed",
          props.classstyle,
        )}
      >
        {props.icon && !iconright && <div className={classes.icon}>{props.icon}</div>}
        {props.children}
        {props.icon && iconright && <div className={classes.iconRight}>{props.icon}</div>}
      </button>
    );
  }
);
