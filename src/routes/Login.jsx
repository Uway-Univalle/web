import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ShieldCheck } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/login/', formData);
      const { access, refresh, user } = response.data;
      localStorage.setItem('authToken', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('userData', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err) {
      setError('Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#8A20A7] flex flex-col">
      {/* Header */}
      <header className="bg-[#8A20A7] text-white p-4 text-lg font-semibold">
        Ugüee
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col md:flex-row justify-center items-center px-8 py-16 gap-40">
        {/* Izquierda: Logo */}
        <div className="text-center md:text-left">
          <h1 className="text-9xl font-extrabold mb-4">Ugüee</h1>
          <button className="mt-4 px-4 py-2 border-2 border-purple-600 rounded-full flex items-center gap-2 hover:bg-purple-50 m-auto">
            Muévete seguro
              <ShieldCheck />
          </button>
        </div>

        {/* Derecha: Formulario */}
        <div className="w-full max-w-md border border-purple-500 rounded-md p-6">
          <h2 className="text-xl font-semibold mb-4">Inicia sesión</h2>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm mb-1">Usuario</label>
              <input
                type="text"
                name="username"
                id="username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="Ingresa tu usuario"
                className="w-full border border-purple-300 rounded px-3 py-2 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm mb-1">Contraseña</label>
              <input
                type="password"
                name="password"
                id="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="Ingresa tu contraseña"
                className="w-full border border-purple-300 rounded px-3 py-2 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 rounded-md bg-[#8A20A7] text-white font-semibold hover:bg-[#8A20A7] transition"
            >
              {isLoading ? "Iniciando..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="mt-4 text-sm text-center">
            ¿No tienes una cuenta?{" "}
            <a href="/" className="text-[#8A20A7] underline hover:text-purple-800">
              Vuelve a la página de inicio
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
