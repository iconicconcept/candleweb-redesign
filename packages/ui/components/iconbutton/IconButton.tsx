import * as React from "react";
import classes from "./IconButton.classes";
import { joinClasses } from "../../utils/join-classes";
import Loader from "../feedback/loader";
import { Button, IButtonProps } from "../button/Button";

export interface IIconButtonProps extends IButtonProps {
  loadingtext?: string; // Button label when loading is true

  lefticon?: React.ReactElement; // Adds icon before button label

  righticon?: React.ReactElement; // Adds icon before button label

  classstyle?: string;

  onClick?: (
    event: React.MouseEvent | React.KeyboardEvent | React.TouchEvent
  ) => void;
}

export const IconButton = (props: IIconButtonProps) => {
  /** Whenever button is clicked and button is neither loading nor disabled,
   * this function calls the
   * props.onClick function passed, passing the click event as an argument
   *
   * The props.onClick event can be any function
   */
  const handleClick = (
    event: React.MouseEvent | React.KeyboardEvent | React.TouchEvent
  ): void => {
    !props.disabled && !props.loading && props.onClick && props.onClick(event);
  };
  return (
    <Button
      {...props}
      type={props.type}
      disabled={props.disabled}
      onClick={handleClick}
      className={joinClasses(
        props.classstyle,
        classes.base,
        classes.variant[props.variant ?? "primary"],
        classes.size[props.size ?? "sm"],
        props.fullwidth && classes.width
      )}
    >
      {props.lefticon && !props.loading && !props.disabled && (
        <span>{props.lefticon}</span>
      )}

      {props.loading && (
        <Loader
          size="md"
          variant={props.variant === "primary" ? "white" : "blue"}
        />
      )}

      {props.loading && props.loadingtext && <span>{props.loadingtext}</span>}

      {!props.loading && <span>{props.children}</span>}

      {props.righticon && !props.loading && !props.disabled && (
        <span>{props.righticon}</span>
      )}
    </Button>
  );
};
