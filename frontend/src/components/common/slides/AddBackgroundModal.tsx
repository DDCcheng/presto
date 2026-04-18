import type{ BackgroundStyle } from "@/types";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Field,
  FieldDescription,
  FieldLabel,FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface BackgroundModalProps {
  onClose: () => void;
  slideBackground: BackgroundStyle | '';
  defaultBackground?: BackgroundStyle;
  onSlideBackgroundChange: (bg: BackgroundStyle | '') => void;
  onDefaultBackgroundChange: (bg: BackgroundStyle) => void;
}

const AddBackgroundModal=({onClose,onSlideBackgroundChange,onDefaultBackgroundChange,defaultBackground,slideBackground}:BackgroundModalProps)=>{
  const [slideType, setSlideType] = useState<'solid' | 'gradient' | 'image'>(
    slideBackground ? slideBackground.type : 'solid'
  );
  const [slideColor, setSlideColor] = useState(
    slideBackground && slideBackground.type === 'solid' ? slideBackground.color ?? '#ffffff' : '#ffffff'
  );
  const [slideGradientStart, setSlideGradientStart] = useState(
    slideBackground && slideBackground.type === 'gradient' ? slideBackground.gradientStart ?? '#ffffff' : '#ffffff'
  );
  const [slideGradientEnd, setSlideGradientEnd] = useState(
    slideBackground && slideBackground.type === 'gradient' ? slideBackground.gradientEnd ?? '#000000' : '#000000'
  );
  const [slideImage, setSlideImage] = useState(
    slideBackground && slideBackground.type === 'image' ? slideBackground.image ?? '' : ''
  );
  const [defaultType, setDefaultType] = useState<'solid' | 'gradient' | 'image'>(
    defaultBackground ? defaultBackground.type : 'solid'
  );
  const [defaultColor, setDefaultColor] = useState(
    defaultBackground?.type === 'solid' ? defaultBackground.color ?? '#ffffff' : '#ffffff'
  );
  const [defaultGradientStart, setDefaultGradientStart] = useState(
    defaultBackground?.type === 'gradient' ? defaultBackground.gradientStart ?? '#ffffff' : '#ffffff'
  );
  const [defaultGradientEnd, setDefaultGradientEnd] = useState(
    defaultBackground?.type === 'gradient' ? defaultBackground.gradientEnd ?? '#000000' : '#000000'
  );
  const [defaultImage, setDefaultImage] = useState(
    defaultBackground?.type === 'image' ? defaultBackground.image ?? '' : ''
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Theme & Background</DialogTitle>
          <DialogDescription>Customize slide background</DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Label>Current Slide Background</Label>
          <div className="flex gap-2">
            <Button variant={slideType === 'solid' ? 'default' : 'outline'} onClick={() => setSlideType('solid')}>Solid</Button>
            <Button variant={slideType === 'gradient' ? 'default' : 'outline'} onClick={() => setSlideType('gradient')}>Gradient</Button>
            <Button variant={slideType === 'image' ? 'default' : 'outline'} onClick={() => setSlideType('image')}>Image</Button>
          </div>

          {slideType === 'solid' && (
            <Field>
              <Label>Color</Label>
              <Input type="text" value={slideColor} onChange={(e) => setSlideColor(e.target.value)} placeholder="#ffffff" />
            </Field>
          )}

          {slideType === 'gradient' && (
            <>
              <Field>
                <Label>Start Color</Label>
                <Input type="text" value={slideGradientStart} onChange={(e) => setSlideGradientStart(e.target.value)} />
              </Field>
              <Field>
                <Label>End Color</Label>
                <Input type="text" value={slideGradientEnd} onChange={(e) => setSlideGradientEnd(e.target.value)} />
              </Field>
            </>
          )}

          {slideType === 'image' && (
            <Field>
              <Label>Image URL</Label>
              <Input type="text" value={slideImage} onChange={(e) => setSlideImage(e.target.value)} placeholder="https://..." />
            </Field>
          )}

          <div className="flex gap-2">
            <Button onClick={() => {
              if (slideType === 'solid') onSlideBackgroundChange({ type: 'solid', color: slideColor });
              else if (slideType === 'gradient') onSlideBackgroundChange({ type: 'gradient', gradientStart: slideGradientStart, gradientEnd: slideGradientEnd });
              else onSlideBackgroundChange({ type: 'image', image: slideImage });
            }}>Apply to Slide</Button>
            <Button variant="outline" onClick={() => onSlideBackgroundChange('')}>Reset to Default</Button>
          </div>
        </FieldGroup>

        <FieldGroup>
          <Label>Default Background</Label>
          <div className="flex gap-2">
            <Button variant={defaultType === 'solid' ? 'default' : 'outline'} onClick={() => setDefaultType('solid')}>Solid</Button>
            <Button variant={defaultType === 'gradient' ? 'default' : 'outline'} onClick={() => setDefaultType('gradient')}>Gradient</Button>
            <Button variant={defaultType === 'image' ? 'default' : 'outline'} onClick={() => setDefaultType('image')}>Image</Button>
          </div>

          {defaultType === 'solid' && (
            <Field>
              <Label>Color</Label>
              <Input type="text" value={defaultColor} onChange={(e) => setDefaultColor(e.target.value)} placeholder="#ffffff" />
            </Field>
          )}

          {defaultType === 'gradient' && (
            <>
              <Field>
                <Label>Start Color</Label>
                <Input type="text" value={defaultGradientStart} onChange={(e) => setDefaultGradientStart(e.target.value)} />
              </Field>
              <Field>
                <Label>End Color</Label>
                <Input type="text" value={defaultGradientEnd} onChange={(e) => setDefaultGradientEnd(e.target.value)} />
              </Field>
            </>
          )}

          {defaultType === 'image' && (
            <Field>
              <Label>Image URL</Label>
              <Input type="text" value={defaultImage} onChange={(e) => setDefaultImage(e.target.value)} placeholder="https://..." />
            </Field>
          )}

          <Button onClick={() => {
            if (defaultType === 'solid') onDefaultBackgroundChange({ type: 'solid', color: defaultColor });
            else if (defaultType === 'gradient') onDefaultBackgroundChange({ type: 'gradient', gradientStart: defaultGradientStart, gradientEnd: defaultGradientEnd });
            else onDefaultBackgroundChange({ type: 'image', image: defaultImage });
          }}>Apply as Default</Button>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

}

export default AddBackgroundModal;