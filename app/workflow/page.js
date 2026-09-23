import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Workflows — Mgp Studio (Môguô Puissant)',
};

export default function WorkflowIndexPage() {
  redirect('/studio/workflows');
}
