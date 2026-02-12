import React from "react";
import { dollarFormat } from "ui";

type Props = {
  icon: React.ReactNode;
  title: string;
  amount: number;
};

const AmountCard = (props: Props) => {
  return (
    <div className="bg-card rounded-lg flex items-center gap-4 p-4 w-full max-h-[200px]">
      <div className="icon bg-[rgba(30,74,72,1)] flex items-center justify-center w-14 h-14 rounded-lg text-3xl">
        {props.icon}
      </div>
      <div className="amount__info inter flex flex-col items-start">
        <p className="text-sm tracking-wide">{props.title}</p>
        <h3 className="text-2xl font-semibold">{props.amount}</h3>
      </div>
    </div>
  );
};

export default AmountCard;
