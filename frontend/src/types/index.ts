
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

export interface Store{
    presentations:Presentation[];
}

export interface Presentation{
    id:string;
    name:string;
    description:string;
    thumbnail: string;
    slides:Slide[];
    defaultBackground:BackgroundStyle;
}

export interface BackgroundStyle {
  type: 'solid' | 'gradient' | 'image';
  color?: string;           // solid 
  gradientStart?: string;   // gradient 
  gradientEnd?: string;
  image?: string;           // image :URL or base64
}

export interface Slide{
    id:string;
    elements: SlideElement[];
    background:BackgroundStyle | '';
}

interface BaseElement{
    id:string;
    type:'text' |'image' | 'video' |'code';
    x:number;
    y:number;
    width:number;
    height:number;
    zIndex :number;
}

export interface TextElement extends BaseElement{
    type:'text';
    text: string;
    fontSize: number;
    color: string;
    fontFamily:string;
}

export interface ImageElement extends BaseElement{
    type:'image';
    src: string;
    alt: string;//for alt tag
}
export interface VideoElement extends BaseElement { 
    type:'video';
    src:string;
    autoplay: boolean;
 }
 export interface CodeElement extends BaseElement { 
    type:'code';
    code:string;
    fontSize:number;
    language:'c'|'python'|'javacript'
  }

export type SlideElement = TextElement | ImageElement | VideoElement | CodeElement;