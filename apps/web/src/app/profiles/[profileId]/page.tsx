import { PublicProfileWorkspace } from '@/components/publicProfileWorkspace';
export default async function ProfilePage({ params }: { params: Promise<{ profileId: string }> }) { const { profileId } = await params; return <PublicProfileWorkspace profileId={profileId} />; }
