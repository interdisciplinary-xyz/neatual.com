export function DottIcon({ className = "", ...props }) {
  return (
    <svg
      width="19"
      height="19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect width="19" height="19" rx="9.5" fill="#000" />
    </svg>
  );
}
