'use client';

import Image from 'next/image';
import { useState } from 'react';
import { CaretLeftIcon, CaretRightIcon, BuildingsIcon } from '@phosphor-icons/react/ssr';
import styles from './propertyImageGallery.module.css';

type PropertyGalleryImage = { imageUrl: string; altText: string };

export function PropertyImageGallery({ images, propertyName }: { images: PropertyGalleryImage[]; propertyName: string }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const imageCount = images.length;
  const currentImage = images[selectedImageIndex];
  const changeImage = (step: number) => setSelectedImageIndex((current) => (current + step + imageCount) % imageCount);
  if (!currentImage) return <div className={styles.empty}><BuildingsIcon size={40} weight="duotone" aria-hidden="true" /></div>;
  return <div className={styles.gallery} aria-label={`${propertyName} photos`}>
    <div className={styles.hero}>
      <Image src={currentImage.imageUrl} alt={currentImage.altText || propertyName} fill sizes="(max-width: 700px) 100vw, 33vw" unoptimized />
      {imageCount > 1 && <><button type="button" className={`${styles.arrow} ${styles.previous}`} aria-label="Previous property photo" onClick={() => changeImage(-1)}><CaretLeftIcon size={20} weight="bold" /></button><button type="button" className={`${styles.arrow} ${styles.next}`} aria-label="Next property photo" onClick={() => changeImage(1)}><CaretRightIcon size={20} weight="bold" /></button><span className={styles.count}>{selectedImageIndex + 1} / {imageCount}</span></>}
    </div>
    {imageCount > 1 && <div className={styles.thumbnails} aria-label="Choose a property photo">{images.map((image, index) => <button key={`${image.imageUrl}-${index}`} type="button" aria-label={`Show photo ${index + 1}`} aria-pressed={selectedImageIndex === index} onClick={() => setSelectedImageIndex(index)}><Image src={image.imageUrl} alt="" fill sizes="64px" unoptimized /></button>)}</div>}
  </div>;
}
