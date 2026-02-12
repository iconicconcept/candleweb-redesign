import { joinClasses } from "../utils/join-classes";
import React from "react";
import classes from "../design/flex.layout.classes";

export interface IFlexClasses {
  base: string;
}

interface IFlexProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  classstyle?: string;
}

const Flex = ({ children, ...props }: IFlexProps) => {
  return (
    <div {...props} className={joinClasses(classes.base, props.classstyle)}>
      {children}
    </div>
  );
};

export default Flex;
