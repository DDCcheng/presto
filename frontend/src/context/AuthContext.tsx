import { createContext, useState} from 'react';
import type { ReactNode } from 'react';

interface AuthContextType{
    token : string | null;
    login : (token :string)=>void;// set token in whole context
    logout :()=> void;//clear token
    isAuthentication :boolean;
}

export const AuthContext= createContext<AuthContextType |null>(null);

export const AuthProvider =({children}:{children:ReactNode})=>{
  const [token,setToken]=useState<string | null>(
    localStorage.getItem('token')
  )   
  const login =(newToken :string)=>{
    setToken(newToken);
    localStorage.setItem('token',newToken);
  }
  const logout =()=>{
    setToken(null);
    localStorage.removeItem('token');
  }
  const isAuthentication = token !==null;

 
  return <AuthContext.Provider value={{token,login,logout,isAuthentication}}>
    {children}
  </AuthContext.Provider>
}