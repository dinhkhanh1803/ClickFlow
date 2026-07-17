import { CheckCircle2, Sparkles } from 'lucide-react';
import { LoginForm } from '@/features/auth/components/login-form';

const productPoints = ['Organize work across Spaces and projects', 'Turn priorities into focused next actions', 'Keep delivery, time and progress in one view'];

export default function LoginPage() {
  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-4 py-8 text-slate-100 sm:p-8">
    <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.22),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(139,92,246,0.14),_transparent_32%)]" />
    <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-black/35 backdrop-blur md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <div className="p-7 sm:p-10 lg:p-12">
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300"><span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-500 text-xs text-white">CF</span>ClickFlow</div>
        <div className="mt-10 max-w-sm"><p className="text-sm font-medium text-indigo-300">Welcome back</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Work with more clarity.</h1><p className="mt-3 text-sm leading-6 text-slate-400">Sign in to continue planning, tracking and delivering with your team.</p></div>
        <div className="mt-9 max-w-sm"><LoginForm /><p className="mt-6 text-center text-sm text-slate-400">Forgot password? <a href="/forgot-password" className="font-medium text-indigo-300 transition hover:text-indigo-200">Reset it</a></p></div>
      </div>
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 p-12 md:block">
        <div aria-hidden="true" className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/25 bg-white/10" /><div aria-hidden="true" className="absolute -bottom-28 left-16 h-72 w-72 rounded-full border border-white/20 bg-slate-950/10" />
        <div className="relative flex h-full flex-col justify-between"><div><span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90"><Sparkles size={14} />ClickFlow workspace</span><h2 className="mt-7 max-w-md text-4xl font-bold leading-tight tracking-tight text-white">Plan clearly.<br />Deliver confidently.</h2><p className="mt-5 max-w-sm text-base leading-7 text-indigo-50/90">One focused place for the projects, tasks and time that move work forward.</p></div><ul className="space-y-4">{productPoints.map((point) => <li key={point} className="flex items-center gap-3 text-sm font-medium text-white"><span className="grid h-7 w-7 place-items-center rounded-full bg-white/15"><CheckCircle2 size={16} /></span>{point}</li>)}</ul></div>
      </aside>
    </section>
  </main>;
}