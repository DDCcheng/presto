import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Field,
  FieldDescription,
  FieldLabel,FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react";
interface AddTextModalProps {
  onClose: () => void;        
  onSubmit: (text: string, color: string, width:number, height :number,fontSize:number,fontFamily:string) => void | Promise<void>;
  submitting?: boolean;
  initialData?: {
    text: string;
    color: string;
    width: number;
    height: number;
    fontSize: number;
    fontFamily:string,
  };
}

const AddTextModal=({onClose,onSubmit,initialData,submitting = false}:AddTextModalProps)=>{
  const [text,setText]=useState(initialData?.text ??'');
  const [color,setColor]=useState(initialData?.color ??'#000000');
  const [width,setWidth]=useState(initialData?.width ??30);
  const [height,setHeight]=useState(initialData?.height ??30);
  const [fontSize,setFontSize]=useState(initialData?.fontSize ??1);
  const [fontFamily,setFontFamily]=useState(initialData?.fontFamily ??'Arial')
  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{initialData ? 'Edit Text Element' : 'New Text Element'}</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="textarea-text">Text</FieldLabel>
              <FieldDescription>Enter your text below.</FieldDescription>
              <Textarea id="textarea-text" placeholder="Type your text here." value={text} onChange={(e) => setText(e.target.value)} />
            </Field>
            <Field>
              <Label htmlFor="color">color</Label>
              <Input  placeholder="Enter your color" value={color} onChange={(e) => setColor(e.target.value)} />
            </Field>
            <Field>
              <Label htmlFor="fontSize">Font Size (em)</Label>
              <Input type="number" step="0.1" placeholder="e.g. 1.5" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
            </Field>
            <Field>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Font-Style: {fontFamily}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Font-Family</DropdownMenuLabel>
                    <DropdownMenuItem onClick={()=>setFontFamily('Arial')}>Arial</DropdownMenuItem>
                    <DropdownMenuItem onClick={()=>setFontFamily('Times New Roman')}>Times New Roman</DropdownMenuItem>
                    <DropdownMenuItem onClick={()=>setFontFamily('Courier New')}>Courier New</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </Field>
            <Field>
              <Label htmlFor="width">width</Label>
              <Input  type="number" placeholder="Enter your width(0-100)" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
            </Field>
            <Field>
              <Label htmlFor="height">height</Label>
              <Input  type="number" placeholder="Enter your height(0-100)" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </DialogClose>
            <Button onClick={() => onSubmit(text, color, width, height, fontSize,fontFamily)} disabled={submitting}>
              {submitting ? 'Saving...' : initialData ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default AddTextModal;
