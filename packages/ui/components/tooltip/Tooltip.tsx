import React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import "./tooltip.css";

type Props = {
  text: string;
  trigger: JSX.Element;
};

const CustomTooltip = (props: Props) => {
  return (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root>
        <Tooltip.Trigger>{props.trigger}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="TooltipContent">
            {props.text}
            <Tooltip.Arrow className="TooltipArrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export default CustomTooltip;
