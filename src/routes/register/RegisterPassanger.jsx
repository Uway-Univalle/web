import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { USER_TYPES, PASSENGER_TYPES } from '../../constants';
import { ShieldCheck } from 'lucide-react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

const Register = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Suponiendo que usas localStorage para guardar el token
    const token = localStorage.getItem('authToken');
    if (token) {
      navigate('/dashboard');
    }
  }, []);

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
  const [verifiedColleges, setVerifiedColleges] = useState([]);
  const [filteredColleges, setFilteredColleges] = useState([]);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingColleges, setIsLoadingColleges] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    const required = [
      'first_name', 'last_name', 'personal_id', 'email', 
      'password', 'address', 'phone', 'code', 'college', 'passenger_type'
    ];
    for (const field of required) {
      if (!formData[field]) {
        setError(`El campo ${field.replace('_', ' ')} es requerido`);
        return false;
      }
    }
    if (!validateEmail(formData.email)) {
      setError('Correo electrónico inválido');
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
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const res = await api.post('/users/', {
        ...formData,
        username: `${formData.first_name}${formData.last_name}`.toLowerCase(),
        college: Number(formData.college),
        passenger_type: Number(formData.passenger_type),
        attachments: []
      });
      if (res.status === 201) {
        alert('Registro exitoso.');
        navigate('/login');
      }
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data;
      setError(typeof msg === 'object' ? Object.values(msg)[0] : 'Error en el registro');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    api.get('/colleges/')
      .then(res => {
        const verified = res.data.filter(college => college.is_verified === true);
        setColleges(res.data);
        setVerifiedColleges(verified);
        setFilteredColleges(verified);
      })
      .catch(() => setError('No se pudieron cargar las universidades'))
      .finally(() => setIsLoadingColleges(false));
  }, []);


  return (
    <div className="min-h-screen bg-white text-[#8A20A7] flex flex-col">
      <header className="bg-[#8A20A7] text-white p-4 text-lg font-semibold">
        Ugüee
      </header>

      <main className="flex flex-col md:flex-row items-center justify-center px-8 py-16 gap-40 flex-1">
        {/* Izquierda */}
        <div className="text-center md:text-left">
          <h1 className="text-9xl font-extrabold mb-4">Ugüee</h1>
          <button className="mt-4 px-4 py-2 border-2 border-[#8A20A7] rounded-full flex items-center gap-2 hover:bg-purple-50 m-auto">
            Muévete seguro
              <ShieldCheck />
          </button>
        </div>

        {/* Derecha */}
        <div className="w-full max-w-md border border-purple-500 rounded-md p-6">
          <h2 className="text-xl font-semibold mb-4">Registro</h2>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <input type="text" name="first_name" placeholder="Nombres" value={formData.first_name} onChange={handleChange} className="input" />
            <input type="text" name="last_name" placeholder="Apellidos" value={formData.last_name} onChange={handleChange} className="input" />
            <input type="text" name="personal_id" placeholder="ID Documento" value={formData.personal_id} onChange={handleChange} className="input" />
            <input type="email" name="email" placeholder="Correo electrónico" value={formData.email} onChange={handleChange} className="input" />
            <input type="password" name="password" placeholder="Contraseña" value={formData.password} onChange={handleChange} className="input" />
            <input type="text" name="phone" placeholder="Teléfono" value={formData.phone} onChange={handleChange} className="input" />
            <input type="text" name="address" placeholder="Dirección" value={formData.address} onChange={handleChange} className="input" />
            <input type="text" name="code" placeholder="Código de estudiante" value={formData.code} onChange={handleChange} className="input" />

            <Combobox
              value={verifiedColleges.find(c => c.college_id == formData.college) || null}
              onChange={(value) => setFormData(prev => ({ ...prev, college: value?.college_id || '' }))}
              disabled={isLoadingColleges}
            >
              <div className="relative">
                <Combobox.Input
                  className="input"
                  displayValue={(college) => college?.name || ''}
                  onChange={(event) => {
                    const filtered = verifiedColleges.filter(college =>
                      college.name.toLowerCase().includes(event.target.value.toLowerCase())
                    );
                    setFilteredColleges(event.target.value === '' ? verifiedColleges : filtered);
                  }}
                  placeholder="Selecciona una universidad verificada"
                />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-5 w-5 text-purple-500" aria-hidden="true" />
                </Combobox.Button>

                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white border border-purple-300 text-sm shadow-lg focus:outline-none">
                  {filteredColleges.length === 0 ? (
                    <div className="relative cursor-default select-none px-4 py-2 text-gray-500">
                      {isLoadingColleges ? 'Cargando universidades...' : 'No hay universidades verificadas'}
                    </div>
                  ) : (
                    filteredColleges.map((college) => (
                      <Combobox.Option
                        key={college.college_id}
                        className={({ active }) =>
                          `cursor-pointer select-none relative px-4 py-2 ${
                            active ? 'bg-purple-100 text-purple-900' : 'text-gray-700'
                          }`
                        }
                        value={college}
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {college.name}
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 right-4 flex items-center">
                                <CheckIcon className="w-5 h-5 text-[#8A20A7]" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  )}
                </Combobox.Options>
              </div>
            </Combobox>



            <select name="passenger_type" value={formData.passenger_type} onChange={handleChange} className="input">
              <option value="">Tipo de pasajero</option>
              <option value={PASSENGER_TYPES.STUDENT}>Estudiante</option>
              <option value={PASSENGER_TYPES.PROFESSOR}>Profesor</option>
              <option value={PASSENGER_TYPES.STAFF}>Administrativo</option>
            </select>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 rounded-md bg-[#8A20A7] text-white font-semibold hover:bg-[#8A20A7] transition"
            >
              {isLoading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button onClick={() => navigate('/login')} className="text-[#8A20A7] underline hover:text-purple-800">
              ¿Ya tienes una cuenta? Inicia sesión
            </button>
          </div>
        </div>
      </main>

      {/* Tailwind input style helper */}
      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #c084fc;
          border-radius: 0.375rem;
          background: white;
          color: #6b21a8;
          outline: none;
        }
        .input:focus {
          border-color: #9333ea;
          box-shadow: 0 0 0 1px #9333ea;
        }
      `}</style>
    </div>
  );
};

export default Register;
