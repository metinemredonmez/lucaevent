// Mapbox GL JS'i CDN'den (npm bağımlılığı olmadan) bir kez yükler.
// Token admin Ayarlar'dan gelir (maps.mapbox.token) — koda gömülmez.
const MAPBOX_VERSION = "v3.9.1";

export function loadMapbox(): Promise<any> {
  const w = window as any;
  if (w.mapboxgl) return Promise.resolve(w.mapboxgl);
  if (w.__mapboxLoading) return w.__mapboxLoading;
  w.__mapboxLoading = new Promise((resolve, reject) => {
    if (!document.querySelector("link[data-mapbox]")) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = `https://api.mapbox.com/mapbox-gl-js/${MAPBOX_VERSION}/mapbox-gl.css`;
      css.setAttribute("data-mapbox", "");
      document.head.appendChild(css);
    }
    const s = document.createElement("script");
    s.src = `https://api.mapbox.com/mapbox-gl-js/${MAPBOX_VERSION}/mapbox-gl.js`;
    s.async = true;
    s.onload = () => resolve(w.mapboxgl);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return w.__mapboxLoading;
}

/** Aktif temaya göre Mapbox stil URL'si (admin koyu/açık). */
export function mapboxStyle(): string {
  const dark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  return dark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11";
}
