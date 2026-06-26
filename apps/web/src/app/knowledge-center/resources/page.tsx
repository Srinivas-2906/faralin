import { HomeWideBanner } from '@/components/home-wide-banner';
import { AllNewtonsFeature } from '@/components/knowledge-center/all-newtons-feature';
import { ResourcesCatalogInsight } from '@/components/knowledge-center/knowledge-insights';
import { ALL_NEWTONS_RESOURCES, ALL_NEWTONS_URL } from '@/lib/all-newtons';
import { getPortfolioBandImage } from '@/lib/media';

export default function ResourcesPage() {
  return (
    <div className="knowledge-center-page">
      <HomeWideBanner
        imageSrc={getPortfolioBandImage()}
        imageAlt=""
        eyebrow="Resources"
        title="Study materials for every subject."
      />

      <div className="page-section knowledge-center-page-body">
        <div className="container-wide">
          <div className="assessments-stats-row">
            <ResourcesCatalogInsight />
          </div>

          <AllNewtonsFeature />

          <div className="knowledge-resources-grid">
            {ALL_NEWTONS_RESOURCES.map((resource) => (
              <a
                key={resource.title}
                href={ALL_NEWTONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="knowledge-resource-card"
              >
                <p className="knowledge-resource-card-eyebrow">
                  Provided by All Newtons · {resource.category}
                </p>
                <h3 className="knowledge-resource-card-title">{resource.title}</h3>
                <p className="knowledge-resource-card-copy">{resource.description}</p>
                <span className="knowledge-resource-card-link">Open in All Newtons →</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
