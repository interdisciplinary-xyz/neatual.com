export function PlayIcon({ className = "", ...props }) {
  return (
    <svg
      width="19"
      height="23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M19 11.5L.25 22.325V.675L19 11.5z" fill="#000" />
    </svg>
  );
}
