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
  const baseUrl =
    env("NODE_ENV") === "production"
      ? "https://wallet.torus.network"
      : // : "https://wallet.testnet.torus.network";
        "https://pr-236.torus-wallet.torus.network";

  const ogImageUrl = `/og.png`;
  const fullOgImageUrl = `${baseUrl}${ogImageUrl}`;

  return {
    title,
    description,
    keywords,
    robots: "index, follow",
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
      title: ogTitle,
      description: ogDescription,
      type: "website",
      siteName: "Torus Wallet",
      locale: "en_US",
      url: canonical,
      images: [
        {
          url: ogImageUrl,
          width: 2400,
          height: 1260,
          alt: "Torus Wallet - Secure Digital Asset Management",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: twitterTitle,
      description: twitterDescription,
      creator: "@torus_network",
      site: "@torus_network",
      images: [ogImageUrl],
    },
    other: {
      "og:image:secure_url": fullOgImageUrl,
      "og:image:width": "2400",
      "og:image:height": "1260",
      "og:image:type": "image/png",
      "og:image:alt": "Torus Wallet - Secure Digital Asset Management",
      "twitter:image": fullOgImageUrl,
      "twitter:image:alt": "Torus Wallet - Secure Digital Asset Management",
      "theme-color": "#000000",
    },
    alternates: {
      canonical: canonical,
    },
  };
}
