import Dashboard from '@/components/dashboard/Dashboard';
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Federated Learning Demo'
}

export default function Home() {
  return <Dashboard />;
}