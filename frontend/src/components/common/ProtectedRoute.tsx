import {Navigate} from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { type ReactNode } from 'react'

interface ProtectedRouteProps{
    children:ReactNode;
}

const ProtectedRouter =({children}:ProtectedRouteProps)=>{
  const {isAuthentication} =useAuth();

  if (!isAuthentication){
    return <Navigate to='/' replace/>;
  }
  return <>{children}</>;
};

export default ProtectedRouter;