import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FaBus, FaMapMarkerAlt, FaSearch, FaSignOutAlt } from 'react-icons/fa';

const PassengerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userData = JSON.parse(localStorage.getItem('userData'));
  const username = userData?.first_name || 'Pasajero';

  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await api.get('/trips/');
        setTrips(response.data);
        setFilteredTrips(response.data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar viajes disponibles');
        console.error(err);
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTrips(trips);
    } else {
      const filtered = trips.filter(trip => 
        trip.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.route.toString().includes(searchTerm)
      );
      setFilteredTrips(filtered);
    }
  }, [searchTerm, trips]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    window.location.href = '/login';
  };

  const handleJoinTrip = async (tripId) => {
    try {
      alert(`Te has unido al viaje ${tripId}`);
      const response = await api.get('/trips/');
      setTrips(response.data);
      setFilteredTrips(response.data);
    } catch (err) {
      setError('Error al unirse al viaje');
      console.error(err);
    }
  };

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-purple-700 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Ugüee - Panel del Pasajero</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Bienvenido, <strong>{username}</strong></span>
            <button
              onClick={handleLogout}
              className="flex items-center text-sm bg-red-500 hover:bg-red-600 px-3 py-1 rounded-full"
            >
              <FaSignOutAlt className="mr-1" /> Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="container mx-auto p-4">
        {/* Barra de búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar viajes por fecha, estado o ruta..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Listado de viajes */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Viajes Disponibles</h2>
            <p className="text-sm text-gray-500">
              {filteredTrips.length} viajes encontrados
            </p>
          </div>

          {filteredTrips.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No se encontraron viajes disponibles
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTrips.map(trip => (
                <div 
                  key={trip.id} 
                  className={`p-6 hover:bg-gray-50 transition-colors ${selectedTrip?.id === trip.id ? 'bg-purple-50' : ''}`}
                  onClick={() => setSelectedTrip(trip)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="bg-purple-100 p-3 rounded-full">
                        <FaBus className="text-purple-600 text-xl" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Viaje #{trip.id} - {new Date(trip.date).toLocaleDateString()}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${trip.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                              trip.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'}`}>
                            {trip.status}
                          </span>
                        </p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <FaMapMarkerAlt className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <p>Ruta: {trip.route}</p>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Horario: {trip.start_time} - {trip.end_time}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinTrip(trip.id);
                      }}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Unirse
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detalle del viaje seleccionado */}
        {selectedTrip && (
          <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Detalles del Viaje</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Información General</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">ID del Viaje</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTrip.id}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Fecha</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(selectedTrip.date).toLocaleDateString()}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Horario</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedTrip.start_time} - {selectedTrip.end_time}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Estado</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${selectedTrip.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                            selectedTrip.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                          {selectedTrip.status}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Detalles Adicionales</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Ruta</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTrip.route}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Conductor</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTrip.driver}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Vehículo</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTrip.vehicle}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleJoinTrip(selectedTrip.id)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Unirse a este viaje
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PassengerDashboard;