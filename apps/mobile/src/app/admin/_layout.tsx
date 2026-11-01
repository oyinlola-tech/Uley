import { router, Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useUleyAuth } from '../../auth/AuthProvider';
import { ADMIN_MOBILE_NAVIGATION } from '../../constants';
import { AccountRole } from '../../enums';

const administratorRoles = [AccountRole.SCHOOL_ADMIN, AccountRole.SUPER_ADMIN, AccountRole.VERIFICATION_ADMIN, AccountRole.SAFETY_ADMIN, AccountRole.INSPECTION_ADMIN, AccountRole.ACCOUNT_ADMIN];

export default function AdminLayout() {
  const { account, isRestoringSession } = useUleyAuth();
  const pathname = usePathname();
  useEffect(() => {
    if (isRestoringSession) return;
    if (!account) router.replace('/login');
    else if (!administratorRoles.includes(account.userRole)) router.replace('/account');
    else if (!ADMIN_MOBILE_NAVIGATION.some((link) => link.route === pathname && (link.roles as readonly AccountRole[]).includes(account.userRole))) router.replace('/admin');
  }, [account, isRestoringSession, pathname]);
  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
