import { Metadata } from 'next';
import ImapDashboard from './components/imap-dashboard';

export const metadata: Metadata = {
  title: 'IMAP Sync - Dashboard',
  description: 'Synchronize emails between IMAP servers',
};

export default function ImapPage() {
  return <ImapDashboard />;
}
