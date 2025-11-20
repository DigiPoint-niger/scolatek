export default function AdminNav({ current }) {
  return (
    <nav className="flex gap-4 mb-8 justify-center">
      <a href="/admin/" className={current === 'home' ? 'font-bold text-blue-700 underline' : 'text-blue-700'}>Accueile</a>
      <a href="/admin/schools" className={current === 'schools' ? 'font-bold text-blue-700 underline' : 'text-blue-700'}>Ecoles</a>
      <a href="/admin/" className={current === '' ? 'font-bold text-blue-700 underline' : 'text-blue-700'}>Abonnements</a>
      <a href="/admin/" className={current === '' ? 'font-bold text-blue-700 underline' : 'text-blue-700'}>Utilisateurs</a>
      <a href="/admin/" className={current === '' ? 'font-bold text-blue-700 underline' : 'text-blue-700'}>Publicités</a>

    </nav>
  );
}
