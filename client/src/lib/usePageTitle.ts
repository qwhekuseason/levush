import { useEffect } from 'react';

const SITE = 'Levush';
const DEFAULT_TITLE = 'Levush — Faith, Worn.';

/** Sets the browser-tab / search-result title for a page, e.g. "Shop — Levush". */
export function usePageTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE}` : DEFAULT_TITLE;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
}
