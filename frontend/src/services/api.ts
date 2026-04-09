import backendConfig from '../../backend.config.json'
import type{ ApiError, AuthResponse,LoginRequest,RegisterRequest,Store } from '../types';

const isProduction =import.meta.env.PROD;

const BASE_URL= isProduction 
? 'https://z5666569-presto-be-deploy.vercel.app'
: `http://localhost:${backendConfig.BACKEND_PORT}`;

const request=async <T>(
    endpoint: string,
    method: string,
    body?: Record<string,unknown>,
    token?: string
    
): Promise<T>=>{
    const headers:Record<string,string>={
        'Content-Type':'application/json',
    };
    if (token) {
        headers['Authorization'] =`Bearer ${token}`;
    }

    const response =await fetch(`${BASE_URL}${endpoint}`,{
        method,
        headers,
        body :body ? JSON.stringify(body) : undefined,
    });
    const data=await response.json() as ApiError | T;
    if(!response.ok){
        throw new Error((data as ApiError).error ||'Something went wrong');
    }

    return data as T;
}

export const login= ({email , password}:LoginRequest)=>{
    return request<AuthResponse>('/admin/auth/login','POST',{email,password});
}

export const register= ({email,password,name}:RegisterRequest)=>{
    return request<AuthResponse>('/admin/auth/register','POST',{email,password,name});
}

export const logout= (token: string)=>{
    return request<Object>('/admin/auth/logout','POST',undefined,token);
}

export const getStore=(token : string)=>{
    return request<{store:Store}>('/store','GET',undefined,token);
}

export const updateStore=(token :string, store:Store)=>{
    return request<Store>('/store','PUT',{store},token);
}