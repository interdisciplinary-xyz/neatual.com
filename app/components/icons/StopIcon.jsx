export function StopIcon({ className = "", ...props }) {
  return (
    <svg
      width="19"
      height="19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path fill="#000" d="M0 0h19v19H0z" />
    </svg>
  );
}
