import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import React, { useEffect, useRef, useState } from "react";
import {
  getStore as getStoreApi,
  updateStore as updateStoreApi,
} from "../services/api";
import type { Presentation, SlideElement, PresentationHistory, Slide, TextElement, ImageElement, VideoElement, CodeElement } from "../types";
import { Button } from "../components/ui/button";
import ErrorPopup from "../components/common/ErrorPopup";
import AddTextModal from "@/components/common/slides/AddTextModal";
import AddImageModal from "@/components/common/slides/AddImageModal";
import AddVideoModal from "@/components/common/slides/AddVideoModal";
import AddBackgroundModal from "@/components/common/slides/AddBackgroundModal";
import type { BackgroundStyle } from "../types";
import { buildVideoSrc, isBlank, normalizeInput } from "@/lib/utils";

//plugin for code recongnising
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { ghcolors } from 'react-syntax-highlighter/dist/esm/styles/prism';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import c from 'highlight.js/lib/languages/c';
import 'highlight.js/styles/github.css';
import AddCodeModal from "@/components/common/slides/AddCodeModal";
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('c', c);


const PresentationPage = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const slideRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newThumbnail, setNewThumbnail] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingElement, setEditingElement] = useState<SlideElement | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const lastSave = useRef<number>(0);
  const saveInterval = 60000;

  // slide elements
  const [showAddText, setShowAddText] = useState(false);
  const [showAddImage, setShowAddImage] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [showAddCode, setShowAddCode] = useState(false);
  const [showBackground, setShowBackground] = useState(false);
  const [showSlidePanel, setShowSlidePanel] = useState(false);
  const [draggedSlide, setDraggedIndex] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const copiedElement = useRef<SlideElement | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  //moving part
  const dragInfo = useRef<{
    elementId: string;
    startMouseX: number;
    startMouseY: number;
    startElX: number;
    startElY: number;
  } | null>(null);
  //resizing part
  const resizeInfo = useRef<{
    elementId: string;
    corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    startMouseX: number;
    startMouseY: number;
    startElX: number;
    startElY: number;
    startElW: number;
    startElH: number;
  } | null>(null);

  const getRequiredValue = (label: string, value: string) => {
    const trimmedValue = normalizeInput(value);
    if (isBlank(trimmedValue)) {
      setError(`${label} cannot be blank`);
      return null;
    }
    return trimmedValue;
  };

  const getNumberInRange = (label: string, value: number, min: number, max: number) => {
    if (!Number.isFinite(value)) {
      setError(`${label} must be a valid number`);
      return null;
    }
    if (value < min || value > max) {
      setError(`${label} must be between ${min} and ${max}`);
      return null;
    }
    return value;
  };

  const enqueueSave = async <T,>(task: () => Promise<T>) => {
    const run = saveQueue.current.then(task, task);
    saveQueue.current = run.then(() => undefined, () => undefined);
    return run;
  };

  const runSaveTask = async <T,>(task: () => Promise<T>, fallbackMessage: string) => {
    return enqueueSave(async () => {
      setIsSaving(true);
      try {
        return await task();
      } catch (error) {
        setError(error instanceof Error ? error.message : fallbackMessage);
        return null;
      } finally {
        setIsSaving(false);
      }
    });
  };

  const buildHistoryEntry = (currentPresentation: Presentation, slides: Slide[]) => {
    const now = Date.now();
    const shouldSaveHistory =
      lastSave.current === 0 || now - lastSave.current > saveInterval;

    if (!shouldSaveHistory) {
      return null;
    }

    lastSave.current = now;
    return {
      id: crypto.randomUUID(),
      timestamp: now,
      slides: structuredClone(slides),
      name: currentPresentation.name || '',
      description: currentPresentation.description || '',
      thumbnail: currentPresentation.thumbnail || '',
      defaultBackground: currentPresentation.defaultBackground,
    };
  };

  const persistPresentationUpdate = async (
    updater: (currentPresentation: Presentation) => Presentation
  ) => {
    if (!token || !id) return null;

    return runSaveTask(async () => {
      const data = await getStoreApi(token);
      let updatedPresentation: Presentation | null = null;
      const updatedStorePresentations = data.store.presentations.map((p: Presentation) => {
        if (p.id !== id) return p;

        updatedPresentation = updater(p);
        return updatedPresentation;
      });

      if (!updatedPresentation) {
        setError('Presentation not found');
        navigate('/dashboard');
        return null;
      }

      await updateStoreApi(token, { presentations: updatedStorePresentations });
      setPresentation(updatedPresentation);
      return updatedPresentation;
    }, 'Failed to save presentation');
  };

  const saveSlides = async (slides: Slide[]) => {
    return persistPresentationUpdate((currentPresentation) => {
      const historyEntry = buildHistoryEntry(currentPresentation, slides);
      return {
        ...currentPresentation,
        slides,
        history: historyEntry
          ? [historyEntry, ...(currentPresentation.history || [])]
          : (currentPresentation.history || []),
      };
    });
  };

  //effect function
  useEffect(() => {
    let cancelled=false;
    const fetchData = async () => {
      if (!token) return;
      const data = await getStoreApi(token);
      const found = data.store.presentations.find(
        (p: Presentation) => p.id === id
      );
      if (!found) {
        navigate("/dashboard");
        return;
      }
      if (cancelled) return;
      if (found) {
        setPresentation(found);
        const urlSlide = Number(searchParams.get("slide")) || 0;
        const safeIndex = Math.max(0, Math.min(urlSlide, found.slides.length - 1));
        setCurrentSlideIndex(safeIndex);
      }
    };
    fetchData();
    return ()=>{cancelled=true};
  }, [token, id]);
  //add arrow function
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!presentation) return;

      if (editingElement || editingTitle || showAddText || showAddImage || showAddVideo || showAddCode) return;

      if (e.key === "ArrowLeft" && currentSlideIndex > 0) {
        setCurrentSlideIndex((i) => i - 1);
      }
      if (
        e.key === "ArrowRight" &&
        currentSlideIndex < presentation.slides.length - 1
      ) {
        setCurrentSlideIndex((i) => i + 1);
      }
      //delete key to delete element
      if (e.key === 'Delete' && selectedElementId) {
        const currentSlide = presentation.slides[currentSlideIndex];
        const updatedElements = currentSlide.elements.filter(
          (el) => el.id !== selectedElementId
        );
        const updatedSlides = presentation.slides.map((s, index) =>
          index === currentSlideIndex ? { ...s, elements: updatedElements } : s
        );
        saveSlides(updatedSlides);
        setSelectedElementId(null);
      }

      // Ctrl+C 
      if (e.key === 'c' && (e.ctrlKey || e.metaKey) && selectedElementId) {
        e.preventDefault();
        const currentSlide = presentation.slides[currentSlideIndex];
        const el = currentSlide.elements.find(el => el.id === selectedElementId);
        if (el) {
          copiedElement.current = el;
        }
      }

      // Ctrl+V paste
      if (e.key === 'v' && (e.ctrlKey || e.metaKey) && copiedElement.current) {
        e.preventDefault();
        const currentSlide = presentation.slides[currentSlideIndex];
        const maxZIndex = currentSlide.elements.length === 0
          ? 0
          : Math.max(...currentSlide.elements.map(el => el.zIndex));
      
        const newElement = {
          ...copiedElement.current,
          id: crypto.randomUUID(),
          x: Math.min(copiedElement.current.x + 5, 100 - copiedElement.current.width),
          y: Math.min(copiedElement.current.y + 5, 100 - copiedElement.current.height),
          zIndex: maxZIndex + 1,
        };

        const updatedElements = [...currentSlide.elements, newElement];
        const updatedSlides = presentation.slides.map((s, index) =>
          index === currentSlideIndex ? { ...s, elements: updatedElements } : s
        );
        saveSlides(updatedSlides);
        setSelectedElementId(newElement.id);
      }

      // Escape cancel choosing
      if (e.key === 'Escape') {
        setSelectedElementId(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentSlideIndex, presentation, selectedElementId, editingElement, editingTitle, showAddText, showAddImage, showAddVideo, showAddCode]);

  //add element moving logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!slideRef.current || !presentation) return;
      e.preventDefault();
      const rect = slideRef.current.getBoundingClientRect();
      const currentSlide = presentation.slides[currentSlideIndex];

      if (dragInfo.current) {
        const deltaX = ((e.clientX - dragInfo.current.startMouseX) / rect.width) * 100;
        const deltaY = ((e.clientY - dragInfo.current.startMouseY) / rect.height) * 100;
        // new start= old one + moving distance
        let newX = dragInfo.current.startElX + deltaX;
        let newY = dragInfo.current.startElY + deltaY;
        // find current element,and get width and height from it
        const el = currentSlide.elements.find(e => e.id === dragInfo.current!.elementId);
        if (!el) return;
        // boundary limits
        newX = Math.max(0, Math.min(newX, 100 - el.width));
        newY = Math.max(0, Math.min(newY, 100 - el.height));
        // update presentation
        const updatedElements = currentSlide.elements.map(element =>
          element.id === dragInfo.current!.elementId
            ? { ...element, x: newX, y: newY }
            : element
        );
        const updatedSlides = presentation.slides.map((s, index) =>
          index === currentSlideIndex ? { ...s, elements: updatedElements } : s
        );
        setPresentation(prev => prev && { ...prev, slides: updatedSlides });
        return;
      };
      // resizing part
      if (resizeInfo.current) {
        const deltaX = ((e.clientX - resizeInfo.current.startMouseX) / rect.width) * 100;
        const deltaY = ((e.clientY - resizeInfo.current.startMouseY) / rect.height) * 100;
        let newX = resizeInfo.current.startElX;
        let newY = resizeInfo.current.startElY;
        let newW = resizeInfo.current.startElW;
        let newH = resizeInfo.current.startElH;
        const corner = resizeInfo.current.corner;
        if (corner === 'bottom-right') {
          newW += deltaX;
          newH += deltaY;
        } else if (corner === 'bottom-left') {
          newX += deltaX;
          newW -= deltaX;
          newH += deltaY;
        } else if (corner === 'top-right') {
          newY += deltaY;
          newW += deltaX;
          newH -= deltaY;
        } else if (corner === 'top-left') {
          newX += deltaX;
          newY += deltaY;
          newW -= deltaX;
          newH -= deltaY;
        }
        // min 1%
        newW = Math.max(1, newW);
        newH = Math.max(1, newH);
        // boundary limit
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);
        if (newX + newW > 100) newW = 100 - newX;
        if (newY + newH > 100) newH = 100 - newY;
        const updatedElements = currentSlide.elements.map(element =>
          element.id === resizeInfo.current!.elementId
            ? { ...element, x: newX, y: newY, width: newW, height: newH }
            : element
        );
        const updatedSlides = presentation.slides.map((s, index) =>
          index === currentSlideIndex ? { ...s, elements: updatedElements } : s
        );
        setPresentation(prev => prev && { ...prev, slides: updatedSlides });
        return;
      }
    }
    // how many pixels mouse moved
    const handleMouseUp = () => {
      if (!dragInfo.current && !resizeInfo.current) return;
      dragInfo.current = null;
      resizeInfo.current = null;
      if (presentation) {
        saveSlides(presentation.slides);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!slideRef.current || !presentation) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = slideRef.current.getBoundingClientRect();
      const currentSlide = presentation.slides[currentSlideIndex];
      if (dragInfo.current) {
        const deltaX = ((touch.clientX - dragInfo.current.startMouseX) / rect.width) * 100;
        const deltaY = ((touch.clientY - dragInfo.current.startMouseY) / rect.height) * 100;
        let newX = dragInfo.current.startElX + deltaX;
        let newY = dragInfo.current.startElY + deltaY;
        const el = currentSlide.elements.find(e => e.id === dragInfo.current!.elementId);
        if (!el) return;
        newX = Math.max(0, Math.min(newX, 100 - el.width));
        newY = Math.max(0, Math.min(newY, 100 - el.height));
        const updatedElements = currentSlide.elements.map(element =>
          element.id === dragInfo.current!.elementId
            ? { ...element, x: newX, y: newY }
            : element
        ) as SlideElement[];
        const updatedSlides = presentation.slides.map((s, index) =>
          index === currentSlideIndex ? { ...s, elements: updatedElements } : s
        );
        setPresentation(prev => prev && { ...prev, slides: updatedSlides });
        return;
      }

      if (resizeInfo.current) {
        const deltaX = ((touch.clientX - resizeInfo.current.startMouseX) / rect.width) * 100;
        const deltaY = ((touch.clientY - resizeInfo.current.startMouseY) / rect.height) * 100;
        let newX = resizeInfo.current.startElX;
        let newY = resizeInfo.current.startElY;
        let newW = resizeInfo.current.startElW;
        let newH = resizeInfo.current.startElH;
        const corner = resizeInfo.current.corner;

        if (corner === 'bottom-right') {
          newW += deltaX;
          newH += deltaY;
        } else if (corner === 'bottom-left') {
          newX += deltaX;
          newW -= deltaX;
          newH += deltaY;
        } else if (corner === 'top-right') {
          newY += deltaY;
          newW += deltaX;
          newH -= deltaY;
        } else if (corner === 'top-left') {
          newX += deltaX;
          newY += deltaY;
          newW -= deltaX;
          newH -= deltaY;
        }

        newW = Math.max(1, newW);
        newH = Math.max(1, newH);
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);
        if (newX + newW > 100) newW = 100 - newX;
        if (newY + newH > 100) newH = 100 - newY;

        const updatedElements = currentSlide.elements.map(element =>
          element.id === resizeInfo.current!.elementId
            ? { ...element, x: newX, y: newY, width: newW, height: newH }
            : element
        ) as SlideElement[];
        const updatedSlides = presentation.slides.map((s, index) =>
          index === currentSlideIndex ? { ...s, elements: updatedElements } : s
        );
        setPresentation(prev => prev && { ...prev, slides: updatedSlides });
        return;
      }
    };

    const handleTouchEnd = () => {
      if (!dragInfo.current && !resizeInfo.current) return;
      dragInfo.current = null;
      resizeInfo.current = null;
      if (presentation) {
        saveSlides(presentation.slides);
      }
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [currentSlideIndex, presentation]);


  if (!presentation) return <div>Loading...</div>;
  const handleSlideBackgroundChange = async (bg: BackgroundStyle | '') => {
    if (!presentation) return;
    if (bg && bg.type === 'solid' && isBlank(bg.color ?? '')) {
      setError('Slide background color cannot be blank');
      return;
    }
    if (
      bg &&
      bg.type === 'gradient' &&
      (isBlank(bg.gradientStart ?? '') || isBlank(bg.gradientEnd ?? ''))
    ) {
      setError('Gradient colors cannot be blank');
      return;
    }
    if (bg && bg.type === 'image' && isBlank(bg.image ?? '')) {
      setError('Slide background image URL cannot be blank');
      return;
    }
    const updatedSlides = presentation.slides.map((s, index) =>
      index === currentSlideIndex ? { ...s, background: bg } : s
    );
    await saveSlides(updatedSlides);
  };
  const handleDefaultBackgroundChange = async (bg: BackgroundStyle) => {
    if (!presentation) return;
    if (bg.type === 'solid' && isBlank(bg.color ?? '')) {
      setError('Default background color cannot be blank');
      return;
    }
    if (bg.type === 'gradient' && (isBlank(bg.gradientStart ?? '') || isBlank(bg.gradientEnd ?? ''))) {
      setError('Gradient colors cannot be blank');
      return;
    }
    if (bg.type === 'image' && isBlank(bg.image ?? '')) {
      setError('Default background image URL cannot be blank');
      return;
    }
    await persistPresentationUpdate((currentPresentation) => ({
      ...currentPresentation,
      defaultBackground: bg,
    }));
  };
  const getBackgroundStyle = () => {
    if (!presentation) return;
    const bg = slide.background || presentation.defaultBackground;
    if (!bg) return {};
    if (bg.type === 'solid') return { backgroundColor: bg.color };
    if (bg.type === 'gradient') return { background: `linear-gradient(to right, ${bg.gradientStart}, ${bg.gradientEnd})` };
    if (bg.type === 'image') return { backgroundImage: `url(${bg.image})`, backgroundSize: 'cover' };
    return {};
  };

  //code element logic
  const handleAddCode = async (width: number, height: number, code: string, fontSize: number) => {
    if (!presentation) return;
    const validWidth = getNumberInRange('Width', width, 1, 100);
    const validHeight = getNumberInRange('Height', height, 1, 100);
    const validFontSize = getNumberInRange('Font size', fontSize, 0.1, 10);
    const trimmedCode = getRequiredValue('Code', code);
    if (!trimmedCode || validWidth === null || validHeight === null || validFontSize === null) return;
    const currentSlide = presentation.slides[currentSlideIndex];
    const maxZIndex = currentSlide.elements.length === 0
      ? 0
      : Math.max(...currentSlide.elements.map(el => el.zIndex));
    const newCodeElement :CodeElement = {
      id: crypto.randomUUID(),
      x:0,y:0,
      type: 'code',
      language:'c',
      width: validWidth,
      height: validHeight,
      code: trimmedCode,
      fontSize: validFontSize,
      zIndex: maxZIndex + 1 //max zindex of current element +1
    };
    const updatedElements = [...currentSlide.elements, newCodeElement];
    const updatedSlides = presentation.slides.map((s, index) => {
      return index === currentSlideIndex ? { ...s, elements: updatedElements } : s;
    })
    const savedPresentation = await saveSlides(updatedSlides);
    if (savedPresentation) {
      setShowAddCode(false)
    }
  };
  const handleEditCode = async (width: number, height: number, code: string, fontSize: number) => {
    const validWidth = getNumberInRange('Width', width, 1, 100);
    const validHeight = getNumberInRange('Height', height, 1, 100);
    const validFontSize = getNumberInRange('Font size', fontSize, 0.1, 10);
    const trimmedCode = getRequiredValue('Code', code);
    if (!trimmedCode || validWidth === null || validHeight === null || validFontSize === null) return;
    const EditingCodeElement = {
      ...editingElement,
      width: validWidth, height: validHeight, code: trimmedCode, fontSize: validFontSize
    };
    if (!presentation) return;
    const currentSlide = presentation.slides[currentSlideIndex];
    const updatedElements = currentSlide.elements.map((el) =>
      el.id === editingElement?.id ? EditingCodeElement : el
    ) as SlideElement[];
    const updatedSlides = presentation.slides.map((s, index) => {
      return index === currentSlideIndex ? { ...s, elements: updatedElements } : s;
    })
    const savedPresentation = await saveSlides(updatedSlides);
    if (savedPresentation) {
      setEditingElement(null)
    }

  };

  //video element logic
  const handleAddVideo = async (width: number, height: number, src: string, autoplay: boolean) => {
    if (!presentation) return;
    const validWidth = getNumberInRange('Width', width, 1, 100);
    const validHeight = getNumberInRange('Height', height, 1, 100);
    const trimmedSrc = getRequiredValue('Video URL', src);
    if (!trimmedSrc || validWidth === null || validHeight === null) return;
    const currentSlide = presentation.slides[currentSlideIndex];
    const maxZIndex = currentSlide.elements.length === 0
      ? 0
      : Math.max(...currentSlide.elements.map(el => el.zIndex));
    const newVideoElement :VideoElement = {
      id: crypto.randomUUID(),
      x:0,y:0,
      type: 'video',
      width: validWidth,
      height: validHeight,
      src: trimmedSrc,
      autoplay: autoplay,
      zIndex: maxZIndex + 1 //max zindex of current element +1
    };
    const updatedElements = [...currentSlide.elements, newVideoElement];
    const updatedSlides = presentation.slides.map((s, index) => {
      return index === currentSlideIndex ? { ...s, elements: updatedElements } : s;
    })
    const savedPresentation = await saveSlides(updatedSlides);
    if (savedPresentation) {
      setShowAddVideo(false)
    }
  };
  const handleEditVideo = async (width: number, height: number, src: string, autoplay: boolean) => {
    const validWidth = getNumberInRange('Width', width, 1, 100);
    const validHeight = getNumberInRange('Height', height, 1, 100);
    const trimmedSrc = getRequiredValue('Video URL', src);
    if (!trimmedSrc || validWidth === null || validHeight === null) return;
    const EditingVideoElement = {
      ...editingElement,
      width: validWidth, height: validHeight, src: trimmedSrc, autoplay
    };
    if (!presentation) return;
    const currentSlide = presentation.slides[currentSlideIndex];
    const updatedElements = currentSlide.elements.map((el) =>
      el.id === editingElement?.id ? EditingVideoElement : el
    ) as SlideElement[];
    const updatedSlides = presentation.slides.map((s, index) => {
      return index === currentSlideIndex ? { ...s, elements: updatedElements } : s;
    })
    const savedPresentation = await saveSlides(updatedSlides);
    if (savedPresentation) {
      setEditingElement(null)
    }
  };

  //image element logic
  const handleAddImage = async (width: number, height: number, src: string, alt: string) => {
    if (!presentation) return;
    const validWidth = getNumberInRange('Width', width, 1, 100);
    const validHeight = getNumberInRange('Height', height, 1, 100);
    const trimmedSrc = getRequiredValue('Image URL', src);
    const trimmedAlt = getRequiredValue('Alt text', alt);
    if (!trimmedSrc || !trimmedAlt || validWidth === null || validHeight === null) return;
    const currentSlide = presentation.slides[currentSlideIndex];
    const maxZIndex = currentSlide.elements.length === 0
      ? 0
      : Math.max(...currentSlide.elements.map(el => el.zIndex));
    const newImageElement:ImageElement = {
      id: crypto.randomUUID(),
      x:0,y:0,
      type: 'image',
      width: validWidth,
      height: validHeight,
      src: trimmedSrc,
      alt: trimmedAlt,
      zIndex: maxZIndex + 1 //max zindex of current element +1
    };
    const updatedElements = [...currentSlide.elements, newImageElement];
    const updatedSlides = presentation.slides.map((s, index) => {
      return index === currentSlideIndex ? { ...s, elements: updatedElements } : s;
    })
    const savedPresentation = await saveSlides(updatedSlides);
    if (savedPresentation) {
      setShowAddImage(false)
    }
  };
  const handleEditImage = async (width: number, height: number, src: string, alt: string, ) => {
    const validWidth = getNumberInRange('Width', width, 1, 100);
    const validHeight = getNumberInRange('Height', height, 1, 100);
    const trimmedSrc = getRequiredValue('Image URL', src);
    const trimmedAlt = getRequiredValue('Alt text', alt);
    if (!trimmedSrc || !trimmedAlt || validWidth === null || validHeight === null) return;
    const EditingImageElement = {
      ...editingElement,
      width: validWidth, height: validHeight, src: trimmedSrc, alt: trimmedAlt
    };
    if (!presentation) return;
    const currentSlide = presentation.slides[currentSlideIndex];
    const updatedElements = currentSlide.elements.map((el) =>
      el.id === editingElement?.id ? EditingImageElement : el
    ) as SlideElement[];
    const updatedSlides = presentation.slides.map((s, index) => {
      return index === currentSlideIndex ? { ...s, elements: updatedElements } : s;
    })
    const savedPresentation = await saveSlides(updatedSlides);
    if (savedPresentation) {
      setEditingElement(null)
    }
  };


  //text element logic
  const handleAddText = async (text: string, color: string, width: number, height: number, fontSize: number, fontFamily: string) => {
    if (!presentation) return;
    const validWidth = getNumberInRange('Width', width, 1, 100);
    const validHeight = getNumberInRange('Height', height, 1, 100);
    const validFontSize = getNumberInRange('Font size', fontSize, 0.1, 10);
    const trimmedText = getRequiredValue('Text', text);
    const trimmedColor = getRequiredValue('Text color', color);
    if (!trimmedText || !trimmedColor || validWidth === null || validHeight === null || validFontSize === null) return;
    const currentSlide = presentation.slides[currentSlideIndex];
    const maxZIndex = currentSlide.elements.length === 0
      ? 0
      : Math.max(...currentSlide.elements.map(el => el.zIndex));
    const newTextElement :TextElement= {
      id: crypto.randomUUID(),
      x:0,y:0,
      type: 'text',
      width: validWidth,
      height: validHeight,
      text: trimmedText,
      color: trimmedColor,
      fontSize: validFontSize,
      fontFamily: fontFamily,
      zIndex: maxZIndex + 1 //max zindex of current element +1
    };
    const updatedElements = [...currentSlide.elements, newTextElement];
    const updatedSlides = presentation.slides.map((s, index) => {
      return index === currentSlideIndex ? { ...s, elements: updatedElements } : s;
    })
    const savedPresentation = await saveSlides(updatedSlides);
    if (savedPresentation) {
      setShowAddText(false)
    }
  };
  const handleEditText = async (text: string, color: string, width: number, height: number, fontSize: number, fontFamily: string) => {
    if (!presentation || !editingElement) return;
    const validWidth = getNumberInRange('Width', width, 1, 100);
    const validHeight = getNumberInRange('Height', height, 1, 100);
    const validFontSize = getNumberInRange('Font size', fontSize, 0.1, 10);
    const trimmedText = getRequiredValue('Text', text);
    const trimmedColor = getRequiredValue('Text color', color);
    if (!trimmedText || !trimmedColor || validWidth === null || validHeight === null || validFontSize === null) return;
    const updatedElement = {
      ...editingElement,
      width: validWidth, height: validHeight, text: trimmedText, color: trimmedColor, fontSize: validFontSize, fontFamily
    };
    const currentSlide = presentation.slides[currentSlideIndex];
    const updatedElements = currentSlide.elements.map((el) =>
      el.id === editingElement.id ? updatedElement : el
    ) as SlideElement[];
    const updatedSlides = presentation.slides.map((s, index) => {
      return index === currentSlideIndex ? { ...s, elements: updatedElements } : s;
    })
    const savedPresentation = await saveSlides(updatedSlides);
    if (savedPresentation) {
      setEditingElement(null)
    }
  };
 
  const handleAddSlide = async () => {
    const newSlide : Slide = {
      id: crypto.randomUUID(),
      elements: [],
      background: '' as const,
      transition: "none",
    };
    const updatedSlides = [...presentation.slides, newSlide];
    const savedPresentation = await saveSlides(updatedSlides);
    if (savedPresentation) {
      setCurrentSlideIndex(updatedSlides.length - 1);
    }
  };

  const handleDeleteSlide = async () => {
    if (presentation.slides.length === 1) {
      setError("Only one slide left. Delete the presentation instead.");
      return;
    }
    const updatedSlides = presentation.slides.filter(
      (_, index) => index !== currentSlideIndex
    );
    const savedPresentation = await saveSlides(updatedSlides);
    if (savedPresentation) {
      setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }
  };

  const handleDeletePresentation = async () => {
    if (!token) return;
    const deleted = await runSaveTask(async () => {
      const data = await getStoreApi(token);
      const updated = data.store.presentations.filter(
        (p: Presentation) => p.id !== id
      );
      await updateStoreApi(token, { presentations: updated });
      return true;
    }, 'Failed to delete presentation');

    if (deleted) {
      navigate("/dashboard");
    }
  };

  const handleTitleSave = async () => {
    const trimmedTitle = getRequiredValue('Title', newTitle);
    const trimmedThumbnail = getRequiredValue('Thumbnail URL', newThumbnail);
    if (!trimmedTitle || !trimmedThumbnail) return;

    const updatedPresentation = await persistPresentationUpdate((currentPresentation) => ({
      ...currentPresentation,
      name: trimmedTitle,
      thumbnail: trimmedThumbnail,
    }));

    if (updatedPresentation) {
      setEditingTitle(false);
    }
  };

  const getSlideBackgroundStyle = (s: Slide) => {
    const bg = s.background || presentation?.defaultBackground;

    if (!bg) return {};

    if (bg.type === "solid") return { backgroundColor: bg.color };
    if (bg.type === "gradient")
      return {
        background: `linear-gradient(to right, ${bg.gradientStart}, ${bg.gradientEnd})`,
      };
    if (bg.type === "image")
      return {
        backgroundImage: `url(${bg.image})`,
        backgroundSize: "cover",
      };

    return {};
  };

  const slide = presentation.slides[currentSlideIndex];

  const handleRestoreHistory = async (history: PresentationHistory) => {
    if (!presentation || !token) return;

    const restoredPresentation = await persistPresentationUpdate((currentPresentation) => {
      const historyEntry = buildHistoryEntry(currentPresentation, history.slides);
      return {
        ...currentPresentation,
        slides: history.slides,
        name: history.name,
        description: history.description,
        thumbnail: history.thumbnail,
        defaultBackground: history.defaultBackground,
        history: historyEntry
          ? [historyEntry, ...(currentPresentation.history || [])]
          : (currentPresentation.history || []),
      };
    });

    if (restoredPresentation) {
      setCurrentSlideIndex(0);
      setShowHistory(false);
    }
  };

  const openTitleEditor = () => {
    setNewTitle(presentation.name);
    setNewThumbnail(presentation.thumbnail || '');
    setEditingTitle(true);
  };
  

  return (
    <main aria-label="Presentation editor page" className="min-h-screen p-2 sm:p-4 md:p-6 relative flex flex-col gap-3">
      <div className="w-full bg-white border-b px-2 sm:px-6 py-2 shadow-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap z-50">
          <Button onClick={() => navigate("/dashboard")} aria-label="Go back to dashboard">Back</Button>
          <h2 className="text-xl font-semibold">{presentation.name}</h2>
          <Button size="sm" variant="outline" onClick={openTitleEditor} disabled={isSaving}>
            Edit
          </Button>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Button onClick={() => setShowHistory(true)} disabled={isSaving}>
            History
          </Button>
          <Button onClick={() => window.open(`/preview/${id}`, "_blank")} aria-label="Open preview in new tab">
            Preview
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isSaving}
            aria-label="Delete presentation"
          >
            Delete
          </Button>
        </div>
      </div>

      <div
        className="relative border w-full aspect-video max-h-[55vh] sm:max-h-none flex items-center justify-center bg-gray-100 overflow-hidden"
        role="region"
        aria-label="Slide canvas"
      >
        <div
          className="absolute inset-0"
          onClick={() => setSelectedElementId(null)}
          ref={slideRef}
          style={{ ...getBackgroundStyle(), touchAction: 'none' }}
        >
          {slide.elements.map((el) => (
            <div
              key={el.id}
              role="button"
              style={{
                position: 'absolute',
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.width}%`,
                height: `${el.height}%`,
                zIndex: el.zIndex,
                border: selectedElementId === el.id ? '2px solid blue' : 'none',
                touchAction: 'none',
              }}
              onContextMenu={async (e) => {
                e.preventDefault();
                const updatedSlide = slide.elements.filter(
                  (element) => element.id !== el.id
                );
                const updatedSlides = presentation.slides.map((s, index) => {
                  return index === currentSlideIndex ? { ...s, elements: updatedSlide } : s;
                })
                await saveSlides(updatedSlides);
              }}
              onDoubleClick={() => setEditingElement(el)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedElementId(el.id)
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                if (selectedElementId !== el.id) return;
                dragInfo.current = {
                  elementId: el.id,
                  startMouseX: e.clientX,
                  startMouseY: e.clientY,
                  startElX: el.x,
                  startElY: el.y,
                };
              }}
              onTouchStart={(e)=>{
                e.stopPropagation();
                e.preventDefault();
                if(selectedElementId!==el.id)return ;
                const touch=e.touches[0];
                dragInfo.current = {
                  elementId: el.id,
                  startMouseX: touch.clientX,
                  startMouseY: touch.clientY,
                  startElX: el.x,
                  startElY: el.y,
                };
              }}
            >
              {el.type === 'text' && (
                <div
                  className="w-full h-full border border-gray-300  overflow-auto whitespace-normal text-left"
                  style={{
                    fontSize: `${window.innerWidth < 640 ? el.fontSize * 0.7 : el.fontSize}em`,
                    color: el.color,
                    fontFamily: el.fontFamily,
                  }}
                >
                  {el.text}
                </div>
              )}

              {el.type === 'image' && (
                <img
                  src={el.src}
                  alt={el.alt}
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              )}

              {el.type === 'video' && (
                <iframe
                  src={buildVideoSrc(el.src, el.autoplay)}
                  className="w-full h-full"
                  allow="autoplay"
                  title="video"
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {el.type === 'code' && (
                <SyntaxHighlighter
                  language={(() => {
                    const detected = hljs.highlightAuto(el.code, ['javascript', 'python', 'c']);
                    return detected.language || 'javascript';
                  })()}
                  style={ghcolors}
                  customStyle={{
                    width: '100%',
                    height: '100%',
                    margin: 0,
                    fontSize: `${el.fontSize}em`,
                    overflow: 'auto',
                    userSelect: 'none',
                  }}
                >
                  {el.code}
                </SyntaxHighlighter>
              )}

              {selectedElementId === el.id && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      top: window.innerWidth < 640 ? -6 : -2.5,
                      left: window.innerWidth < 640 ? -6 : -2.5,
                      width: window.innerWidth < 640 ? 12 : 5,
                      height: window.innerWidth < 640 ? 12 : 5,
                      backgroundColor: "black",
                      cursor: "nwse-resize",
                      touchAction: 'none',
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (selectedElementId !== el.id) return;
                      resizeInfo.current = {
                        elementId: el.id,
                        corner: 'top-left',
                        startMouseX: e.clientX,
                        startMouseY: e.clientY,
                        startElX: el.x,
                        startElY: el.y,
                        startElH: el.height,
                        startElW: el.width,
                      };
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const touch=e.touches[0];
                      if (selectedElementId !== el.id) return;
                      resizeInfo.current = {
                        elementId: el.id,
                        corner: 'top-left',
                        startMouseX: touch.clientX,
                        startMouseY: touch.clientY,
                        startElX: el.x,
                        startElY: el.y,
                        startElH: el.height,
                        startElW: el.width,
                      };
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      top: window.innerWidth < 640 ? -6 : -2.5,
                      right: window.innerWidth < 640 ? -6 : -2.5,
                      width: window.innerWidth < 640 ? 12 : 5,
                      height: window.innerWidth < 640 ? 12 : 5,
                      backgroundColor: "black",
                      cursor: "nwse-resize",
                      touchAction: 'none',
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (selectedElementId !== el.id) return;
                      resizeInfo.current = {
                        elementId: el.id,
                        corner: 'top-right',
                        startMouseX: e.clientX,
                        startMouseY: e.clientY,
                        startElX: el.x,
                        startElY: el.y,
                        startElH: el.height,
                        startElW: el.width,
                      };
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const touch=e.touches[0];
                      if (selectedElementId !== el.id) return;
                      resizeInfo.current = {
                        elementId: el.id,
                        corner: 'top-right',
                        startMouseX: touch.clientX,
                        startMouseY: touch.clientY,
                        startElX: el.x,
                        startElY: el.y,
                        startElH: el.height,
                        startElW: el.width,
                      };
                    }}
                  ></div>
                  <div
                    style={
                      {
                        position: "absolute",
                        bottom: window.innerWidth < 640 ? -6 : -2.5,
                        right: window.innerWidth < 640 ? -6 : -2.5,
                        width: window.innerWidth < 640 ? 12 : 5,
                        height: window.innerWidth < 640 ? 12 : 5,
                        backgroundColor: "black",
                        cursor: "nwse-resize",
                        touchAction: 'none',
                      }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (selectedElementId !== el.id) return;
                      resizeInfo.current = {
                        elementId: el.id,
                        corner: 'bottom-right',
                        startMouseX: e.clientX,
                        startMouseY: e.clientY,
                        startElX: el.x,
                        startElY: el.y,
                        startElH: el.height,
                        startElW: el.width,
                      };
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const touch=e.touches[0];
                      if (selectedElementId !== el.id) return;
                      resizeInfo.current = {
                        elementId: el.id,
                        corner: 'bottom-right',
                        startMouseX: touch.clientX,
                        startMouseY: touch.clientY,
                        startElX: el.x,
                        startElY: el.y,
                        startElH: el.height,
                        startElW: el.width,
                      };
                    }}
                  ></div>
                  <div
                    style={
                      {
                        position: "absolute",
                        bottom: window.innerWidth < 640 ? -6 : -2.5,
                        left: window.innerWidth < 640 ? -6 : -2.5,
                        width: window.innerWidth < 640 ? 12 : 5,
                        height: window.innerWidth < 640 ? 12 : 5,
                        backgroundColor: "black",
                        cursor: "nwse-resize",
                        touchAction: 'none',
                      }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (selectedElementId !== el.id) return;
                      resizeInfo.current = {
                        elementId: el.id,
                        corner: 'bottom-left',
                        startMouseX: e.clientX,
                        startMouseY: e.clientY,
                        startElX: el.x,
                        startElY: el.y,
                        startElH: el.height,
                        startElW: el.width,
                      };
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const touch=e.touches[0];
                      if (selectedElementId !== el.id) return;
                      resizeInfo.current = {
                        elementId: el.id,
                        corner: 'bottom-left',
                        startMouseX: touch.clientX,
                        startMouseY: touch.clientY,
                        startElX: el.x,
                        startElY: el.y,
                        startElH: el.height,
                        startElW: el.width,
                      };
                    }}
                  ></div>
                </>
              )
              }

            </div>
          ))}
        </div>
        <div className="absolute bottom-2 left-2 text-sm text-gray-500" style={{ zIndex: 999 }}>
          {currentSlideIndex + 1}
        </div>
        {presentation.slides.length > 1 && (
          <React.Fragment>
            <button
              key="arrow-left"
              disabled={currentSlideIndex === 0}
              className={`absolute left-1 sm:left-2 text-xl sm:text-2xl ${currentSlideIndex === 0
                ? "opacity-30 cursor-not-allowed"
                : "cursor-pointer hover:scale-110"
              }`}
              onClick={() => setCurrentSlideIndex((i) => i - 1)}
            >
              ←
            </button>
            <button
              key="arrow-right"
              disabled={currentSlideIndex === presentation.slides.length - 1}
              className={`absolute right-2 text-2xl ${currentSlideIndex === presentation.slides.length - 1
                ? "opacity-30 cursor-not-allowed"
                : "cursor-pointer hover:scale-110"
              }`}
              onClick={() => setCurrentSlideIndex((i) => i + 1)}
            >
              →
            </button>
          </React.Fragment>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-3 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex gap-2 flex-wrap pb-1 sm:flex-wrap">
          <Button onClick={() => setShowSlidePanel(true)}>Slide Panel</Button>
          <Button onClick={handleAddSlide}>+ Add Slide</Button>
          <Button onClick={() => { setShowAddText(true) }} disabled={isSaving}>+ Add Text</Button>
          <Button onClick={() => { setShowAddImage(true) }} disabled={isSaving}>+ Add image</Button>
          <Button onClick={() => { setShowAddVideo(true) }} disabled={isSaving}>+ Add Video</Button>
          <Button onClick={() => { setShowAddCode(true) }} disabled={isSaving}>+ Add Code</Button>
          <Button onClick={() => { setShowBackground(true) }} disabled={isSaving}>+ Add background</Button>
          <Button variant="destructive" onClick={handleDeleteSlide} disabled={isSaving}>
          Delete Slide
          </Button>

          <div className="ml-auto w-64">
            <select
              className="border rounded px-2 py-1 w-full bg-white"
              value={slide.transition}
              onChange={async (e) => {
                const value = e.target.value as 'none' | 'slide-left' | 'slide-right';

                const updatedSlides = presentation.slides.map((s, i) =>
                  i === currentSlideIndex ? { ...s, transition: value } : s
                );

                await saveSlides(updatedSlides);
              }}
            >
              <option value="none">No animation</option>
              <option value="slide-right">Slide (from right)</option>
              <option value="slide-left">Slide (from left)</option>
            </select>
          </div>
        </div>
      </div>


      {showAddText && (
        <AddTextModal
          onClose={() => setShowAddText(false)}
          onSubmit={handleAddText}
          submitting={isSaving}
        />
      )}

      {editingElement && editingElement.type === 'text' && (
        <AddTextModal
          onClose={() => setEditingElement(null)}
          onSubmit={handleEditText}
          initialData={editingElement}
          submitting={isSaving}
        />
      )}

      {showAddImage && (
        <AddImageModal
          onClose={() => setShowAddImage(false)}
          onSubmit={handleAddImage}
          submitting={isSaving}
        />
      )}
      {editingElement && editingElement.type === 'image' && (
        <AddImageModal
          onClose={() => setEditingElement(null)}
          onSubmit={handleEditImage}
          initialData={editingElement}
          submitting={isSaving}
        />
      )}

      {showAddVideo && (
        <AddVideoModal
          onClose={() => setShowAddVideo(false)}
          onSubmit={handleAddVideo}
          submitting={isSaving}
        />
      )}
      {editingElement && editingElement.type === 'video' && (
        <AddVideoModal
          onClose={() => setEditingElement(null)}
          onSubmit={handleEditVideo}
          initialData={editingElement}
          submitting={isSaving}
        />
      )}

      {showBackground && (
        <AddBackgroundModal
          onClose={() => setShowBackground(false)}
          slideBackground={slide.background}
          defaultBackground={presentation.defaultBackground}
          onSlideBackgroundChange={handleSlideBackgroundChange}
          onDefaultBackgroundChange={handleDefaultBackgroundChange}
          submitting={isSaving}
        />
      )}

      {showAddCode && (
        <AddCodeModal
          onClose={() => setShowAddCode(false)}
          onSubmit={handleAddCode}
          submitting={isSaving}
        />
      )}
      {editingElement && editingElement.type === 'code' && (
        <AddCodeModal
          onClose={() => setEditingElement(null)}
          onSubmit={handleEditCode}
          initialData={editingElement}
          submitting={isSaving}
        />
      )}

      {showDeleteConfirm && (
        <div role="dialog" aria-modal="true" aria-label="Delete confirmation dialog" className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow">
            <p className="mb-4">Are you sure?</p>
            <div className="flex gap-3">
              <Button onClick={handleDeletePresentation} disabled={isSaving}>
                {isSaving ? 'Deleting...' : 'Yes'}
              </Button>
              <Button onClick={() => setShowDeleteConfirm(false)} disabled={isSaving}>
                No
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingTitle && (
        <div role="dialog" aria-modal="true" aria-label="Edit title dialog" className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow">
            <input
              className="border p-2 mb-4 w-full"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <label className="text-sm text-gray-500">Thumbnail URL</label>
            <input
              className="border p-2 mb-4 w-full"
              value={newThumbnail}
              onChange={(e) => setNewThumbnail(e.target.value)}
              placeholder="Thumbnail URL"
            />
            <div className="flex gap-3">
              <Button onClick={handleTitleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={() => setEditingTitle(false)} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      {error && (
        <div aria-live="assertive">  
          <ErrorPopup message={error} onClose={() => setError(null)} />
        </div>
      )}
      <div className="flex gap-2 mt-3 overflow-x-auto pb-2 snap-x">
        {presentation.slides.map((s, index) => (
          <div
            key={s.id}
            onClick={() => setCurrentSlideIndex(index)}
            className={`min-w-20 h-15 border flex items-center justify-center cursor-pointer ${index === currentSlideIndex
              ? "border-blue-500 ring-2 ring-blue-400"
              : "border-gray-300"
            }`}
          >
            <span className="text-sm">{`Slide ${index + 1}`}</span>
          </div>
        ))}
      </div>

      {showHistory && (
        <div role="dialog" aria-modal="true" aria-label="History popup" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-[95vw] sm:w-2/3 h-[90vh] p-3 sm:p-4 rounded flex flex-col">

            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-bold">History</h2>
              <Button onClick={() => setShowHistory(false)}>Close</Button>
            </div>

            <div className="overflow-auto flex flex-col gap-3">
              {(presentation.history || [])
                .slice()
                .reverse()
                .map((h: PresentationHistory) => (
                  <div
                    key={h.id}
                    className="border p-3 flex justify-between items-center"
                  >
                    <div>
                      <div className="text-sm font-semibold">
                        {new Date(h.timestamp).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {h.slides.length} slides
                      </div>
                    </div>

                    <Button onClick={() => handleRestoreHistory(h)}>
                      Restore
                    </Button>
                  </div>
                ))}
            </div>

          </div>
        </div>
      )}

      {showSlidePanel && (
        <div role="dialog" aria-modal="true" aria-label="Slide panel popup" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-[95vw] h-[90vh] rounded p-3 sm:p-4 flex flex-col">

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Slides</h2>
              <Button onClick={() => setShowSlidePanel(false)}>Close</Button>
            </div>

            <div className="flex-1 overflow-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
              {presentation.slides.map((s, index) => (
                <div
                  key={s.id}
                  draggable
                  //pick up slide
                  onDragStart={() => {
                    setDraggedIndex(index);
                  }}
                  //move it around 
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={async () => {
                    if (draggedSlide == null || draggedSlide == index) {
                      return;
                    }
                    else {
                      const newSlideSet = [...presentation.slides];
                      const [removedSlide] = newSlideSet.splice(draggedSlide, 1);
                      newSlideSet.splice(index, 0, removedSlide);

                      await saveSlides(newSlideSet);
                      setDraggedIndex(null);
                    }
                  }}
                  onClick={() => {
                    setCurrentSlideIndex(index);
                    setShowSlidePanel(false);
                  }}
                  className={`border shadow-sm bg-white cursor-pointer ${index === currentSlideIndex
                    ? "border-blue-500 ring-2 ring-blue-400"
                    : "border-gray-300"
                  }`}
                >
                  <div className="w-full aspect-video relative bg-gray-100">
                    <div
                      className="relative w-full h-full"
                      style={getSlideBackgroundStyle(s)}
                    >
                      {s.elements.map((el) => (
                        <div
                          key={el.id}
                          style={{
                            position: "absolute",
                            left: `${el.x}%`,
                            top: `${el.y}%`,
                            width: `${el.width}%`,
                            height: `${el.height}%`,
                          }}
                        >
                          {el.type === "text" && (
                            <div
                              style={{
                                fontSize: `${el.fontSize * 0.3}em`,
                                overflow: "hidden",
                              }}
                            >
                              {el.text}
                            </div>
                          )}

                          {el.type === "image" && (
                            <img
                              src={el.src}
                              className="w-full h-full object-contain"
                            />
                          )}
                          {el.type === "code" && (() => {
                            const highlighted = hljs.highlightAuto(el.code, ['javascript', 'python', 'c']);

                            return (
                              <pre
                                style={{
                                  fontSize: `${el.fontSize * 0.25}em`, // smaller for thumbnail
                                  margin: 0,
                                  padding: "2px",
                                  overflow: "hidden",
                                  whiteSpace: "pre-wrap",
                                  lineHeight: 1.1,
                                }}
                                className="hljs"
                              >
                                <code
                                  className={`language-${highlighted.language}`}
                                  dangerouslySetInnerHTML={{ __html: highlighted.value }}
                                />
                              </pre>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </main>
  );
};

export default PresentationPage;
