import Link from 'next/link';
import { getLogoImage } from '@/lib/media';

const quickLinks = {
  platform: [
    { href: '/assessments', label: 'Assessments' },
    { href: '/universities', label: 'Universities' },
    { href: '/dashboard', label: 'Dashboard' },
  ],
  about: [
    { href: '/foundation', label: 'Faralin Foundation' },
    { href: '/knowledge-center', label: 'Knowledge Center' },
    { href: '/sign-up', label: 'Get started' },
  ],
};

export function SiteFooter() {
  return (
    <footer className="site-footer site-footer-rich">
      <div className="container-wide">
        <div className="site-footer-grid">
          <div className="site-footer-brand-col">
            <Link href="/" className="site-footer-brand site-footer-brand--logo">
              <img src={getLogoImage()} alt="Faralin" className="brand-logo" />
            </Link>
            <p className="site-footer-tagline">
              University-backed recognition that may convert to conditional bursary value when you
              enrol.
            </p>
            <address className="site-footer-address">
              <span>Faralin Ltd</span>
              <span>71-75 Shelton Street, Covent Garden</span>
              <span>London WC2H 9JQ, United Kingdom</span>
            </address>
          </div>

          <div className="site-footer-col">
            <h3 className="site-footer-heading">Platform</h3>
            <ul className="site-footer-links">
              {quickLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="site-footer-col">
            <h3 className="site-footer-heading">About</h3>
            <ul className="site-footer-links">
              {quickLinks.about.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="site-footer-col">
            <h3 className="site-footer-heading">Contact</h3>
            <ul className="site-footer-contact">
              <li>
                <a href="mailto:hello@faralin.com">hello@faralin.com</a>
              </li>
              <li>
                <a href="tel:+442079460958">+44 20 7946 0958</a>
              </li>
              <li>
                <span>Mon–Fri, 9:00–17:30 GMT</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer-bottom">
          <p>© {new Date().getFullYear()} Faralin Ltd. All rights reserved.</p>
          <p className="site-footer-disclaimer">
            Faralins are conditional recognition value, not cash. Conversion to bursary support
            requires admission and enrolment at a partner university.
          </p>
        </div>
      </div>
    </footer>
  );
}
