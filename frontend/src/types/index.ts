
export interface User{
    email:string,
    name: string,
    token :string,
}

export interface ApiError{
    error:string
}

export interface LoginRequest{
    email:string,
    password:string
}

export interface RegisterRequest{
    email:string,
    password:string,
    name:string
}

export interface AuthResponse{
    token:string
}