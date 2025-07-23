"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface BlobImageProps {
  blob: Blob;
  alt?: string;
}

const BlobImage = ({ blob, alt = "Agent Icon" }: BlobImageProps) => {
  const [imageSrc, setImageSrc] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    setImageSrc(objectUrl);

    // Clean up the object URL when the component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  if (!imageSrc) {
    return <div>Loading...</div>;
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={1000}
      height={1000}
      className="border md:max-h-48 md:min-h-48 md:min-w-48 md:max-w-48"
    />
  );
};

export default BlobImage;
