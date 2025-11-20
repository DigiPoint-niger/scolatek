
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-400 via-blue-400 to-white px-4 py-8">
      <div className="flex flex-col items-center gap-6 w-full max-w-xl bg-white/80 rounded-3xl shadow-xl p-8">
        <Image
          src="/logo_scolatek.png"
          alt="Logo ScolaTek"
          width={120}
          height={120}
          className="mb-2 drop-shadow-lg"
          priority
        />
        <p className="text-lg text-gray-700 text-center max-w-md">
          Gérez votre école facilement avec ScolaTek, la solution SaaS moderne et sécurisée pour la gestion scolaire. Simplifiez l'administration, la communication et la réussite de votre établissement.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full justify-center">
          <a
            href="/login"
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold text-center shadow hover:scale-105 transition-transform"
          >
            Se connecter
          </a>
          <a
            href="/register"
            className="flex-1 px-6 py-3 rounded-xl border-2 border-blue-500 text-blue-700 font-semibold text-center bg-white shadow hover:bg-blue-50 hover:scale-105 transition-transform"
          >
            Créer un compte
          </a>
        </div>
      </div>
      <footer className="mt-12 text-gray-500 text-sm text-center">
        © {new Date().getFullYear()} DigiPoint. Tous droits réservés.
      </footer>
    </main>
  );
}
