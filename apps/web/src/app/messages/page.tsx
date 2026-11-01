import { MessagesWorkspace } from '@/components/messagesWorkspace';
import { Suspense } from 'react';
export default function MessagesPage() { return <Suspense fallback={<main aria-busy="true">Loading messages…</main>}><MessagesWorkspace /></Suspense>; }
