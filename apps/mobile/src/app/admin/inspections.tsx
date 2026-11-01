import { AdminRecordsPage } from '../../components/adminRecordsPage';
import { MOBILE_API_ENDPOINTS } from '../../constants';
import type { AdminInspectionFeed } from '../../models';
import { mapInspectionRecords } from '../../utils/adminRecordMapper';

export default function AdminInspectionsPage() {
  return <AdminRecordsPage<{ inspections: AdminInspectionFeed[] }> title="Inspection activity" activeRoute="/admin/inspections" endpoint={MOBILE_API_ENDPOINTS.adminInspections} mapData={(response) => mapInspectionRecords(response.inspections)} />;
}
