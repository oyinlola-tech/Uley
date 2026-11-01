import { AdminRecordsPage } from '../../components/adminRecordsPage';
import { MOBILE_API_ENDPOINTS } from '../../constants';
import type { AdminAccountFeed } from '../../models';
import { mapAccountRecords } from '../../utils/adminRecordMapper';

export default function AdminAccountsPage() {
  return <AdminRecordsPage<{ accounts: AdminAccountFeed[] }> title="Account directory" activeRoute="/admin/accounts" endpoint={MOBILE_API_ENDPOINTS.adminAccounts} mapData={(response) => mapAccountRecords(response.accounts)} />;
}
