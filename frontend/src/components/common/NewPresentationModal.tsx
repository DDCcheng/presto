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
  onSubmit: (name: string, description: string, thumbnail: string) => void | Promise<void>;
  submitting?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

const NewPresentation = ({
  onClose,
  onSubmit,
  submitting = false,
  error = null,
  onClearError,
}: NewPresentationProps)=>{
  const [name,setName]=useState('');
  const [description,setDescription]=useState('');
  const [thumbnail,setThumbnail]=useState('');
  const [thumbnailInputStyle, setThumbnailInputStyle] = useState<'file' | 'url'>('file');
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
            <Input
              placeholder="Enter your name"
              value={name}
              onChange={(e) => {
                onClearError?.();
                setName(e.target.value);
              }}
            />
          </Field>
          <Field>
            <Label htmlFor="description">Description</Label>
            <Input
              placeholder="Enter your description"
              value={description}
              onChange={(e) => {
                onClearError?.();
                setDescription(e.target.value);
              }}
            />
          </Field>
          <Field>
            <Label htmlFor="thumbnail">Thumbnail</Label>
            {thumbnailInputStyle === 'file' && (
              <>
                {thumbnail && (
                  <img
                    src={thumbnail}
                    alt="Thumbnail preview"
                    className="max-h-28 mb-2 w-full rounded-md object-cover"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    onClearError?.();
                    const file = e.target.files?.[0];
                    if (!file) {
                      setThumbnail('');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => setThumbnail(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
              </>
            )}
            {thumbnailInputStyle === 'url' && (
              <Input
                placeholder="Enter thumbnail URL"
                value={thumbnail}
                onChange={(e) => {
                  onClearError?.();
                  setThumbnail(e.target.value);
                }}
              />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setThumbnailInputStyle('file')}
                disabled={submitting || thumbnailInputStyle === 'file'}
              >
                Upload Image
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setThumbnailInputStyle('url')}
                disabled={submitting || thumbnailInputStyle === 'url'}
              >
                Use URL
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Optional. You can upload a local image or paste an online image URL.
            </p>
          </Field>
        </FieldGroup>
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={()=>onSubmit(name,description,thumbnail)} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  )
}

export default NewPresentation;
