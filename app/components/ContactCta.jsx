import { Button } from "./Button";
import { useContent } from "../lib/useContent";

/**
 * The site-wide call to action, rendered under every route's content by
 * root.jsx.
 *
 * Rendered once in the layout rather than pasted into each route: the home page
 * is a two-column flex row at desktop width, so a CTA appended inside its
 * <article> would land *in* the row as a third column rather than below the
 * content.
 *
 * `<h2>` is safe on every page because each route already opens with an
 * `sr-only` <h1> — the heading order Lighthouse gates at minScore 1 stays
 * intact. It is not `sr-only` here; the heading is visible by design.
 */
export function ContactCta() {
  const content = useContent();
  const cta = content?.cta;
  const settings = content?.settings;

  if (!cta?.heading) return null;

  const tel = `tel:${(settings?.phone ?? "").replace(/\s/g, "")}`;
  const mailto = `mailto:${settings?.email ?? ""}`;

  return (
    /*
      `mx-auto` centres the block, `text-center` the text inside it. Both are
      needed: Button is `block w-full`, so it fills this wrapper — text-center
      alone would centre the heading and body while leaving the buttons at prose
      width, pinned left.
    */
    <section className="max-w-prose mx-auto text-center px-4 pt-16 pb-8">
      <h2 className="font-bold text-18 mb-4">{cta.heading}</h2>
      <p className="text-16 text-content mb-8">{cta.body}</p>
      <div>
        <Button href={mailto}>{settings?.messageCta}</Button>
        <Button href={tel}>{settings?.callCta}</Button>
      </div>
    </section>
  );
}
