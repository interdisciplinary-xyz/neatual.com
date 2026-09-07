import { createContext, useContext } from "react";

/**
 * The per-request CSP nonce, for the inline scripts this app writes itself.
 *
 * ## Why a context and not a prop
 *
 * React Router already threads a nonce of its own: `<ServerRouter nonce>` puts
 * it on `FrameworkContext`, and `<Scripts>`, `<Links>` and `<ScrollRestoration>`
 * read it from there without being told. That covers every script the framework
 * emits — the hydration payload, the streamed `enqueue()` chunks, the module
 * preloads.
 *
 * It does not cover the two inline scripts in `app/root.jsx` that this repo
 * writes by hand: the JSON-LD block and the splash-suppression script. Those
 * are ordinary JSX, so they need the value passed to them, and the only public
 * way to reach them from `entry.server.jsx` is a context of our own —
 * `FrameworkContext` is exported as `UNSAFE_FrameworkContext` and reading it
 * would pin this file to React Router's internals.
 *
 * ## Empty on the client, on purpose
 *
 * `entry.client.jsx` does not provide a value, so `useNonce()` returns `""`
 * after hydration. That is not an oversight and it is not a hole: a nonce
 * authorises a script at *parse* time, and by the time the client renders, the
 * scripts below are already in the DOM and already ran. React Router makes the
 * same trade for its own tags — the nonce is never serialised into the
 * hydration payload — which is why the elements carry `suppressHydrationWarning`.
 */
const NonceContext = createContext("");

export const NonceProvider = NonceContext.Provider;

export const useNonce = () => useContext(NonceContext);
