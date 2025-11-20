import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-blue-400 to-white px-4 py-8">
      <div className="w-full max-w-md bg-white/90 rounded-3xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="text-6xl font-bold text-gray-800 mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Page non trouvée</h1>
          <p className="text-gray-600 mb-6">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="block w-full px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold shadow hover:scale-105 transition-transform"
          >
            Retour
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Si vous pensez qu'il s'agit d'une erreur, contactez l'administrateur.
          </p>
        </div>
      </div>
    </main>
  );
}