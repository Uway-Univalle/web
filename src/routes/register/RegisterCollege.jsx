import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ShieldCheck, Upload } from 'lucide-react';

const CollegeRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    colors: [],
    logo_img: null,
    currentColor: ''
  });

  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, logo_img: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddColor = () => {
    if (formData.currentColor && !formData.colors.includes(formData.currentColor)) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, prev.currentColor],
        currentColor: ''
      }));
    }
  };

  const handleRemoveColor = (colorToRemove) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter(color => color !== colorToRemove)
    }));
  };

  const validateForm = () => {
    const required = ['name', 'address', 'email'];
    for (const field of required) {
      if (!formData[field]) {
        setError(`El campo ${field} es requerido`);
        return false;
      }
    }
    if (!validateEmail(formData.email)) {
      setError('Correo electrónico inválido');
      return false;
    }
    if (formData.colors.length === 0) {
      setError('Debe agregar al menos un color');
      return false;
    }
    if (!formData.logo_img) {
      setError('Debe subir un logo');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('address', formData.address);
    formDataToSend.append('email', formData.email);
    formData.colors.forEach(color => {
      formDataToSend.append('colors', color);
    });
    formDataToSend.append('logo_img', formData.logo_img);

    try {
      const res = await api.post('/colleges/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.status === 201) {
        alert('Institución registrada exitosamente.');
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data;
      setError(typeof msg === 'object' ? Object.values(msg)[0] : 'Error en el registro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#8A20A7] flex flex-col">
      <header className="bg-[#8A20A7] text-white p-4 text-lg font-semibold">
        Ugüee - Registro de Institución
      </header>

      <main className="flex flex-col items-center justify-center px-8 py-16 flex-1">
        <div className="w-full max-w-md border border-purple-500 rounded-md p-6">
          <h2 className="text-xl font-semibold mb-4">Registrar Institución</h2>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <input 
              type="text" 
              name="name" 
              placeholder="Nombre de la institución" 
              value={formData.name} 
              onChange={handleChange} 
              className="input" 
            />
            
            <input 
              type="text" 
              name="address" 
              placeholder="Dirección" 
              value={formData.address} 
              onChange={handleChange} 
              className="input" 
            />
            
            <input 
              type="email" 
              name="email" 
              placeholder="Correo electrónico" 
              value={formData.email} 
              onChange={handleChange} 
              className="input" 
            />
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Logo de la institución</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-purple-300 rounded-md">
                <div className="space-y-1 text-center">
                  {preview ? (
                    <div className="flex flex-col items-center">
                      <img src={preview} alt="Preview" className="h-32 object-contain mb-2" />
                      <button
                        type="button"
                        onClick={() => {
                          setPreview(null);
                          setFormData(prev => ({ ...prev, logo_img: null }));
                        }}
                        className="text-sm text-[#8A20A7] hover:text-purple-800"
                      >
                        Cambiar imagen
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center">
                        <Upload className="mx-auto h-12 w-12 text-purple-400" />
                      </div>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-[#8A20A7] hover:text-purple-500 focus-within:outline-none"
                        >
                          <span>Sube un archivo</span>
                          <input
                            id="file-upload"
                            name="logo_img"
                            type="file"
                            className="sr-only"
                            onChange={handleFileChange}
                            accept="image/*"
                          />
                        </label>
                        <p className="pl-1">o arrástralo aquí</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  name="currentColor" 
                  placeholder="Color (ej: #8A20A7)" 
                  value={formData.currentColor} 
                  onChange={handleChange} 
                  className="input flex-1" 
                />
                <button 
                  type="button" 
                  onClick={handleAddColor}
                  className="px-3 py-1 bg-purple-100 text-[#8A20A7] rounded-md hover:bg-purple-200"
                >
                  Agregar
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.colors.map((color, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-white text-xs"
                    style={{ backgroundColor: color }}
                  >
                    {color}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveColor(color)}
                      className="text-white hover:text-gray-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 rounded-md bg-[#8A20A7] text-white font-semibold hover:bg-[#8A20A7] transition"
            >
              {isLoading ? 'Registrando...' : 'Registrar Institución'}
            </button>
          </form>
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

export default CollegeRegister;