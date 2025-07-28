import { useState, useEffect } from 'react';
import api from '../../services/api';

const SystemAdminDashboard = () => {
  const [institutions, setInstitutions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const username = JSON.parse(localStorage.getItem('userData'))?.first_name || 'Administrador';

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    window.location.href = '/login';
  };

  useEffect(() => {
    const fetchUnverifiedColleges = async () => {
      try {
        const response = await api.get('/colleges/unverified/');
        setInstitutions(response.data);
      } catch (err) {
        if (err.response?.status !== 401) {
          setError('Error al cargar instituciones');
          console.error('Error detallado:', err.response?.data || err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUnverifiedColleges();
  }, []);

  const handleVerifyCollege = async (collegeId) => {
    try {
      await api.post(`/colleges/${collegeId}/verify/`);
      setInstitutions(prev => prev.filter(college => college.college_id !== collegeId));
    } catch (err) {
      setError('Error al verificar la institución');
      console.error(err);
    }
  };

  const filteredInstitutions = institutions.filter(college =>
    college.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-purple-700">Ugüee</h1>
        <p className="text-gray-600 text-sm">Panel Administrativo</p>
        <div className="mt-4 flex justify-center items-center gap-4">
          <span className="text-sm text-gray-700">Bienvenido, <strong>{username}</strong></span>
          <button
            onClick={handleLogout}
            className="text-sm text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-full"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-center">Instituciones por validar</h2>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar universidad..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {filteredInstitutions.length === 0 ? (
          <p className="text-gray-500 text-center">No hay instituciones pendientes de validación</p>
        ) : (
          <div className="border border-purple-300 rounded-lg overflow-y-auto max-h-96 p-2 divide-y divide-purple-100">
            {filteredInstitutions.slice(0, 5).map((college) => (
              <div key={college.college_id} className="p-4 hover:bg-purple-50 transition duration-150">
                <div className="flex items-start gap-4">
                  {college.logo && (
                    <img
                      src={college.logo}
                      alt={`Logo de ${college.name}`}
                      className="h-12 w-12 object-contain"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-purple-800">{college.name}</h3>
                    <p className="text-gray-600 text-sm">{college.address}</p>
                    <p className="text-purple-600 text-sm">{college.email}</p>
                  </div>
                  <button
                    onClick={() => handleVerifyCollege(college.college_id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-full bg-green-600 text-white hover:bg-green-700 transition"
                  >
                    Validar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SystemAdminDashboard;
