// import { FaRobot } from "react-icons/fa";
import { MdSmartToy } from "react-icons/md";
import { IoChatbubbleEllipses } from "react-icons/io5";

export function RobotIcon({
  size = 32,
  className = "text-[#0d1017]",
  showMessage = false,
}: {
  size?: number;
  className?: string;
  showMessage?: boolean;
}) {
  return (
    <div className="relative w-8 h-8">
      {/* main robot */}
      <MdSmartToy size={size} className={className} />

      {/* mouth cover (your existing trick) */}
      {showMessage && (
        <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-4 h-1 bg-current" />
      )}

      {/* message badge */}
      {showMessage && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-md">
          <IoChatbubbleEllipses size={13} className="text-white" />
        </div>
      )}
    </div>
  );
}