"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface BlobImageProps {
  blob: Blob;
  alt?: string;
  width?: number;
  height?: number;
}

const BlobImage = ({
  blob,
  alt = "Agent Icon",
  width = 300,
  height = 300,
}: BlobImageProps): JSX.Element => {
  const [imageSrc, setImageSrc] = useState("");

  console.log("suicide");

  console.log(blob);

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
    <div>
      <Image src={imageSrc} alt={alt} width={width} height={height} />
    </div>
  );
};

export default BlobImage;
