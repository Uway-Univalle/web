import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { USER_TYPES, PASSENGER_TYPES } from '../../constants';
import { ShieldCheck, Upload } from 'lucide-react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

const Register = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      navigate('/dashboard');
    }
  }, []);

  const [formData, setFormData] = useState({
    username: '',
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

  const [attachments, setAttachments] = useState([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState([]);

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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newPreviews = [...attachmentPreviews];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push({ file, preview: reader.result });
          setAttachmentPreviews([...newPreviews]);
        };
        reader.readAsDataURL(file);
      });
      setAttachments(prev => [...prev, ...files]);
    }
  };

  const handleRemoveAttachment = (indexToRemove) => {
    const newAttachments = [...attachments];
    const newPreviews = [...attachmentPreviews];
    newAttachments.splice(indexToRemove, 1);
    newPreviews.splice(indexToRemove, 1);
    setAttachments(newAttachments);
    setAttachmentPreviews(newPreviews);
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    const required = [
      'username',
      'first_name', 
      'last_name', 
      'personal_id', 
      'email',
      'password', 
      'address', 
      'phone', 
      'code', 
      'college', 
      'passenger_type'
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

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });

    attachments.forEach(file => {
      formDataToSend.append('attachments', file);
    });

    try {
      const res = await api.post('/users/', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
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
        <div className="text-center md:text-left">
          <h1 className="text-9xl font-extrabold mb-4">Ugüee</h1>
          <button className="mt-4 px-4 py-2 border-2 border-[#8A20A7] rounded-full flex items-center gap-2 hover:bg-purple-50 m-auto">
            Muévete seguro <ShieldCheck />
          </button>
        </div>

        <div className="w-full max-w-md border border-purple-500 rounded-md p-6">
          <h2 className="text-xl font-semibold mb-4">Registro</h2>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <input type="text" name="username" placeholder="Nombre de usuario" value={formData.username} onChange={handleChange} className="input" />
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
                  <ChevronUpDownIcon className="h-5 w-5 text-purple-500" />
                </Combobox.Button>

                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white border border-purple-300 text-sm shadow-lg">
                  {filteredColleges.length === 0 ? (
                    <div className="px-4 py-2 text-gray-500">
                      {isLoadingColleges ? 'Cargando universidades...' : 'No hay universidades verificadas'}
                    </div>
                  ) : (
                    filteredColleges.map((college) => (
                      <Combobox.Option
                        key={college.college_id}
                        className={({ active }) =>
                          `cursor-pointer px-4 py-2 ${active ? 'bg-purple-100 text-purple-900' : 'text-gray-700'}`
                        }
                        value={college}
                      >
                        {({ selected }) => (
                          <>
                            <span className={selected ? 'font-medium' : 'font-normal'}>
                              {college.name}
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 right-4 flex items-center">
                                <CheckIcon className="w-5 h-5 text-[#8A20A7]" />
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

            {/* Adjuntos opcionales */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Documentos adjuntos (opcional)</label>
              <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-purple-300 rounded-md">
                <div className="space-y-1 text-center">
                  {attachmentPreviews.length > 0 ? (
                    <div className="space-y-2">
                      {attachmentPreviews.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center">
                            {item.file.type.startsWith('image/') ? (
                              <img src={item.preview} alt="Preview" className="h-10 w-10 object-cover mr-2" />
                            ) : (
                              <div className="h-10 w-10 bg-gray-100 flex items-center justify-center mr-2">
                                <span className="text-xs">PDF</span>
                              </div>
                            )}
                            <span className="text-sm truncate max-w-xs">{item.file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-purple-400" />
                      <label htmlFor="file-upload" className="cursor-pointer text-[#8A20A7] hover:text-purple-500">
                        Subir archivos
                        <input
                          id="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept="image/*,.pdf"
                          multiple
                        />
                      </label>
                      <p className="text-xs text-gray-500">PDF, PNG, JPG. Máx. 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 rounded-md bg-[#8A20A7] text-white font-semibold hover:bg-[#7a1c9f] transition"
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