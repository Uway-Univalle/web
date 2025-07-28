import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterCollege from './register/RegisterCollege';
import RegisterDriver from './register/RegisterDriver';
import RegisterPassanger from './register/RegisterPassanger';
import { useParams } from 'react-router-dom';

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type');
  
  return (
    <div>
      {userType === 'pasajero' && <RegisterPassanger />}
      {userType === 'institucion' && <RegisterCollege />}
      {userType === 'conductor' && <RegisterDriver />}
    </div>
  );
}

export default Dashboard;