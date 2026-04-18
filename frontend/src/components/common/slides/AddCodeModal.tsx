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
import { Field,
  FieldDescription,
  FieldLabel,FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {  useState } from "react";
import { Textarea } from "@/components/ui/textarea"

interface AddCodeModalProps {
  initialData?: {
    width: number;
    height: number;
    code:string,
    fontSize:number
    x: number;
    y: number;
  };
  onClose: () => void;        
  onSubmit: ( width:number, height :number,code:string,fontSize:number,x: number, y: number) => void;
}

const AddCodeModal=({onClose,onSubmit,initialData}:AddCodeModalProps)=>{
  const [x, setX] = useState(initialData?.x ?? 0);
  const [y, setY] = useState(initialData?.y ?? 0);
  const [width,setWidth]=useState(initialData?.width ??30);
  const [height,setHeight]=useState(initialData?.height ??30);
  const [code,SetCode]=useState(initialData?.code ??'');
  const [fontSize,setFontSize]=useState(initialData?.fontSize ?? 1);

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{initialData ? 'Edit Code Element' : 'New Code Element'}</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="textarea-text">Code</FieldLabel>
              <FieldDescription>Enter your code below.</FieldDescription>
              <Textarea id="textarea-text" placeholder="Type your text here." value={code} onChange={(e) => SetCode(e.target.value)} />
            </Field>
            <Field>
              <Label htmlFor="fontSize">Font Size (em)</Label>
              <Input type="number" step="0.1" placeholder="e.g. 1.5" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
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
            <Button onClick={() => onSubmit( width, height ,code,fontSize,x, y)}>
              {initialData ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default AddCodeModal;