import { useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage, translateMessage } from '../lib/i18n'
import { EyeIcon, EyeOffIcon, GitHubIcon, GoogleIcon, LockIcon, MailIcon, UserIcon } from '../ui/icons'
import { Logo } from '../ui/Logo'
import { useAuth } from './context'

type Mode = 'login' | 'register'

const YEAR = new Date().getFullYear()

export function AuthPage({ mode }: { mode: Mode }) {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  const isRegister = mode === 'register'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const key = isRegister ? await register({ email, password, displayName }) : await login({ email, password })
      toast.success(key ? translateMessage(key) : t(isRegister ? 'registerSuccess' : 'loginSuccess'))
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-gradient-to-b from-white via-indigo-50/40 to-indigo-100/70 dark:from-night-950 dark:via-night-950 dark:to-night-900">
      <Waves />

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Logo size={56} />
          <h1 className="text-4xl font-bold tracking-tight">LLM Chat</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('tagline')}</p>
        </div>

        <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-indigo-900/5 backdrop-blur dark:border-night-700 dark:bg-night-850/80 dark:shadow-black/30">
          <h2 className="mb-5 text-lg font-semibold">{t(isRegister ? 'registerTitle' : 'loginTitle')}</h2>

          <form onSubmit={onSubmit} className="space-y-3">
            {isRegister && (
              <Field icon={<UserIcon size={16} />}>
                <input
                  className={inputClass}
                  placeholder={t('displayName')}
                  aria-label={t('displayName')}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  maxLength={50}
                  autoComplete="name"
                  autoFocus
                />
              </Field>
            )}
            <Field icon={<MailIcon size={16} />}>
              <input
                className={inputClass}
                type="email"
                placeholder={t('emailPlaceholder')}
                aria-label={t('email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus={!isRegister}
              />
            </Field>
            <Field
              icon={<LockIcon size={16} />}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="rounded-md p-1 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label={t(showPassword ? 'hidePassword' : 'showPassword')}
                >
                  {showPassword ? <EyeIcon size={16} /> : <EyeOffIcon size={16} />}
                </button>
              }
            >
              <input
                className={`${inputClass} pr-10`}
                type={showPassword ? 'text' : 'password'}
                placeholder={t(isRegister ? 'passwordPlaceholderRegister' : 'passwordPlaceholder')}
                aria-label={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isRegister ? 8 : undefined}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            </Field>

            {!isRegister && (
              <div className="flex justify-end pt-1 text-sm">
                <span className="cursor-not-allowed text-indigo-500/70" title={t('notSupported')}>
                  {t('forgotPassword')}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 w-full rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-violet-600 disabled:opacity-60"
            >
              {t(submitting ? 'submitting' : isRegister ? 'register' : 'login')}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200 dark:bg-night-700" />
            {t(isRegister ? 'orRegisterWith' : 'orLoginWith')}
            <span className="h-px flex-1 bg-slate-200 dark:bg-night-700" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <OAuthButton icon={<GoogleIcon size={16} />} label="Google" />
            <OAuthButton icon={<GitHubIcon size={16} />} label="GitHub" />
          </div>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {t(isRegister ? 'hasAccount' : 'noAccount')}
            <Link
              to={isRegister ? '/login' : '/register'}
              className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {t(isRegister ? 'login' : 'registerNow')}
            </Link>
          </p>
        </div>
      </div>

      <p className="relative pb-6 text-center text-xs text-slate-400 dark:text-slate-500">
        {t('copyright', { year: YEAR })}
      </p>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-3 pl-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-night-700 dark:bg-night-900 dark:placeholder:text-slate-500'

function Field({ icon, trailing, children }: { icon: ReactNode; trailing?: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400">{icon}</span>
      {children}
      {trailing && <span className="absolute top-1/2 right-2 -translate-y-1/2">{trailing}</span>}
    </div>
  )
}

// Backend chưa có OAuth nên nút chỉ để hiển thị
function OAuthButton({ icon, label }: { icon: ReactNode; label: string }) {
  const { t } = useTranslation('auth')
  return (
    <button
      type="button"
      disabled
      title={t('notSupported')}
      className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed dark:border-night-700 dark:bg-night-900 dark:text-slate-200"
    >
      {icon}
      {label}
    </button>
  )
}

function Waves() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] w-full text-indigo-300 dark:text-indigo-500"
      viewBox="0 0 1440 400"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path fill="currentColor" fillOpacity="0.18" d="M0 220C240 140 480 120 720 180s480 140 720 40v180H0Z" />
      <path fill="currentColor" fillOpacity="0.14" d="M0 280c260-90 520-60 760 0s460 60 680-40v160H0Z" />
      <path fill="currentColor" fillOpacity="0.1" d="M0 330c300-50 560-20 820 20s420 20 620-30v80H0Z" />
    </svg>
  )
}
