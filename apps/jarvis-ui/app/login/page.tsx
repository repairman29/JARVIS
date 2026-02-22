import { LoginForm } from './LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ session_expired?: string }>;
}) {
  const params = await searchParams;
  const sessionExpired = params?.session_expired === '1';
  return <LoginForm sessionExpired={sessionExpired} />;
}
