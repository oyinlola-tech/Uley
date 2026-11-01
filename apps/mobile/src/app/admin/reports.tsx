import { AdminRecordsPage } from '../../components/adminRecordsPage';
import { MOBILE_API_ENDPOINTS } from '../../constants';
import type { AdminReportFeed } from '../../models';
import { mapReportRecords } from '../../utils/adminRecordMapper';

export default function AdminReportsPage() {
  return <AdminRecordsPage<{ reports: AdminReportFeed[] }> title="Student reports" activeRoute="/admin/reports" endpoint={MOBILE_API_ENDPOINTS.adminReports} mapData={(response) => mapReportRecords(response.reports)} />;
}
