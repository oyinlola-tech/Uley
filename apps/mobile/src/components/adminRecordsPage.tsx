import { Text } from 'react-native';
import { useAdminResource } from '../hooks/useAdminResource';
import type { AdminRecord } from '../models';
import { useMobileTheme } from '../theme';
import { AdminRecordList } from './adminRecordList';
import { AdminShell } from './adminShell';

export function AdminRecordsPage<TData>({ title, activeRoute, endpoint, mapData }: { title: string; activeRoute: string; endpoint: string; mapData: (data: TData) => AdminRecord[] }) {
  const { data, error, isLoading, reload } = useAdminResource<TData>(endpoint);
  const { colors } = useMobileTheme();
  return <AdminShell title={title} activeRoute={activeRoute}><Text style={{ marginBottom: 13, color: colors.muted, fontSize: 11 }}>Records are live from the Uley admin service. Decisions are audited against your administrator account.</Text><AdminRecordList records={data ? mapData(data) : []} loading={isLoading} error={error} onRefresh={reload} /></AdminShell>;
}
