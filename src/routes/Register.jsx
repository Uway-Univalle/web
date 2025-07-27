import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { USER_TYPES, PASSENGER_TYPES } from '../constants';

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    personal_id: '',
    email: '',
    password: '',
    address: '',
    phone: '',
    code: '',
    college: '',
    user_type: USER_TYPES.PASSENGER,
    passenger_type: ''
  });

  const [colleges, setColleges] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingColleges, setIsLoadingColleges] = useState(true);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    const requiredFields = [
      'first_name', 'last_name', 'personal_id', 'email', 
      'password', 'address', 'phone', 'code', 'college', 'passenger_type'
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`El campo ${field.replace('_', ' ')} es requerido`);
        return false;
      }
    }

    if (!validateEmail(formData.email)) {
      setError('Por favor ingresa un correo electrónico válido');
      return false;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await api.post('/users/', {
        ...formData,
        username: `${formData.first_name}${formData.last_name}`.toLowerCase(),
        college: Number(formData.college),
        passenger_type: Number(formData.passenger_type),
        attachments: []
      });

      if (response.status === 201) {
        alert('Registro exitoso. Ahora puedes iniciar sesión.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error en el registro:', error);
      
      if (error.response) {
        if (error.response.data) {
          const backendErrors = error.response.data;
          if (typeof backendErrors === 'object') {
            const firstError = Object.values(backendErrors)[0];
            setError(Array.isArray(firstError) ? firstError[0] : firstError);
          } else {
            setError(backendErrors.message || 'Error en el registro');
          }
        } else {
          setError('Error en el servidor. Por favor intenta nuevamente.');
        }
      } else if (error.request) {
        setError('No se pudo conectar al servidor. Verifica tu conexión a internet.');
      } else {
        setError('Error al configurar la solicitud.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await api.get('/colleges/');
        if (response.data) {
          setColleges(response.data);
        }
      } catch (error) {
        console.error('Error al obtener universidades:', error);
        setError('No se pudieron cargar las universidades');
      } finally {
        setIsLoadingColleges(false);
      }
    };

    fetchColleges();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Volver
        </button>

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Registro en Ugüee</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Documento de identidad *</label>
            <input
              type="text"
              name="personal_id"
              value={formData.personal_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                minLength="6"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código de estudiante *</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Universidad *</label>
              {isLoadingColleges ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 animate-pulse">
                  Cargando universidades...
                </div>
              ) : (
                <select
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="" disabled>Selecciona una universidad</option>
                  {colleges.map(college => (
                    <option key={`college-${college.college_id}`} value={college.college_id}>
                      {college.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de pasajero *</label>
              <select
                name="passenger_type"
                value={formData.passenger_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="" disabled>Selecciona una opción</option>
                <option value={PASSENGER_TYPES.STUDENT}>Estudiante</option>
                <option value={PASSENGER_TYPES.PROFESSOR}>Profesor</option>
                <option value={PASSENGER_TYPES.STAFF}>Administrativo</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading || isLoadingColleges}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isLoading || isLoadingColleges ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registrando...
                </>
              ) : 'Registrarse'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <button 
            onClick={() => navigate('/login')}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            ¿Ya tienes una cuenta? Inicia sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;