import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AccountDashboard from './AccountDashboard';

/**
 * /account — Protected route (server-side guard + middleware).
 *
 * Middleware already handles the redirect, but this server component
 * performs a second authoritative check so there is no flash of
 * protected content even if the middleware edge case is hit.
 */
export const metadata = {
  title: 'My Account | Bloomncharms',
  description: 'Manage your Bloomncharms profile, orders, and delivery addresses.',
};

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/account/sign-in');
  }

  // Fetch the customer's profile row.
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, role, created_at')
    .eq('id', user.id)
    .single();

  return <AccountDashboard user={user} profile={profile} />;
}
