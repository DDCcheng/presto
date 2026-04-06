import backendConfig from '../../backend.config.json'

const BASE_URL= `http://localhost:${backendConfig.BACKEND_PORT}`;

const request=async <T>(
    endpoint: string,
    method: string,
    body?: object,
    token?: string
    
): Promise<T>=>{
    const headers:Record<string,string>={
        'Content-Type':'application/json',
    };

    if (token) {
        headers['Authorization'] =`Bear ${token}`;
    }

    const response =await fetch(`${BASE_URL}${endpoint}`,{
        method,
        headers,
        body :body ? JSON.stringify(body) : undefined,
    });
    const data=await response.json();
    if(!response.ok){
        throw new Error(data.error ||'Something went wrong');
    }

    return data as T;
}

export const login= (email:string , password: string)=>{
    return request<{token : string}>('/admin/auth/login','POST',{email,password});
}

export const register= (email:string , password: string, name :string)=>{
    return request<{token : string}>('/admin/auth/register','POST',{email,password,name});
}

export const logout= (token: string)=>{
    return request<Object>('/admin/auth/logout','POST',{},token);
}