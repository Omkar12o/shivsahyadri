/**
 * Full-screen authentication/boot loading screen.
 * Rendered while the Supabase session is being restored so the website
 * content is NEVER flashed to an unauthenticated user.
 */
export default function AuthLoadingScreen({ text = 'Checking session…' }: { text?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream px-6">
      <div className="w-20 h-20 rounded-3xl gradient-saffron flex items-center justify-center shadow-lg shadow-saffron/30">
        <div className="animate-spin rounded-full h-9 w-9 border-4 border-white/40 border-t-white"></div>
      </div>
      <p className="mt-5 text-sm font-medium text-gray-500">{text}</p>
      <p className="mt-1 text-xs text-gray-400">🙏 गणपती बाप्पा मोरया</p>
    </div>
  )
}