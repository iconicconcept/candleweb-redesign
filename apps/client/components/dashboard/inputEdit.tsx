import React, { useState } from "react";
import { Button, TextInput } from "ui";

type Props = {
  className?: string;
  value: string;
  label: string;
  name: string;
  inputClassName?: string;
  hideButton?: boolean;
  change: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const InputEdit = (props: Props) => {
  const [edit, setEdit] = useState<boolean>(false);
  return (
    <div
      className={`flex items-center justify-between px-5 gap-4 ${props.className}`}
    >
      <TextInput
        label={props.label}
        type="text"
        name={props.name}
        className={`sm:!my-3 ${props.inputClassName}`}
        value={props.value}
        disabled={!edit}
        edit
        onChange={props.change}
      />
      {!props.hideButton && !edit && (
        <Button
          classstyle="!rounded-xl !border-none !bg-[rgba(79,84,92,1)] text-white px-3 py-2 sm:px-3 sm:py-2"
          color="white"
          variant="secondary"
          onClick={() => {
            setEdit(true);
          }}
        >
          Edit
        </Button>
      )}
      {!props.hideButton && edit && (
        <Button
          classstyle="!rounded-sm !border-none px-3 py-2 !bg-primary sm:px-3 sm:py-2"
          variant="secondary"
          onClick={() => {
            setEdit(false);
          }}
        >
          Save
        </Button>
      )}
    </div>
  );
};

export default InputEdit;
