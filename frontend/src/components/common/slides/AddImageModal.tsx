import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field,FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react";

interface AddImageModalProps {
  initialData?: {
    width: number;
    height: number;
    src:string,
    alt:string,
    x: number;
    y: number;
  };
  onClose: () => void;        
  onSubmit: ( width:number, height :number,src:string,alt:string,x: number, y: number) => void;
}

const AddImageModal=({onClose,onSubmit,initialData}:AddImageModalProps)=>{
  const [x, setX] = useState(initialData?.x ?? 0);
  const [y, setY] = useState(initialData?.y ?? 0);
  const [width,setWidth]=useState(initialData?.width ??30);
  const [height,setHeight]=useState(initialData?.height ??30);
  const [src,setSrc]=useState(initialData?.src ??'');
  const [alt,setAlt]=useState(initialData?.alt ?? '');
  const [inputStyle, setInputStyle] = useState(() => {
    if (!initialData?.src) return 'file';
    return initialData.src.startsWith('data:') ? 'file' : 'src';
  });

  const handleFileStyle=()=>{
    if (inputStyle=='file'){
      setInputStyle('src'); 
    }else{
      setInputStyle('file'); 
    }
  }
  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{initialData ? 'Edit Image Element' : 'New Image Element'}</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor="src">src</Label>
              {inputStyle === 'file' && (
                <>
                  {src && <img src={src} alt="preview" className="max-h-20 mb-2 w-full h-full object-contain" />}
                  <Input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setSrc(reader.result as string);
                    reader.readAsDataURL(file);
                  }} />
                </>
              )}
              {inputStyle=='src' &&
                    <Input  type="src" placeholder="Enter url of Image" value={src} onChange={(e) => setSrc((e.target.value))} />
              }
              <Button onClick={handleFileStyle} variant="outline">
                {inputStyle === 'file' ? 'Switch to URL' : 'Switch to File Upload'}
              </Button>
            </Field>
            <Field>
              <Label htmlFor="alt">alt</Label>
              <Input  type="text" placeholder="Describe the image" value={alt} onChange={(e) => setAlt((e.target.value))} />
            </Field>
            <Field>
              <Label htmlFor="width">width</Label>
              <Input  type="number" placeholder="Enter your width(0-100)" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
            </Field>
            <Field>
              <Label htmlFor="height">height</Label>
              <Input  type="number" placeholder="Enter your height(0-100)" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
            </Field>
            {initialData && <Field>
              <Label htmlFor="x-y">position</Label>
              <Input  type="number" placeholder="x" value={x} onChange={(e) => setX(Number(e.target.value))} />
              <Input  type="number" placeholder="y" value={y} onChange={(e) => setY(Number(e.target.value))} />
            </Field>
            }
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </DialogClose>
            <Button onClick={() => onSubmit( width, height, src, alt,x,y)}>
              {initialData ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default AddImageModal;