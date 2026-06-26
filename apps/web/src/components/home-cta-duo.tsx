import Link from 'next/link';
import { getLogoImage } from '@/lib/media';

export function HomeCtaDuo() {
  return (
    <div className="home-cta-duo">
      <Link href="/foundation" className="home-cta-panel home-cta-panel--foundation">
        <span className="home-cta-foundation-mark">
          <img src={getLogoImage()} alt="" className="home-cta-foundation-logo" />
          <span className="home-cta-foundation-label">Foundation</span>
        </span>
        <span className="home-cta-arrow" aria-hidden="true">
          →
        </span>
      </Link>

      <Link href="/knowledge-center" className="home-cta-panel home-cta-panel--crimson">
        <p className="home-cta-label">Knowledge Center</p>
        <span className="home-cta-arrow" aria-hidden="true">
          →
        </span>
      </Link>
    </div>
  );
}
