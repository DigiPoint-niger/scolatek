export default function DirectorNav({ current }) {
  return (
    <nav className="flex gap-4 mb-8 justify-center">
      <a href="/director/" className={current === 'home' ? 'font-bold text-blue-700 underline' : 'text-blue-700'}>Accueile</a>
      <a href="/director/" className={current === '' ? 'font-bold text-blue-700 underline' : 'text-blue-700'}>Enseignants</a>
      <a href="/director/" className={current === '' ? 'font-bold text-blue-700 underline' : 'text-blue-700'}>Elèves</a>
      <a href="/director/" className={current === '' ? 'font-bold text-blue-700 underline' : 'text-blue-700'}>Inscriptions</a>
      <a href="/director/" className={current === '' ? 'font-bold text-blue-700 underline' : 'text-blue-700'}>Staff</a>
      <a href="/director/" className={current === '' ? 'font-bold text-blue-700 underline' : 'text-blue-700'}>Emploi</a>
      <a href="/director/" className={current === '' ? 'font-bold text-blue-700 underline' : 'text-blue-700'}></a>
    </nav>
  );
}
