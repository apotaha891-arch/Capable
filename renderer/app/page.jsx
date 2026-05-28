export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-5xl font-bold">Capable</h1>
        <p className="mt-4 text-slate-200">
          AI-generated websites. Visit a site as <code>{'{slug}'}.{process.env.NEXT_PUBLIC_APP_DOMAIN || 'capable.app'}</code>.
        </p>
      </div>
    </main>
  );
}
