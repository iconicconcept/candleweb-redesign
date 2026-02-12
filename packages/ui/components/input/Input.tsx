import { joinClasses } from "../../utils/join-classes";
import * as React from "react";
import classes from "./Input.classes";

export interface IInputClasses {
  base: string;
  passwordInputBase: string;
  authTokenInputBase: string;
  authTokenInputClicked: string;
}
export interface IInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  placeholder?: string;
  type: "tel" | "search" | "radio" | "email" | "button" | "number" | "text";
  value?: string | number;
  width?: string;
  onchange?: (
    event: React.MouseEvent | React.KeyboardEvent | React.TouchEvent
  ) => void;
  classstyle?: string;
}

const Input = React.forwardRef<React.ElementRef<"input">, IInputProps>(
  (props, ref) => (
    <input
      {...props}
      ref={ref}
      name={props.name}
      placeholder={props.placeholder}
      value={props.value}
      type={props.type}
      onChange={(e) => props.onchange}
      className={joinClasses(props.classstyle, classes.base, props.width)}
    />
  )
);

Input.displayName = "Input";
export { Input };
