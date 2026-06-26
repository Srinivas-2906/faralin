import Link from 'next/link';
import { getLogoImage } from '@/lib/media';

export function BrandLogo() {
  return (
    <Link href="/" className="brand brand--logo">
      <img src={getLogoImage()} alt="Faralin" className="brand-logo" />
    </Link>
  );
}
