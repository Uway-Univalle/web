import { useState, useEffect } from 'react';
import api from '../../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CollegeAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [searchVehicle, setSearchVehicle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reportMessage, setReportMessage] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [userDocuments, setUserDocuments] = useState({}); // {userId: [documents]}

  const username = JSON.parse(localStorage.getItem('userData'))?.first_name || 'Administrador';
  const userCollegeId = JSON.parse(localStorage.getItem('userData'))?.college;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    window.location.href = '/login';
  };

  useEffect(() => {
    const fetchUnverifiedData = async () => {
      try {
        // Obtener usuarios no verificados
        const usersResponse = await api.get('/users/unverified/');
        const filteredUsers = usersResponse.data.filter(user => user.college === userCollegeId);
        setUsers(filteredUsers);

        // Obtener vehículos no verificados
        const vehiclesResponse = await api.get('/vehicles/unverified/');
        const filteredVehicles = vehiclesResponse.data;
        setVehicles(filteredVehicles);
      } catch (err) {
        if (err.response?.status !== 401) {
          setError('Error al cargar datos');
          console.error('Error detallado:', err.response?.data || err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUnverifiedData();
  }, [userCollegeId]);

  // Función para obtener documentos de un usuario
  const fetchUserDocuments = async (userId) => {
    try {
      const response = await api.get(`/user_documents/${userId}/`);
      setUserDocuments(prev => ({
        ...prev,
        [userId]: response.data
      }));
    } catch (err) {
      console.error('Error al obtener documentos:', err);
      setUserDocuments(prev => ({
        ...prev,
        [userId]: []
      }));
    }
  };

  // Función para manejar la descarga de documentos
  const handleDownloadDocument = (presignedUrl, fileName) => {
    const link = document.createElement('a');
    link.href = presignedUrl;
    link.setAttribute('download', fileName || 'documento');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleVerifyUser = async (userId) => {
    try {
      await api.patch(`/users/${userId}/verify/`);
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (err) {
      setError('Error al verificar el usuario');
      console.error(err);
    }
  };

  const handleVerifyVehicle = async (vehicleId) => {
    try {
      await api.patch(`/vehicles/${vehicleId}/verify/`);
      setVehicles(prev => prev.filter(vehicle => vehicle.id !== vehicleId));
    } catch (err) {
      setError('Error al verificar el vehículo');
      console.error(err);
    }
  };

  const handleDenyUser = async (userId) => {
    try {
      await api.post(`/users/${userId}/deny-users/`);
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (err) {
      setError('Error al rechazar el usuario');
      console.error(err);
    }
  };

  const handleDenyVehicle = async (vehicleId) => {
    try {
      await api.post(`/vehicles/${vehicleId}/deny/`);
      setVehicles(prev => prev.filter(vehicle => vehicle.id !== vehicleId));
    } catch (err) {
      setError('Error al rechazar el vehículo');
      console.error(err);
    }
  };

  const getUserType = (userType, passengerType) => {
    if (userType === 3) return 'Conductor';
    if (userType === 4 && passengerType === 1) return 'Pasajero (Estudiante)';
    if (userType === 4 && passengerType === 2) return 'Pasajero (Profesor)';
    return 'Usuario';
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleGenerateReport = async () => {
    if (!userCollegeId) {
      setError('No se pudo identificar la universidad');
      return;
    }

    setIsGeneratingReport(true);
    setReportMessage('');
    
    try {
      const response = await api.post(
        `/colleges/${userCollegeId}/generate-college-report/`,
        {
          start_date: formatDate(startDate),
          end_date: formatDate(endDate)
        }
      );
      
      setReportMessage('El reporte se generará y enviará por correo en breve.');
    } catch (err) {
      setError('Error al generar el reporte');
      console.error(err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const filteredUsers = users.filter(user =>
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchUser.toLowerCase()) ||
    user.email.toLowerCase().includes(searchUser.toLowerCase()) ||
    user.personal_id.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredVehicles = vehicles.filter(vehicle =>
    `${vehicle.first_name} ${vehicle.last_name}`.toLowerCase().includes(searchVehicle.toLowerCase()) ||
    vehicle.plate.toLowerCase().includes(searchVehicle.toLowerCase()) ||
    vehicle.personal_id.toLowerCase().includes(searchVehicle.toLowerCase())
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
        <p className="text-gray-600 text-sm">Panel Administrativo Universitario</p>
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

      <main className="max-w-6xl mx-auto">
        {/* Sección de generación de reportes */}
        <div className="bg-white p-6 rounded-lg shadow mb-6 col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-center">Generar Reporte</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                dateFormat="dd/MM/yyyy"
                className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de fin</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                dateFormat="dd/MM/yyyy"
                className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className={`w-full px-4 py-2 rounded-lg text-white font-medium ${isGeneratingReport ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'} transition`}
              >
                {isGeneratingReport ? 'Generando...' : 'Generar Reporte'}
              </button>
            </div>
          </div>
          {reportMessage && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              {reportMessage}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sección de usuarios */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-center">Usuarios por validar</h2>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={searchUser}
                onChange={e => setSearchUser(e.target.value)}
                className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {filteredUsers.length === 0 ? (
              <p className="text-gray-500 text-center">No hay usuarios pendientes de validación</p>
            ) : (
              <div className="border border-purple-300 rounded-lg overflow-y-auto max-h-96 p-2 divide-y divide-purple-100">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 hover:bg-purple-50 transition duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-purple-800">
                          {user.first_name} {user.last_name}
                          <span className="ml-2 text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                            {getUserType(user.user_type, user.passenger_type)}
                          </span>
                        </h3>
                        <p className="text-gray-600 text-sm">Email: {user.email}</p>
                        <p className="text-gray-600 text-sm">Documento: {user.personal_id}</p>
                        <p className="text-gray-600 text-sm">Teléfono: {user.phone}</p>
                        <p className="text-gray-600 text-sm">Código: {user.code}</p>
                        
                        {/* Botón para cargar documentos */}
                        <button
                          onClick={() => fetchUserDocuments(user.id)}
                          className="mt-2 px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
                        >
                          Mostrar documentos
                        </button>
                        
                        {/* Lista de documentos */}
                        {userDocuments[user.id] && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-500 mb-1">Documentos:</p>
                            <div className="flex flex-wrap gap-2">
                              {userDocuments[user.id].map((doc, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleDownloadDocument(doc.presigned_url, doc.url.split('/').pop())}
                                  className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
                                >
                                  Documento {index + 1}
                                </button>
                              ))}
                              {userDocuments[user.id].length === 0 && (
                                <p className="text-xs text-gray-500">No hay documentos</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex sm:flex-col gap-2">
                        <button
                          onClick={() => handleVerifyUser(user.id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-full bg-green-600 text-white hover:bg-green-700 transition"
                        >
                          Validar
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('¿Estás seguro de rechazar este usuario?')) {
                              handleDenyUser(user.id);
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-full bg-red-600 text-white hover:bg-red-700 transition"
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sección de vehículos */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-center">Vehículos por validar</h2>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar vehículos..."
                value={searchVehicle}
                onChange={e => setSearchVehicle(e.target.value)}
                className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {filteredVehicles.length === 0 ? (
              <p className="text-gray-500 text-center">No hay vehículos pendientes de validación</p>
            ) : (
              <div className="border border-purple-300 rounded-lg overflow-y-auto max-h-96 p-2 divide-y divide-purple-100">
                {filteredVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="p-4 hover:bg-purple-50 transition duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-purple-800">
                          {vehicle.first_name} {vehicle.last_name}
                          <span className="ml-2 text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                            Conductor
                          </span>
                        </h3>
                        <p className="text-gray-600 text-sm">Placa: {vehicle.plate}</p>
                        <p className="text-gray-600 text-sm">Modelo: {vehicle.model}</p>
                        <p className="text-gray-600 text-sm">Color: {vehicle.color}</p>
                        <p className="text-gray-600 text-sm">Documento: {vehicle.personal_id}</p>
                        <p className="text-gray-600 text-sm">Capacidad: {vehicle.capacity} pasajeros</p>
                      </div>
                      <div className="flex sm:flex-col gap-2">
                        <button
                          onClick={() => handleVerifyVehicle(vehicle.id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-full bg-green-600 text-white hover:bg-green-700 transition"
                        >
                          Validar
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('¿Estás seguro de rechazar este vehículo?')) {
                              handleDenyVehicle(vehicle.id);
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-full bg-red-600 text-white hover:bg-red-700 transition"
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CollegeAdminDashboard;