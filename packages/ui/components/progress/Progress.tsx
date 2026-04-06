import React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

type Props = {
  progress: number;
  color: string;
};


export const Progress = ({ progress, color }: Props) => {
  // Check if progress is a valid number between 0 and 100
  if (isNaN(progress) || progress < 0 || progress > 100) {
    return <></>;
  }
  return (
    <ProgressPrimitive.Root
      value={progress}
      className="h-3 w-full overflow-hidden rounded-full bg-white/10"
    >
      <ProgressPrimitive.Indicator
        style={{ width: `${progress}%`, backgroundColor: color }}
        className="h-full duration-300 ease-in-out rounded-lg"
      />
    </ProgressPrimitive.Root>
  );
};
