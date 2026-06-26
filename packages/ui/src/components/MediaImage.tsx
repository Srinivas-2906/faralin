'use client';

import type { ImgHTMLAttributes, SyntheticEvent } from 'react';

type AspectRatio = '16x9' | '4x3' | '1x1';

interface MediaImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'className'> {
  src: string;
  alt: string;
  aspect?: AspectRatio;
  className?: string;
  frameClassName?: string;
  fallbackSrc?: string;
}

const aspectClass: Record<AspectRatio, string> = {
  '16x9': 'media-frame--16x9',
  '4x3': 'media-frame--4x3',
  '1x1': 'media-frame--1x1',
};

export function MediaImage({
  src,
  alt,
  aspect = '16x9',
  className = '',
  frameClassName = '',
  fallbackSrc = '/images/fallback-campus.jpg',
  onError,
  ...props
}: MediaImageProps) {
  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    if (fallbackSrc && img.src !== fallbackSrc && !img.src.endsWith(fallbackSrc)) {
      img.src = fallbackSrc;
      return;
    }
    onError?.(event);
  };

  return (
    <div className={`media-frame ${aspectClass[aspect]} ${frameClassName}`.trim()}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={className}
        onError={handleError}
        {...props}
      />
    </div>
  );
}
