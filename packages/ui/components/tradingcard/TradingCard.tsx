import React from "react";
import CustomTooltip from "../tooltip/Tooltip";
import { BsQuestionCircle } from "react-icons/bs";
import { joinClasses } from "../../utils/join-classes";
import { numberFormat } from "../../utils/number-format";
import { Heading } from "../heading/Heading";
import { Typography } from "../typography/Typography";
import classes from "./TradingCard.classes";

export interface ITradingCardClasses {
  base: string;
  title: string;
  heading: string;
  icon: string;
}

export interface ITradingCardProps {
  title?: string;
  heading: number;
  icon: React.ReactNode;
  loader?: JSX.Element;
  isPercent?: boolean;
  isUsers?: boolean;
  isLoading: boolean;
  tooltipText?: string;
}

export const TradingCard = ({ isLoading, ...props }: ITradingCardProps) => {
  return (
    <div className="glass_bg relative min-w-[344px] tb:min-w-[320px] sm:!min-w-[290px] ">
      <div className={joinClasses(classes.base)}>
        {isLoading && props.loader}
        {!isLoading && (
          <>
            <div className={classes.icon}>{props.icon}</div>
            <div className="flex flex-col items-start justify-center ml-3">
              <Typography
                classstyle={classes.title}
                align="center"
                dangerouslySetInnerHTML={{ __html: props.title! }}
              ></Typography>
              {props.tooltipText && (
                <div className="absolute top-3 right-5">
                  <CustomTooltip text={props.tooltipText!} trigger={<BsQuestionCircle />} />
                </div>
              )}
              <Heading textsize="3xl" boldness="bold" classstyle={joinClasses(classes.heading)}>
                {!props.isPercent && !props.isUsers && `$` + numberFormat(props.heading!)}
                {props.isUsers && numberFormat(props.heading!)}
                {props.isPercent && !props.isUsers && numberFormat(props.heading)}
              </Heading>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
