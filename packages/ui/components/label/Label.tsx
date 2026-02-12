import { joinClasses } from "../../utils/join-classes";
import * as LabelPrimitive from "@radix-ui/react-label";
import React from "react";

interface IInputLabelProps {
  children: React.ReactNode;
  labelfor: string;
  classstyle?: string;
}

const InputLabel = ({ children, ...props }: IInputLabelProps) => {
  return (
    <LabelPrimitive.Label
      {...props}
      htmlFor={`${props.labelfor}`}
      className={joinClasses(
        "select-none text-[18px] font-[400] font-serif text-[#554A68]",
        props.classstyle
      )}
    >
      {children}
    </LabelPrimitive.Label>
  );
};

export default InputLabel;
