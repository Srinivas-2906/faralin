/**
 * Curated Unsplash URLs for assessment card imagery (1200×675 crop).
 * Run: node apps/web/scripts/fetch-assessment-images.mjs
 */

const SUBJECT_POOLS = {
  mathematics: [
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509228621472-8bff35754979?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1596495578064-4009163b8e57?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509228478516-283064a780e2?w=1200&h=675&fit=crop&q=80',
  ],
  physics: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507413245160-0c3f815b0a8f?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1636466497217-26a37887c187?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&h=675&fit=crop&q=80',
  ],
  biology: [
    'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1582719471137-c3967fc0e0c8?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1559757143-5c350d0d3c56?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1200&h=675&fit=crop&q=80',
  ],
  chemistry: [
    'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1582719471137-c3967fc0e0c8?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=675&fit=crop&q=80',
  ],
  english: [
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519682337058-a94d519337cb?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1495446815901-a729233e8649?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524995997943-abcf9cbd066f?w=1200&h=675&fit=crop&q=80',
  ],
  history: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1461360370876-644962cb6819?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524995997943-abcf9cbd066f?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1521587760478-0c89a2d4902a?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1476231682828-5838515e2138?w=1200&h=675&fit=crop&q=80',
  ],
  economics: [
    'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509228621472-8bff35754979?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1611974789855-9c99a784fe91?w=1200&h=675&fit=crop&q=80',
  ],
  'computer-science': [
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1461742480684-dccba630e2f6?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa43?w=1200&h=675&fit=crop&q=80',
  ],
  psychology: [
    'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=675&fit=crop&q=80',
  ],
  geography: [
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1446776653964-20c1d3a81b26?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526778548025-fa2f456cd6c0?w=1200&h=675&fit=crop&q=80',
  ],
};

/** Assessment slug → subject slug (matches seed order: 5 per subject) */
const ASSESSMENTS_BY_SUBJECT = {
  mathematics: [
    'maths-foundation-practice',
    'maths-standard-verified',
    'maths-advanced-partner',
    'maths-foundation-verified',
    'maths-advanced-practice',
  ],
  physics: [
    'physics-standard-verified',
    'physics-foundation-practice',
    'physics-foundation-verified',
    'physics-standard-practice',
    'physics-advanced-partner',
  ],
  biology: [
    'biology-foundation-practice',
    'biology-foundation-verified',
    'biology-standard-practice',
    'biology-standard-verified',
    'biology-advanced-partner',
  ],
  chemistry: [
    'chemistry-foundation-practice',
    'chemistry-standard-verified',
    'chemistry-standard-practice',
    'chemistry-advanced-practice',
    'chemistry-advanced-partner',
  ],
  english: [
    'english-advanced-verified',
    'english-foundation-practice',
    'english-standard-practice',
    'english-standard-verified',
    'english-advanced-partner',
  ],
  history: [
    'history-foundation-practice',
    'history-advanced-verified',
    'history-standard-practice',
    'history-standard-verified',
    'history-advanced-partner',
  ],
  economics: [
    'economics-standard-verified',
    'economics-foundation-practice',
    'economics-foundation-verified',
    'economics-advanced-practice',
    'economics-advanced-partner',
  ],
  'computer-science': [
    'computer-science-partner',
    'computer-science-foundation-practice',
    'computer-science-standard-verified',
    'computer-science-advanced-practice',
    'computer-science-advanced-verified',
  ],
  psychology: [
    'psychology-standard-practice',
    'psychology-foundation-practice',
    'psychology-standard-verified',
    'psychology-advanced-practice',
    'psychology-advanced-partner',
  ],
  geography: [
    'geography-foundation-practice',
    'geography-advanced-verified',
    'geography-standard-practice',
    'geography-standard-verified',
    'geography-advanced-partner',
  ],
};

export { SUBJECT_POOLS, ASSESSMENTS_BY_SUBJECT };
