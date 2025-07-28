import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaCar, FaRoute, FaMapMarkerAlt, FaCompass, FaSignOutAlt } from 'react-icons/fa';

// Constantes para tipos y categorías de vehículos
const VEHICLE_TYPES = {
  VAN: 1,
  BIKE: 2,
  BUS: 3,
  CAR: 4,
  SKATEBOARD: 5,
  TRYCICLE: 6,
};

const VEHICLE_CATEGORIES = {
  METROPOLITAN: 1,
  CAMPUS: 2,
  INTERMUNICIPAL: 3,
};

// Configuración de iconos para Leaflet
const iconRetina = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const icon = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const shadow = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: shadow,
});

const DriverDashboard = () => {
  // Estados generales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('trips');
  const userData = JSON.parse(localStorage.getItem('userData'));
  const username = userData?.first_name || 'Conductor';
  const userId = userData?.id;

  // Estados para vehículos
  const [vehicles, setVehicles] = useState([]);
  const [newVehicle, setNewVehicle] = useState({
    capacity: '',
    brand: '',
    plate: '',
    tecnicomecanica_date: '',
    soat_date: '',
    vehicle_type: '',
    vehicle_category: ''
  });

  // Estados para viajes
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [newTrip, setNewTrip] = useState({
    date: '',
    route: '',
    vehicle: ''
  });

  // Estados para el mapa y rutas
  const [points, setPoints] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [routeName, setRouteName] = useState('');
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [shouldFollow, setShouldFollow] = useState(true);
  
  // Referencias
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(L.layerGroup());
  const routeLayer = useRef(L.layerGroup());

  // Inicializar mapa
  useEffect(() => {
    if (activeTab === 'routes' && drawing && !mapInstance.current && mapContainerRef.current) {
      mapInstance.current = L.map(mapContainerRef.current).setView(
        currentLocation ? [currentLocation.latitude, currentLocation.longitude] : [4.6097, -74.0817],
        13
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance.current);

      markersLayer.current.addTo(mapInstance.current);
      routeLayer.current.addTo(mapInstance.current);

      mapInstance.current.on('click', (e) => {
        if (drawing) {
          const newPoint = {
            latitude: e.latlng.lat,
            longitude: e.latlng.lng
          };
          setPoints(prev => [...prev, newPoint]);
          setShouldFollow(false);
        }
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.off();
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [activeTab, drawing]);

  // Actualizar marcadores
  useEffect(() => {
    if (!mapInstance.current) return;

    markersLayer.current.clearLayers();
    
    points.forEach((point, idx) => {
      L.marker([point.latitude, point.longitude], {
        icon: L.divIcon({
          html: `<div class="relative">
                   <div class="text-purple-500 text-2xl">📍</div>
                   <span class="absolute top-0 right-0 bg-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                     ${idx + 1}
                   </span>
                 </div>`,
          className: 'bg-transparent border-none'
        })
      })
      .on('click', () => setPoints(points.filter((_, i) => i !== idx)))
      .addTo(markersLayer.current);
    });

    if (currentLocation) {
      L.marker([currentLocation.latitude, currentLocation.longitude], {
        icon: L.divIcon({
          html: '<div class="text-red-500 text-2xl">📍</div>',
          className: 'bg-transparent border-none'
        })
      }).addTo(markersLayer.current);
    }
  }, [points, currentLocation]);

  // Actualizar ruta optimizada
  useEffect(() => {
    if (!mapInstance.current || optimizedRoute.length < 2) return;

    routeLayer.current.clearLayers();
    const latLngs = optimizedRoute.map(point => [point.latitude, point.longitude]);
    L.polyline(latLngs, { color: '#7C3AED', weight: 4 }).addTo(routeLayer.current);
  }, [optimizedRoute]);

  // Seguir ubicación
  useEffect(() => {
    if (!mapInstance.current || !currentLocation || !shouldFollow) return;
    mapInstance.current.setView([currentLocation.latitude, currentLocation.longitude], 13);
  }, [currentLocation, shouldFollow]);

  // Obtener ubicación
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (err) => console.error('Error getting location:', err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesRes, tripsRes, routesRes] = await Promise.all([
          api.get('/vehicles/'),
          api.get('/trips/'),
          api.get('/routes/')
        ]);
        
        // Filtrar vehículos por user_id igual al id del usuario
        const userVehicles = vehiclesRes.data.filter(vehicle => vehicle.user_id === userId);
        setVehicles(userVehicles);
        
        // Filtrar viajes por driver igual al id del usuario
        const userTrips = tripsRes.data.filter(trip => trip.driver === userId);
        setTrips(userTrips);
        
        setRoutes(routesRes.data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar datos');
        console.error(err);
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  // Optimizar ruta
  const getOptimizedRoute = async () => {
    if (points.length < 2) {
      setError('Se necesitan al menos dos puntos');
      return;
    }

    try {
      const coordinates = points.map(p => [p.latitude, p.longitude]);
      const response = await api.post('/routes/full-route/', { coordinates });
      
      const lineCoords = response.data.geometry.map(([lon, lat]) => ({
        longitude: lon,
        latitude: lat
      }));
      
      setOptimizedRoute(lineCoords);
    } catch (err) {
      setError('Error al calcular ruta');
      console.error(err);
    }
  };

  // Registrar vehículo
  const handleAddVehicle = async () => {
    try {
      const response = await api.post('/vehicles/', {
        ...newVehicle,
        capacity: parseInt(newVehicle.capacity),
        vehicle_type: parseInt(newVehicle.vehicle_type),
        vehicle_category: parseInt(newVehicle.vehicle_category),
        state: "AVAILABLE",
        is_verified: false,
        denied: false,
        reason_denied: "",
        user_id: userId
      });
      
      setVehicles(prev => [...prev, response.data]);
      setNewVehicle({
        capacity: '',
        brand: '',
        plate: '',
        tecnicomecanica_date: '',
        soat_date: '',
        vehicle_type: '',
        vehicle_category: ''
      });
      setActiveTab('vehicles');
    } catch (err) {
      setError('Error al registrar vehículo');
      console.error(err);
    }
  };

  // Programar viaje
  const handleAddTrip = async () => {
    try {
      const response = await api.post('/trips/', {
        date: newTrip.date,
        route: newTrip.route,
        vehicle: newTrip.vehicle,
        status: "CREATED",
        driver: userId
      });
      
      setTrips(prev => [...prev, response.data]);
      setNewTrip({
        date: '',
        route: '',
        vehicle: ''
      });
      setShowTripForm(false);
    } catch (err) {
      setError('Error al programar viaje');
      console.error(err);
    }
  };

  // Guardar ruta
  const handleSaveRoute = async () => {
    if (!routeName.trim()) {
      setError('Ingresa un nombre para la ruta');
      return;
    }

    if (optimizedRoute.length < 2) {
      setError('No hay una ruta válida para guardar');
      return;
    }

    try {
      const coordinates = optimizedRoute.map(p => [p.longitude, p.latitude]);
      
      const response = await api.post('/routes/', {
        name: routeName,
        coordinates
      });
      
      setRoutes(prev => [...prev, response.data]);
      setRouteName('');
      setShowRouteForm(false);
      setPoints([]);
      setOptimizedRoute([]);
      setShowTripForm(true);
    } catch (err) {
      setError('Error al guardar ruta');
      console.error(err);
    }
  };

  // Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    window.location.href = '/login';
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
          <h1 className="text-2xl font-bold">Ugüee - Panel del Conductor</h1>
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

      {/* Tabs */}
      <div className="container mx-auto mt-4">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'trips' ? 'text-purple-700 border-b-2 border-purple-700' : 'text-gray-500'}`}
            onClick={() => setActiveTab('trips')}
          >
            Mis Viajes
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'vehicles' ? 'text-purple-700 border-b-2 border-purple-700' : 'text-gray-500'}`}
            onClick={() => setActiveTab('vehicles')}
          >
            Mis Vehículos
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'routes' ? 'text-purple-700 border-b-2 border-purple-700' : 'text-gray-500'}`}
            onClick={() => setActiveTab('routes')}
          >
            Mis Rutas
          </button>
        </div>
      </div>

      {/* Contenido */}
      <main className="container mx-auto p-4">
        {/* Panel de Viajes */}
        {activeTab === 'trips' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Mis Viajes Programados</h2>
              <button
                onClick={() => setShowTripForm(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Programar Nuevo Viaje
              </button>
            </div>

            {trips.length === 0 ? (
              <p className="text-gray-500">No tienes viajes programados</p>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehículo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruta</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trips.map(trip => (
                      <tr key={trip.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(trip.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${trip.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                              trip.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'}`}>
                            {trip.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {vehicles.find(v => v.id === trip.vehicle)?.plate || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {routes.find(r => r.id === trip.route)?.name || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Panel de Vehículos */}
        {activeTab === 'vehicles' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Mis Vehículos Registrados</h2>
              <button
                onClick={() => setActiveTab('addVehicle')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Registrar Nuevo Vehículo
              </button>
            </div>

            {vehicles.length === 0 ? (
              <p className="text-gray-500">No tienes vehículos registrados</p>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacidad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tecnomecánica</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SOAT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vehicles.map(vehicle => (
                      <tr key={vehicle.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle.plate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.brand}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {vehicle.vehicle_type === VEHICLE_TYPES.VAN && 'Camioneta'}
                          {vehicle.vehicle_type === VEHICLE_TYPES.BIKE && 'Motocicleta'}
                          {vehicle.vehicle_type === VEHICLE_TYPES.BUS && 'Bus'}
                          {vehicle.vehicle_type === VEHICLE_TYPES.CAR && 'Automóvil'}
                          {vehicle.vehicle_type === VEHICLE_TYPES.SKATEBOARD && 'Patineta'}
                          {vehicle.vehicle_type === VEHICLE_TYPES.TRYCICLE && 'Triciclo'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {vehicle.vehicle_category === VEHICLE_CATEGORIES.METROPOLITAN && 'Metropolitano'}
                          {vehicle.vehicle_category === VEHICLE_CATEGORIES.CAMPUS && 'Campus'}
                          {vehicle.vehicle_category === VEHICLE_CATEGORIES.INTERMUNICIPAL && 'Intermunicipal'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.capacity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(vehicle.tecnicomecanica_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(vehicle.soat_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${vehicle.is_verified ? 'bg-green-100 text-green-800' : 
                              vehicle.denied ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'}`}>
                            {vehicle.is_verified ? 'Verificado' : vehicle.denied ? 'Rechazado' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Formulario para agregar vehículo */}
        {activeTab === 'addVehicle' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Registrar Nuevo Vehículo</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
                <input
                  type="text"
                  name="plate"
                  value={newVehicle.plate}
                  onChange={(e) => setNewVehicle({...newVehicle, plate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                <input
                  type="text"
                  name="brand"
                  value={newVehicle.brand}
                  onChange={(e) => setNewVehicle({...newVehicle, brand: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                <input
                  type="number"
                  name="capacity"
                  value={newVehicle.capacity}
                  onChange={(e) => setNewVehicle({...newVehicle, capacity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Vehículo</label>
                <select
                  name="vehicle_type"
                  value={newVehicle.vehicle_type}
                  onChange={(e) => setNewVehicle({...newVehicle, vehicle_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  <option value={VEHICLE_TYPES.VAN}>Camioneta</option>
                  <option value={VEHICLE_TYPES.BIKE}>Motocicleta</option>
                  <option value={VEHICLE_TYPES.BUS}>Bus</option>
                  <option value={VEHICLE_TYPES.CAR}>Automóvil</option>
                  <option value={VEHICLE_TYPES.SKATEBOARD}>Patineta</option>
                  <option value={VEHICLE_TYPES.TRYCICLE}>Triciclo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría de Vehículo</label>
                <select
                  name="vehicle_category"
                  value={newVehicle.vehicle_category}
                  onChange={(e) => setNewVehicle({...newVehicle, vehicle_category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  <option value={VEHICLE_CATEGORIES.METROPOLITAN}>Metropolitano</option>
                  <option value={VEHICLE_CATEGORIES.CAMPUS}>Campus</option>
                  <option value={VEHICLE_CATEGORIES.INTERMUNICIPAL}>Intermunicipal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Tecnomecánica</label>
                <input
                  type="date"
                  name="tecnicomecanica_date"
                  value={newVehicle.tecnicomecanica_date}
                  onChange={(e) => setNewVehicle({...newVehicle, tecnicomecanica_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha SOAT</label>
                <input
                  type="date"
                  name="soat_date"
                  value={newVehicle.soat_date}
                  onChange={(e) => setNewVehicle({...newVehicle, soat_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setActiveTab('vehicles')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddVehicle}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Registrar Vehículo
              </button>
            </div>
          </div>
        )}

        {/* Panel de Rutas */}
        {activeTab === 'routes' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Mis Rutas Guardadas</h2>
              <button
                onClick={() => {
                  setDrawing(true);
                  setPoints([]);
                  setOptimizedRoute([]);
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Crear Nueva Ruta
              </button>
            </div>

            {drawing && (
              <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                <h3 className="text-lg font-medium mb-2">
                  {optimizedRoute.length > 0 ? "Ruta Optimizada" : "Creando nueva ruta"}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {optimizedRoute.length > 0 
                    ? "Revisa la ruta calculada y guárdala si es correcta"
                    : `Haz clic en el mapa para agregar puntos. ${points.length > 0 ? `Puntos seleccionados: ${points.length}` : ''}`}
                </p>
                
                <div 
                  ref={mapContainerRef}
                  className="h-96 rounded-lg overflow-hidden relative border border-gray-200"
                >
                  <button
                    onClick={() => setShouldFollow(true)}
                    className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-md z-10"
                    title="Centrar en mi ubicación"
                  >
                    <FaCompass className="text-purple-600" />
                  </button>
                </div>
                
                <div className="flex justify-between mt-4">
                  <div className="space-x-2">
                    <button
                      onClick={() => {
                        setDrawing(false);
                        setPoints([]);
                        setOptimizedRoute([]);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    {optimizedRoute.length === 0 && (
                      <button
                        onClick={getOptimizedRoute}
                        disabled={points.length < 2}
                        className={`px-4 py-2 rounded-md ${points.length < 2 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      >
                        Optimizar Ruta
                      </button>
                    )}
                  </div>
                  
                  {optimizedRoute.length > 0 && (
                    <div className="space-x-2">
                      <button
                        onClick={() => {
                          setPoints([]);
                          setOptimizedRoute([]);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Reintentar
                      </button>
                      <button
                        onClick={() => setShowRouteForm(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                      >
                        Guardar Ruta
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!drawing && routes.length === 0 ? (
              <p className="text-gray-500">No tienes rutas guardadas</p>
            ) : !drawing && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puntos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {routes.map(route => (
                      <tr key={route.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{route.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {route.coordinates ? route.coordinates.length : 'N/A'} puntos
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => {
                              setOptimizedRoute(route.coordinates.map(([lon, lat]) => ({ longitude: lon, latitude: lat })));
                              setDrawing(true);
                            }}
                            className="text-purple-600 hover:text-purple-900 mr-3"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => {
                              setNewTrip(prev => ({ ...prev, route: route.id }));
                              setShowTripForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Usar para viaje
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal para guardar ruta */}
      {showRouteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Guardar Ruta</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la ruta</label>
              <input
                type="text"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Ej: Ruta de la universidad a la estación"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRouteForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRoute}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para programar viaje */}
      {showTripForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Programar Nuevo Viaje</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  name="date"
                  value={newTrip.date}
                  onChange={(e) => setNewTrip({...newTrip, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ruta</label>
                <select
                  name="route"
                  value={newTrip.route}
                  onChange={(e) => setNewTrip({...newTrip, route: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Seleccionar ruta</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id}>{route.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo</label>
                <select
                  name="vehicle"
                  value={newTrip.vehicle}
                  onChange={(e) => setNewTrip({...newTrip, vehicle: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Seleccionar vehículo</option>
                  {vehicles.filter(v => v.is_verified).map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} - {vehicle.plate} ({vehicle.vehicle_type === VEHICLE_TYPES.VAN ? 'Camioneta' : 
                        vehicle.vehicle_type === VEHICLE_TYPES.BIKE ? 'Motocicleta' : 
                        vehicle.vehicle_type === VEHICLE_TYPES.BUS ? 'Bus' : 
                        vehicle.vehicle_type === VEHICLE_TYPES.CAR ? 'Automóvil' : 
                        vehicle.vehicle_type === VEHICLE_TYPES.SKATEBOARD ? 'Patineta' : 'Triciclo'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowTripForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddTrip}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Programar Viaje
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
          }

          .modal-content {
            background: white;
            padding: 20px;
            border-radius: 8px;
            width: 90%;
            max-width: 500px;
            z-index: 10001;
          }

          .leaflet-container {
            z-index: 0 !important;
          }

          .leaflet-top, .leaflet-bottom {
            z-index: 1 !important;
          }
        `}
      </style>
    </div>
  );
};

export default DriverDashboard;