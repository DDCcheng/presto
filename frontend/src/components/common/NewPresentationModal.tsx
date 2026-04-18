import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react";

interface NewPresentationProps {
  onClose: () => void;        
  onSubmit: (name: string, description: string, thumbnail: string) => void; 
}

const NewPresentation = ({onClose,onSubmit}:NewPresentationProps)=>{
  const [name,setName]=useState('');
  const [description,setDescription]=useState('');
  const [thumbnail,setThumbnail]=useState('');
  return (<>
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Presentation</DialogTitle>
          <DialogDescription>
                    Create a new presentation
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <Label htmlFor="name">Name</Label>
            <Input  placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field>
            <Label htmlFor="description">Description</Label>
            <Input  placeholder="Enter your description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field>
            <Label htmlFor="thumbnail">Thumbnail</Label>
            <Input  placeholder="Enter your thumbnail" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={()=>onSubmit(name,description,thumbnail)}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  )
}

export default NewPresentation;