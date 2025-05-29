import type { Metadata } from "next";

export interface SeoProps {
  ogImageAlt: string;
  ogImageUrl?: string;
}

export const Seo = ({ ogImageAlt, ogImageUrl = "/og.png" }: SeoProps) => {
  return (
    <>
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={ogImageAlt} />
    </>
  );
};

export interface SeoMetadataConfig {
  // Basic SEO
  title: string;
  description: string;
  keywords?: string[];

  // Open Graph
  ogTitle?: string;
  ogDescription?: string;

  // Twitter
  twitterTitle?: string;
  twitterDescription?: string;

  // URL configuration
  canonical: string;
  baseUrl: string;

  // Custom image (optional)
  ogImagePath?: string;
}

export function createSeoMetadata({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  twitterTitle,
  twitterDescription,
  canonical,
  baseUrl,
  ogImagePath = "/og.png",
}: SeoMetadataConfig): Metadata {
  const ogImageUrl = `${baseUrl}${ogImagePath}`;

  return {
    title,
    description,
    keywords,
    robots: { index: true, follow: true },
    icons: [
      { rel: "icon", url: "/favicon.ico" },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        url: "/apple-touch-icon.png",
      },
    ],
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: ogTitle ?? title,
      description: ogDescription ?? description,
      type: "website",
      siteName: "Torus Wallet",
      locale: "en_US",
      url: `${baseUrl}${canonical}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: ogTitle ?? title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: twitterTitle ?? ogTitle ?? title,
      description: twitterDescription ?? ogDescription ?? description,
      creator: "@torus_network",
      site: "@torus_network",
      images: [
        {
          url: ogImageUrl,
          alt: twitterTitle ?? ogTitle ?? title,
        },
      ],
    },
    alternates: {
      canonical: `${baseUrl}${canonical}`,
    },
  };
}
