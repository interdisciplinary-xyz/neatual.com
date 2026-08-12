/**
 * Three bars, drawn to the same weight and pill radius as the two in CloseIcon
 * — the menu button turns into that one when the panel opens, and a change of
 * stroke weight mid-gesture reads as two different controls rather than one
 * toggling.
 */
export function MenuIcon({ className = "", ...props }) {
  return (
    <svg
      width="18"
      height="16"
      viewBox="0 0 18 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect width="18" height="3.977" rx="1.989" fill="#000" />
      <rect y="6.012" width="18" height="3.977" rx="1.989" fill="#000" />
      <rect y="12.023" width="18" height="3.977" rx="1.989" fill="#000" />
    </svg>
  );
}
