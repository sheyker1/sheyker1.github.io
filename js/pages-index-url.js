// GitHub Pages does not read vercel.json redirects.
// Normalize explicit index URLs while preserving query parameters and fragments.
if (location.pathname.endsWith('/index.html')) {
  location.replace(location.pathname.slice(0, -10) + location.search + location.hash);
}
