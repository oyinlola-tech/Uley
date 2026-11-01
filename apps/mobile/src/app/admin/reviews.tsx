import { AdminRecordsPage } from '../../components/adminRecordsPage';
import { MOBILE_API_ENDPOINTS } from '../../constants';
import type { AdminVerificationFeed } from '../../models';
import { mapPendingVerificationRecords } from '../../utils/adminRecordMapper';

export default function AdminReviewsPage() {
  return <AdminRecordsPage<AdminVerificationFeed> title="Verification desk" activeRoute="/admin/reviews" endpoint={MOBILE_API_ENDPOINTS.adminPendingReviews} mapData={mapPendingVerificationRecords} />;
}
