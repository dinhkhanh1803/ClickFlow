import Link from 'next/link';

export default function RegisterPage() {
  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-4 py-8 text-slate-100">
    <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.24),_transparent_36%),radial-gradient(circle_at_bottom_left,_rgba(139,92,246,0.15),_transparent_32%)]" />
    <section className="relative w-full max-w-xl rounded-[28px] border border-slate-800 bg-slate-900/85 p-7 text-center shadow-2xl shadow-black/35 backdrop-blur sm:p-10">
      <div className="mx-auto flex w-fit items-center gap-2 text-sm font-semibold text-indigo-300"><span className="grid size-7 place-items-center rounded-lg bg-indigo-500 text-xs text-white">CF</span>ClickFlow</div>
      <p className="mt-8 text-sm font-medium text-indigo-300">Private access</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Registration is currently disabled.</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">Use a seeded account provided by the workspace owner to sign in.</p>
      <Link href="/login" className="mt-7 inline-flex h-11 items-center justify-center rounded-lg bg-indigo-500 px-5 text-sm font-semibold text-white transition hover:bg-indigo-400">Back to sign in</Link>
    </section>
  </main>;
}
