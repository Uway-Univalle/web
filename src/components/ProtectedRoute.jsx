import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const userData = JSON.parse(localStorage.getItem('userData'));
  
  if (!userData) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;