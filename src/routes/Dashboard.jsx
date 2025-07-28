import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SystemAdminDashboard from './dashboard/SystemAdminDashboard';
import CollegeAdminDashboard from './dashboard/CollegeAdminDashboard';
import DriverDashboard from './dashboard/DriverDashboard';
import PassengerDashboard from './dashboard/PassengerDashboard';

const Dashboard = () => {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('userData'));

  useEffect(() => {
    if (!userData) {
      navigate('/login');
    }
  }, [navigate, userData]);

  console.log(userData)

  if (!userData) {
    return null;
  }

  switch(userData.user_type) {
    case 1:
      return <SystemAdminDashboard />;
    case 2:
      return <CollegeAdminDashboard />;
    case 3:
      return <DriverDashboard />;
    case 4:
      return <PassengerDashboard />;
    default:
      return <div>Rol no reconocido</div>;
  }
};

export default Dashboard;