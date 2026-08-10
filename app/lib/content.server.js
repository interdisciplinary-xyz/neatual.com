import { sanityClient, isSanityConfigured, localized } from "./sanity.js";
import { LOCALES } from "./locales.js";
import { HREFLANG_URLS, LOCALE_CODES, PAGE_KEYS, DEFAULT_LOCALE } from "./seo.js";
import { htmlToBlocks, tidy } from "./portableText.js";
import {
  HOME_SR_HEADING,
  A11Y_LABELS,
  PAGE_META,
  PRODUCT_COPY,
  ADDRESS,
  fillTemplate,
  formatAddress,
} from "./inlineCopy.js";

const CONTENT_QUERY = `{
  "pages": *[_type == "page"]{
    pageKey, path, navLabel, srHeading, metaTitle, metaDescription,
    heading, shortDescription, body
  },
  "products": *[_type == "product"] | order(order asc){
    order, imageBase, photoCount, name, price, descriptionLines, alt
  },
  "settings": *[_type == "siteSettings"][0]{
    phone, email, address, messageCta, callCta, a11y
  }
}`;

const NAV_INDEX = { home: 0, gallery: 1, contact: 2 };

let warned = false;
function warnOnce(reason) {
  if (warned) return;
  warned = true;
  console.warn(`[content] Falling back to app/lib/locales.js — ${reason}`);
}

/** Shape produced from app/lib/locales.js, used when Sanity can't answer. */
function fromLocales(locale) {
  const config = LOCALES[locale] ?? LOCALES[DEFAULT_LOCALE];

  const pages = Object.fromEntries(
    PAGE_KEYS.map((pageKey) => {
      const isHome = pageKey === "home";
      return [
        pageKey,
        {
          pageKey,
          path: HREFLANG_URLS[locale][pageKey],
          navLabel: config.navItems[NAV_INDEX[pageKey]].label,
          srHeading: isHome ? HOME_SR_HEADING[locale] : config.headings[pageKey],
          metaTitle: isHome
            ? config.title
            : `${config.title} — ${PAGE_META[pageKey].suffix[locale]}`,
          metaDescription: isHome
            ? config.description
            : PAGE_META[pageKey].description[locale],
          heading: isHome ? tidy(config.home.heading) : undefined,
          shortDescription: isHome ? tidy(config.home.shortDescription) : undefined,
          body: isHome ? htmlToBlocks(config.home.fullDescription, `home-${locale}`) : [],
        },
      ];
    })
  );

  const products = PRODUCT_COPY.numbers.map((n) => ({
    order: n,
    imageBase: `produkt-${n}`,
    photoCount: PRODUCT_COPY.photoCount,
    name: fillTemplate(PRODUCT_COPY.name[locale], { n }),
    price: PRODUCT_COPY.price[locale],
    descriptionLines: PRODUCT_COPY.descriptionLines[locale],
    alt: fillTemplate(PRODUCT_COPY.alt[locale], { n }),
  }));

  return {
    source: "locales",
    locale,
    pages,
    products,
    paths: HREFLANG_URLS,
    settings: {
      phone: config.contact.phone,
      email: config.contact.email,
      address: ADDRESS,
      addressLine: formatAddress(ADDRESS, locale),
      messageCta: config.contact.message,
      callCta: config.contact.call,
      a11y: {
        close: config.a11y.close,
        homeLink: config.a11y.homeLink,
        selectProduct: A11Y_LABELS.selectProduct[locale],
        selectPhoto: A11Y_LABELS.selectPhoto[locale],
        photoAlt: A11Y_LABELS.photoAlt[locale],
        call: A11Y_LABELS.call[locale],
        email: A11Y_LABELS.email[locale],
        expand: A11Y_LABELS.expand[locale],
        langNav: A11Y_LABELS.langNav[locale],
        mainNav: A11Y_LABELS.mainNav[locale],
      },
    },
  };
}

/** Same shape, resolved from a Sanity response. */
function fromSanity(data, locale) {
  const pages = Object.fromEntries(
    data.pages.map((page) => [
      page.pageKey,
      {
        pageKey: page.pageKey,
        path: localized(page.path, locale),
        navLabel: localized(page.navLabel, locale),
        srHeading: localized(page.srHeading, locale),
        metaTitle: localized(page.metaTitle, locale),
        metaDescription: localized(page.metaDescription, locale),
        heading: localized(page.heading, locale),
        shortDescription: localized(page.shortDescription, locale),
        body: localized(page.body, locale) ?? [],
      },
    ])
  );

  // Rebuilt per locale so hreflang and the sitemap read CMS paths, not constants.
  const paths = Object.fromEntries(
    LOCALE_CODES.map((code) => [
      code,
      Object.fromEntries(data.pages.map((p) => [p.pageKey, localized(p.path, code)])),
    ])
  );

  const products = (data.products ?? []).map((p) => ({
    order: p.order,
    imageBase: p.imageBase,
    photoCount: p.photoCount ?? 4,
    name: localized(p.name, locale),
    price: localized(p.price, locale),
    descriptionLines: localized(p.descriptionLines, locale) ?? [],
    alt: localized(p.alt, locale),
  }));

  const s = data.settings;
  return {
    source: "sanity",
    locale,
    pages,
    products,
    paths,
    settings: {
      phone: s.phone,
      email: s.email,
      address: s.address,
      addressLine: formatAddress(s.address, locale),
      messageCta: localized(s.messageCta, locale),
      callCta: localized(s.callCta, locale),
      a11y: Object.fromEntries(
        Object.entries(s.a11y ?? {}).map(([key, value]) => [key, localized(value, locale)])
      ),
    },
  };
}

/**
 * Single entry point for page content. Always resolves — never throws — so a
 * Sanity outage degrades to the bundled copy instead of taking the site down.
 */
export async function getContent(locale) {
  if (!isSanityConfigured) {
    warnOnce("SANITY_STUDIO_PROJECT_ID is not set");
    return fromLocales(locale);
  }

  try {
    const data = await sanityClient.fetch(CONTENT_QUERY);
    const missing = PAGE_KEYS.filter(
      (key) => !data?.pages?.some((page) => page.pageKey === key)
    );
    if (missing.length || !data?.settings || !data?.products?.length) {
      warnOnce(
        `incomplete CMS response (missing: ${missing.join(", ") || (!data?.settings ? "siteSettings" : "products")})`
      );
      return fromLocales(locale);
    }
    return fromSanity(data, locale);
  } catch (error) {
    warnOnce(`Sanity request failed: ${error.message}`);
    return fromLocales(locale);
  }
}
