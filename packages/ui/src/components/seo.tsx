import type { Metadata } from "next";

export interface SeoProps {
  ogImageAlt?: string;
  ogImageUrl?: string;
  baseUrl: string;
}

export const Seo = ({
  ogImageAlt = "Torus Network",
  ogImageUrl = "/og.png",
  baseUrl,
}: SeoProps) => {
  const imageUrl =
    ogImageUrl.startsWith("http://") || ogImageUrl.startsWith("https://")
      ? ogImageUrl
      : `${baseUrl}${ogImageUrl}`;

  return (
    <>
      <meta property="og:image" content={imageUrl} />
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
  robots?: string;

  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogSiteName: string;

  // Twitter
  twitterTitle?: string;
  twitterDescription?: string;

  // URL configuration
  canonical: string;
  baseUrl: string;

  // Custom image (optional)
  ogImagePath?: string;
}

const DEFAULT_BLOCKCHAIN_KEYWORDS = [
  "torus network",
  "Torus Network",
  "blockchain",
  "cryptocurrency",
  "web3",
  "defi",
  "decentralized finance",
  "polkadot",
  "substrate",
  "digital assets",
  "blockchain technology",
];

export function createSeoMetadata({
  title,
  description,
  keywords,
  robots,
  ogTitle,
  ogDescription,
  ogSiteName,
  twitterTitle,
  twitterDescription,
  canonical,
  baseUrl,
  ogImagePath = "/og.png",
}: SeoMetadataConfig): Metadata {
  // Check if baseUrl is an absolute URL (starts with http:// or https://)
  const isAbsoluteUrl =
    baseUrl.startsWith("http://") || baseUrl.startsWith("https://");

  // Helper function to join URL parts without double slashes
  const joinUrl = (base: string, path: string): string => {
    const baseTrimmed = base.replace(/\/$/, "");
    const pathTrimmed = path.replace(/^\//, "");
    return `${baseTrimmed}/${pathTrimmed}`;
  };

  // Use relative URLs if baseUrl is not absolute, otherwise construct full URLs
  const canonicalUrl = isAbsoluteUrl ? joinUrl(baseUrl, canonical) : canonical;
  const ogImageUrl = isAbsoluteUrl
    ? joinUrl(baseUrl, ogImagePath)
    : ogImagePath;

  // Build metadata object
  const metadata: Metadata = {
    title,
    description,
    keywords: [
      ...DEFAULT_BLOCKCHAIN_KEYWORDS,
      ...(keywords?.length ? keywords : []),
    ],
    robots: robots ?? "all",
    icons: [
      { rel: "icon", url: "/favicon.ico" },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        url: "/apple-touch-icon.png",
      },
    ],
    openGraph: {
      title: ogTitle ?? title,
      description: ogDescription ?? description,
      type: "website",
      siteName: ogSiteName,
      locale: "en_US",
      url: canonicalUrl,
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
      canonical: canonicalUrl,
    },
  };

  // Only set metadataBase if baseUrl is an absolute URL
  if (isAbsoluteUrl) {
    metadata.metadataBase = new URL(baseUrl);
  }

  return metadata;
}
