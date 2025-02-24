export default function Home() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' as const }}>
      <h1>Suporte Multiclubes API</h1>
      <p>Esta é a API do sistema Suporte Multiclubes. A interface do usuário está disponível em:</p>
      <a href="http://localhost:5173" style={{ color: 'blue', textDecoration: 'underline' }}>
        http://localhost:5173
      </a>
    </div>
  )
}
