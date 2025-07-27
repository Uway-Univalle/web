import { useState, useEffect } from 'react';
import api from '../../services/api';

const SystemAdminDashboard = () => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener instituciones no verificadas
  useEffect(() => {
    const fetchUnverifiedColleges = async () => {
      try {
        const response = await api.get('/colleges/unverified/');
        setInstitutions(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          // El interceptor ya maneja el 401, no necesitas hacer nada aquí
        } else {
          setError('Error al cargar instituciones');
          console.error('Error detallado:', err.response?.data || err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUnverifiedColleges();
  }, []);

  // Función para verificar una institución
  const handleVerifyCollege = async (collegeId) => {
    try {
      await api.post(`/colleges/${collegeId}/verify/`);
      
      // Actualizar lista local eliminando la institución verificada
      setInstitutions(prev => prev.filter(college => college.college_id !== collegeId));
      
    } catch (err) {
      setError('Error al verificar la institución');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Administración de Instituciones</h1>
      <h2 className="text-xl font-semibold mb-4">Instituciones por validar</h2>
      
      {institutions.length === 0 ? (
        <p className="text-gray-500">No hay instituciones pendientes de validación</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {institutions.map((college) => (
            <div key={college.college_id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{college.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{college.address}</p>
                  <p className="text-blue-600 text-sm mt-1">{college.email}</p>
                </div>
                {college.logo && (
                  <img 
                    src={college.logo} 
                    alt={`Logo de ${college.name}`} 
                    className="h-12 w-12 object-contain"
                  />
                )}
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleVerifyCollege(college.college_id)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Validar Institución
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SystemAdminDashboard;