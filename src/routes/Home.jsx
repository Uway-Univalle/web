import "../index.css";

function App() {
  return (
    <div className="min-h-screen bg-white text-[#8A20A7] flex flex-col">
      {/* Navbar */}
      <header className="bg-[#8A20A7] text-white p-4 text-lg font-semibold lg:mb-5">
        Ugüee
      </header>

      <main className="flex-1 flex flex-col md:flex-row justify-center items-center px-8 py-20 gap-40">
        <div className="text-center md:text-left">
          <h1 className="text-6xl font-extrabold mb-4 underline decoration-blue-500">Ugüee</h1>
          <button className="mt-4 px-4 py-2 border-2 border-purple-600 rounded-full flex items-center gap-2 hover:bg-purple-50">
            Muévete seguro
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 mt-12 md:mt-0">
          <a href="/register-driver">
            <button className="bg-[#8A20A7] text-white font-semibold py-2 px-6 rounded-md w-56 hover:bg-[#8A20A7]">
              Sé un conductor
            </button>
          </a>
          <a href="/register-user">
            <button className="bg-[#8A20A7] text-white font-semibold py-2 px-6 rounded-md w-56 hover:bg-[#8A20A7]">
              ¡Viaja con nosotros!
            </button>
          </a>
          <a href="login" className="mt-2 text-sm text-[#8A20A7] underline">
            Ya tienes una cuenta? Inicia sesión
          </a>
        </div>
      </main>
    </div>
  );
}

export default App;