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

interface AddVideoModalProps {
  initialData?: {
    width: number;
    height: number;
    src:string,
    autoplay:boolean,
    x: number;
    y: number;
  };
  onClose: () => void;        
  onSubmit: ( width:number, height :number,src:string,autoplay:boolean,x: number, y: number) => void;
}

const AddVideoModal=({onClose,onSubmit,initialData}:AddVideoModalProps)=>{
    const [x, setX] = useState(initialData?.x ?? 0);
    const [y, setY] = useState(initialData?.y ?? 0);
    const [width,setWidth]=useState(initialData?.width ??30);
    const [height,setHeight]=useState(initialData?.height ??30);
    const [src,setSrc]=useState(initialData?.src ??'');
    const [autoplay, setAutoplay] = useState(initialData?.autoplay ?? false);

    const handleAutoplay = () => setAutoplay(!autoplay);
    return (
        <>
            <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>{initialData ? 'Edit Video Element' : 'New Video Element'}</DialogTitle>
                <DialogDescription></DialogDescription>
                </DialogHeader>
            <FieldGroup>
                <Field>
                    <Label htmlFor="src">Video URL</Label>
                    <Input type="text" placeholder="e.g. https://www.youtube.com/embed/dQw4w9WgXcQ" value={src} onChange={(e) => setSrc(e.target.value)} />
                    <Button onClick={handleAutoplay} variant="outline">
                        {autoplay === false ? 'Switch to autoplay' : 'Stop autoplay'}
                    </Button>
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
                <Button onClick={() => onSubmit( width, height, src,autoplay,x,y,)}>
                    {initialData ? 'Save' : 'Create'}
                </Button>
          </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}

export default AddVideoModal;