import type { MetadataRoute } from "next";

// Added to the home screen, Batrelio opens like an app, straight on the artisan's requests.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Batrelio",
    short_name: "Batrelio",
    description: "Ne perdez plus de clients quand vous êtes sur un chantier.",
    start_url: "/espace",
    scope: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#1c1917",
    lang: "fr",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
