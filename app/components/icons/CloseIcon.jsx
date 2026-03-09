export function CloseIcon({ className = "", ...props }) {
  return (
    <svg
      width="15"
      height="15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect
        y="2.813"
        width="3.977"
        height="17.236"
        rx="1.989"
        transform="rotate(-45 0 2.813)"
        fill="#000"
      />
      <rect
        x="12.188"
        width="3.977"
        height="17.236"
        rx="1.989"
        transform="rotate(45 12.188 0)"
        fill="#000"
      />
    </svg>
  );
}
