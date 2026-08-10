import { PortableText } from "@portabletext/react";

const components = {
  block: {
    normal: ({ children }) => <p className="mb-6 last:mb-0">{children}</p>,
  },
};

/**
 * Renders Portable Text from the CMS. Replaces the `dangerouslySetInnerHTML`
 * the body copy used to go through, so CMS content is never injected as raw HTML.
 */
export function RichText({ value, className }) {
  if (!Array.isArray(value) || value.length === 0) return null;
  return (
    <div className={className}>
      <PortableText value={value} components={components} />
    </div>
  );
}
