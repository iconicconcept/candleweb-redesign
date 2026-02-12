import Switch from "react-switch";

export interface ISwitchProps {
  defaultChecked?: boolean;
  checked: boolean;
  oncheckedchange: (value: boolean) => void;
  disabled?: boolean;
  name: string;
  value: string;
  height?: number;
  width?: number;
  diameter?: number;
}

export const SwitchToggle = ({ checked, defaultChecked, disabled, name, value, height, width, diameter, oncheckedchange }: ISwitchProps) => {
  return (
    <Switch
      checked={checked}
      onChange={(vl) => oncheckedchange(vl)}
      onColor="#1e8b6a"
      onHandleColor="#27ecb0"
      handleDiameter={diameter ?? 30}
      uncheckedIcon={false}
      checkedIcon={false}
      boxShadow="0px 1px 5px rgba(0, 0, 0, 0.1)"
      activeBoxShadow="0px 5px 1px 10px rgba(0, 0, 0, 0.8)"
      height={height ?? 20}
      width={width ?? 48}
      className="react-switch"
      id="material-switch"
    />
  );
};
