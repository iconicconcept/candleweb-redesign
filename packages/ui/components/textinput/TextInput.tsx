import CustomTooltip from "../tooltip/Tooltip";
import { BsQuestionCircle } from "react-icons/bs";

export interface ITextInputProps {
  type: string;
  name: string;
  label?: string;
  value: string;
  className?: string;
  iconClassName?: string;
  Icon?: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  edit?: boolean;
  dash?: boolean;
  tooltip?: boolean;
  tooltipText?: string;
  isOptional?: boolean;
  placeholder?: string;
}

export const TextInput = ({
  type,
  name,
  className,
  value,
  onChange,
  label,
  Icon,
  disabled = false,
  edit,
  dash,
  tooltip, tooltipText,
  isOptional
}: ITextInputProps) => {
  return (
    <div
      className={`login__form-group ${className} form__input relative w-full h-[45px] my-7`}
    >
      <input
        type={type}
        className={`login__input ${edit && "edit"
          } w-full h-full outline-none bg-transparent`}
        id={name}
        required
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      {!tooltip && <label
        htmlFor={name}
        className={`login__label absolute bottom-[10px] left-0 text-sm text-white transition ease-in-out delay-150 duration-300 flex items-center gap-1`}
      >
        {label}
        {isOptional && <span className="text-red-500 text-sm ml-2">(optional)</span>}
      </label>}
      {tooltip && <div className="login__label absolute bottom-[10px] left-0 transition ease-in-out delay-150 duration-300 flex items-center gap-2">
        <label
          htmlFor={name}
          className={`login__label text-sm`}
        >
          {label}
          {isOptional && <span className="text-red-500 text-sm ml-2">(optional)</span>}
        </label>
        <CustomTooltip text={tooltipText!} trigger={<BsQuestionCircle />} />
      </div>}
      {Icon && (
        <span className="absolute right-2 top-4 text-primary">{Icon}</span>
      )}

      <div className={`underline ${disabled ? "hidden" : ""}`}></div>
    </div>
  );
};

export const DashTextInput = ({
  type,
  name,
  className,
  value,
  onChange,
  Icon,
  disabled = false,
  edit,
}: ITextInputProps) => {
  return (
    <div
      className={`relative w-full border border-gray-500 rounded-full ${className} h-[40px] my-5`}
    >
      <input
        type={type}
        className={`login__input ${edit && "edit"
          } w-full h-full outline-none bg-transparent pl-4 pr-3 text-sm`}
        id={name}
        required
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      {Icon && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-primary">
          {Icon}
        </span>
      )}
    </div>
  );
};



export const RoundedTextInput = ({
  type,
  name,
  className,
  value,
  onChange,
  label,
  Icon,
  disabled = false,
  edit,

  tooltip, tooltipText,
  isOptional,
  placeholder,
  iconClassName
}: ITextInputProps) => {
  return (
    <div
      className={`login__form-group form__input relative w-full h-[45px] my-7 rounded-full bg-white ${className}`}
    >
      <input
        type={type}
        className={`login__input ${edit && "edit"
          } w-full h-full outline-none bg-transparent pl-10 text-black placeholder:text-sm`}
        id={name}
        required
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
      />
      {/* {!tooltip && <label
        htmlFor={name}
        className={`login__label absolute bottom-[10px] left-0 text-sm text-white transition ease-in-out delay-150 duration-300 flex items-center gap-1`}
      >
        {label}
        {isOptional && <span className="text-red-500 text-sm ml-2">(optional)</span>}
      </label>} */}
      {isOptional && <span className="absolute -top-6 right-2  text-primary text-sm ml-2">(optional)</span>}
      {tooltip && <div className="login__label absolute bottom-[10px] left-5 transition ease-in-out delay-150 duration-300 flex items-center gap-2">
        <label
          htmlFor={name}
          className={`login__label text-sm`}
        >
          {label}
          {isOptional && <span className="text-primary text-sm ml-2">(optional)</span>}
        </label>
        <CustomTooltip text={tooltipText!} trigger={<BsQuestionCircle />} />
      </div>}
      {Icon && (
        <span className={`absolute left-4 top-[14px] text-[#1FBA8B] text-lg ${iconClassName}`}>{Icon}</span>
      )}

      {/* <div className={`underline ${disabled ? "hidden" : ""}`}></div> */}
    </div>
  );
};