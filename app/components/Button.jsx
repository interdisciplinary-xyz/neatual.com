export function Button({ href, children }) {
  const className =
    "block border-2 border-black w-full uppercase mb-4 text-16 text-center py-3 rounded-full font-bold";

  if (href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return <button type="button" className={className}>{children}</button>;
}
