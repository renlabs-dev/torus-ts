import type { Metadata } from "next";
import { use } from "react";
import { ChainEnv } from "../lib/data";

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
  const imageUrl = `${baseUrl}${ogImageUrl}`;

  const imageExists = use(fetch(imageUrl).then((res) => res.ok));
  console.log("imageExists", imageExists);

  if (!imageExists) {
    return <></>;
  }

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
  ogTitle,
  ogDescription,
  ogSiteName,
  twitterTitle,
  twitterDescription,
  canonical,
  baseUrl,
  ogImagePath = "/og.png",
}: SeoMetadataConfig): Metadata {
  if(!baseUrl.startsWith("https://")) {
    return {};
  }
 
  const ogImageUrl = `${baseUrl}${ogImagePath}`;

  return {
    title,
    description,
    keywords: [
      ...DEFAULT_BLOCKCHAIN_KEYWORDS,
      ...(keywords?.length ? keywords : []),
    ],
    robots: "all",
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
      siteName: ogSiteName,
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