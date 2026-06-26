import { KnowledgeCenterNav } from '@/components/knowledge-center/knowledge-center-nav';

export default function KnowledgeCenterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="knowledge-center-app">
      <KnowledgeCenterNav />
      {children}
    </div>
  );
}
