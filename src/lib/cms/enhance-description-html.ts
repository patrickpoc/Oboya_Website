const MAX_HEIGHT_RATIO = 0.65;
const MAX_HEIGHT_PX = 560;

function fitDescriptionImages(container: HTMLElement) {
  const maxW = container.clientWidth;
  if (maxW <= 0) return;

  const maxH = Math.min(window.innerHeight * MAX_HEIGHT_RATIO, MAX_HEIGHT_PX);

  container.querySelectorAll<HTMLImageElement>("img.product-description-image, img").forEach((img) => {
    const apply = () => {
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      if (!naturalWidth || !naturalHeight) return;

      const scale = Math.min(1, maxW / naturalWidth, maxH / naturalHeight);

      if (scale < 1) {
        img.style.width = `${Math.round(naturalWidth * scale)}px`;
        img.style.height = `${Math.round(naturalHeight * scale)}px`;
        img.style.maxWidth = "100%";
      } else {
        img.style.width = "";
        img.style.height = "";
        img.style.maxWidth = "";
      }
    };

    if (img.complete) {
      apply();
      return;
    }

    img.addEventListener("load", apply, { once: true });
  });
}

export function enhanceDescriptionHtmlForDisplay(html: string): string {
  if (!html.trim()) return "";

  let index = 0;
  return html.replace(/<img\b([^>]*)>/gi, (_match, rawAttrs: string) => {
    index += 1;

    let attrs = rawAttrs
      .replace(/\s(width|height)=["'][^"']*["']/gi, "")
      .replace(/\sstyle=["'][^"']*["']/gi, "");

    if (!/\bclass=/i.test(attrs)) {
      attrs += ' class="product-description-image"';
    } else if (!/product-description-image/.test(attrs)) {
      attrs = attrs.replace(
        /\bclass=(["'])([^"']*)\1/i,
        'class=$1$2 product-description-image$1'
      );
    }

    const loading = index === 1 ? "" : ' loading="lazy"';
    return `<img${attrs}${loading}>`;
  });
}

export function bindDescriptionImageFit(container: HTMLElement) {
  const run = () => fitDescriptionImages(container);
  run();

  const resizeObserver = new ResizeObserver(run);
  resizeObserver.observe(container);
  window.addEventListener("resize", run);

  return () => {
    resizeObserver.disconnect();
    window.removeEventListener("resize", run);
  };
}
