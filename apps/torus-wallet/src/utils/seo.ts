import type { Metadata } from "next";
import { env } from "~/env";

export interface MetadataProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  canonical?: string;
}

export function generateMetadata({
  title = "Torus Wallet - Secure Digital Asset Management",
  description = "Simple, secure, and easy-to-use wallet for the torus ecosystem. Manage your digital assets with confidence using our industry-leading security features.",
  keywords = ["crypto wallet", "torus", "blockchain", "digital assets", "web3"],
  ogTitle = "Torus Wallet - Secure Digital Asset Management",
  ogDescription = "Simple, secure, and easy-to-use wallet for the torus ecosystem. Manage your digital assets with confidence.",
  twitterTitle = "Torus Wallet",
  twitterDescription = "Secure Digital Asset Management in the Torus Ecosystem",
  canonical = "/",
}: MetadataProps = {}): Metadata {
  return {
    robots: "index, follow",
    title,
    icons: [
      { rel: "icon", url: "favicon.ico" },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        url: "/apple-touch-icon.png",
      },
    ],
    description,
    keywords,
    metadataBase: new URL(
      env("NODE_ENV") === "production"
        ? "https://wallet.torus.network"
        : "https://wallet.testnet.torus.network",
    ),
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: "website",
      siteName: "Torus Wallet",
      locale: "en_US",
      images: [
        {
          url: "/og.webp",
          width: 1200,
          height: 630,
          alt: "Torus Wallet",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: twitterTitle,
      description: twitterDescription,
      creator: "@torus_network",
      images: ["/og.webp"],
    },
    alternates: {
      canonical,
    },
  };
}
