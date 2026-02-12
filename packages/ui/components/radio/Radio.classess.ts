import { IRadioGroupClasses } from "./Radio";

export default <IRadioGroupClasses>{
  base: "",
  radioItem:
    "peer relative w-4 h-4 rounded-full border border-transparent text-white radix-state-checked:bg-semPrimary radix-state-unchecked:bg-red-500 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75 focus-visible:ring-offset-2",
  radioIndicator: "absolute inset-0 flex items-center justify-center leading-0",
};
