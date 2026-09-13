/* The active rail/tab icon gets a small walking figure instead of sitting
   still — see useNavWalker for the animation driver. Inactive items render
   their plain icon. */
export default function NavIcon({ Icon, active }: { Icon: any; active: boolean }) {
  if (!active) return <Icon />;
  return (
    <span className="ico2">
      <Icon className="ic-dash" />
      <svg className="ic-walk" viewBox="0 0 24 24" aria-hidden="true">
        <g className="wk">
          <circle cx="12" cy="4.2" r="2.15" />
          <path className="torso" d="M12 6.4v6.3" />
          <path className="arm arm-a" d="M12 8.2l3.5 3.3" />
          <path className="arm arm-b" d="M12 8.2l-3.5 3.3" />
          <path className="leg leg-a" d="M12 12.7l3.3 5.9" />
          <path className="leg leg-b" d="M12 12.7l-3.3 5.9" />
        </g>
      </svg>
    </span>
  );
}
