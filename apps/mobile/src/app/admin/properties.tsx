import { AdminRecordsPage } from '../../components/adminRecordsPage';
import { MOBILE_API_ENDPOINTS } from '../../constants';
import type { AdminPropertyFeed } from '../../models';
import { mapPropertyRecords } from '../../utils/adminRecordMapper';

export default function AdminPropertiesPage() {
  return <AdminRecordsPage<{ properties: AdminPropertyFeed[] }> title="Listing safety" activeRoute="/admin/properties" endpoint={MOBILE_API_ENDPOINTS.adminProperties} mapData={(response) => mapPropertyRecords(response.properties)} />;
}
