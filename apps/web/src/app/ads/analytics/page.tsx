import { AdsWorkspace } from '@/components/adsWorkspace';
import { ProductGuideFrame } from '@/components/productGuideFrame';

export default function AdsAnalyticsPage() {
  return <ProductGuideFrame><AdsWorkspace analyticsOnly /></ProductGuideFrame>;
}
