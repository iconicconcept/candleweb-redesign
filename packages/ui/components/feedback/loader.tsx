import WhiteSpinner from "../icons/whitespinner/WhiteSpinner";
import BlueSpinner from "../icons/bluespinner/BlueSpinner";

export interface ILoaderClasses {
  variant: {
    white: string;
    blue: string;
  };
  size: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
  };
}

export interface ILoaderProps extends React.HTMLAttributes<HTMLElement> {
  size?: keyof ILoaderClasses["size"];
  variant?: keyof ILoaderClasses["variant"];
}

export default function Loader(props: ILoaderProps) {
  return (
    <span>
      <BlueSpinner size={props.size} />
    </span>
  );
}
