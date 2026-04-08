
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

export interface SildeElement{
    id:string;
    type: 'text'|'image'|'video'|'code';
    position :{x:number,y:number};
    size:{width:number,height:number};
}

export interface Silde{
    id:string;
    elements: SildeElement[];
    background:string;
}

export interface Presentation{
    id:string;
    name:string;
    description:string;
    thumbnail: string;
    slides:Silde[];
}

export interface Store{
    presentations:Presentation[];
}