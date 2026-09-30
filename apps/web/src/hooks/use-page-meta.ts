import { useEffect } from 'react';

const SITE = 'https://www.legacylifebuilder.xyz';

function upsert(selector: string, create: () => HTMLElement): HTMLElement {
    let el = document.head.querySelector<HTMLElement>(selector);
    if (!el) {
        el = create();
        document.head.appendChild(el);
    }
    return el;
}

const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
    const el = upsert(`meta[${attr}="${key}"]`, () => {
        const m = document.createElement('meta');
        m.setAttribute(attr, key);
        return m;
    });
    el.setAttribute('content', content);
};

interface PageMeta {
    title: string;
    description: string;
    /** Path used for the canonical URL, for example "/login". Omit for private pages. */
    path?: string;
    /** False for private app pages: tells search engines not to index them. */
    index?: boolean;
}

/**
 * Per-page title, description, canonical and robots tags. The app is a single-page app, so each route sets
 * its own head tags on mount (Google renders JavaScript and reads them).
 */
export function usePageMeta({ title, description, path, index = true }: PageMeta) {
    useEffect(() => {
        document.title = title;
        setMeta('name', 'description', description);
        setMeta('name', 'robots', index ? 'index, follow' : 'noindex, nofollow');
        setMeta('property', 'og:title', title);
        setMeta('property', 'og:description', description);
        setMeta('name', 'twitter:title', title);
        setMeta('name', 'twitter:description', description);

        const canonical = upsert('link[rel="canonical"]', () => {
            const l = document.createElement('link');
            l.setAttribute('rel', 'canonical');
            return l;
        });
        if (path !== undefined && index) {
            canonical.setAttribute('href', `${SITE}${path}`);
            setMeta('property', 'og:url', `${SITE}${path}`);
        } else {
            canonical.removeAttribute('href');
        }
    }, [title, description, path, index]);
}
