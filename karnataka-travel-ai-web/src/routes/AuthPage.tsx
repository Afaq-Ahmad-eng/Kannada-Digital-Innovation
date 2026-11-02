import { AuthForm } from '../features/auth/components/AuthForm';

/** Hero: the Kannada word for journey, with a route line that climbs through the Ghats. */
export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative flex flex-col justify-end overflow-hidden bg-ghats-800 p-8 text-sandal-50 sm:p-12 lg:min-h-screen" aria-label="About Yatre">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 700" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <path d="M0 520 L120 380 L210 470 L330 280 L450 430 L600 330 L600 700 L0 700Z" fill="#0c5640" />
          <path d="M0 600 L150 470 L260 560 L400 400 L520 520 L600 470 L600 700 L0 700Z" fill="#0f6b4f" />
          <path d="M40 650 C140 560 180 600 260 520 S380 400 430 330 S520 250 560 170" fill="none" stroke="#e9b94d" strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" />
          <circle cx="560" cy="170" r="9" fill="#e9b94d" />
        </svg>
        <div className="relative max-w-md">
          <p className="font-display text-7xl font-bold leading-none sm:text-8xl" lang="kn">ಯಾತ್ರೆ</p>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-sandal-50 sm:text-4xl">Plan Karnataka trips that adapt when the road or the weather does not cooperate.</h1>
          <p className="mt-4 text-base text-sandal-200">Heritage, hills and coast, with live alerts, one-tap reroutes and a phrasebook that speaks Kannada for you.</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <h2 className="mb-6 font-display text-3xl font-bold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <AuthForm mode={mode} />
        </div>
      </section>
    </div>
  );
}
