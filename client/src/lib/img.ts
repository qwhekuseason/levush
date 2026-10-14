/**
 * Studio photos in /assets/models have 640px copies (IMG_1234-640.webp).
 * Returns a srcSet so cards and small screens load the light copy.
 */
export function modelSrcSet(src: string | undefined): string | undefined {
  if (!src || !/^\/assets\/models\/IMG_\d+\.webp$/.test(src)) return undefined;
  return `${src.replace(/\.webp$/, '-640.webp')} 640w, ${src} 1024w`;
}
