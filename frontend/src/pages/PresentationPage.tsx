import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import React, { useEffect, useRef, useState } from "react";
import {
  getStore as getStoreApi,
  updateStore as updateStoreApi,
} from "../services/api";
import type { Presentation, SlideElement } from "../types";
import { Button } from "../components/ui/button";
import ErrorPopup from "../components/common/ErrorPopup";
import AddTextModal from "@/components/common/slides/AddTextModal";
import AddImageModal from "@/components/common/slides/AddImageModal";
import AddVideoModal from "@/components/common/slides/AddVideoModal";


//plugin for code recongnising
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
  const slideRef=useRef<HTMLDivElement>(null);

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingElement,setEditingElement]=useState<SlideElement | null>(null);
  const [selectedElementId,setSelectedElementId]=useState<string|null>('');

  // slide elements
  const [showAddText, setShowAddText] = useState(false);
  const [showAddImage,setShowAddImage]=useState(false);
  const [showAddVideo,setShowAddVideo]=useState(false);
  const [showAddCode,setShowAddCode]=useState(false);

  //moving part
  const dragInfo = useRef<{
    elementId: string;
    startMouseX: number;  
    startMouseY: number;
    startElX: number;     
    startElY: number;
} | null>(null);

  //code element logic
  const handleAddCode=async(width: number, height: number, code: string,fontSize:number)=>{
    if(!presentation) return;
    const currentSlide = presentation.slides[currentSlideIndex];
    const maxZIndex = currentSlide.elements.length === 0
      ? 0
      : Math.max(...currentSlide.elements.map(el => el.zIndex));
    const newCodeElement = {
      id: crypto.randomUUID(),
      type:'code',
      x:0,y:0,
      width:width,
      height:height,
      code:code,
      fontSize:fontSize,
      zIndex:maxZIndex+1 //max zindex of current element +1
    };
    const updatedElements = [...currentSlide.elements, newCodeElement];
    const updatedSlides=presentation.slides.map((s,index)=>{
      return index===currentSlideIndex ? {...s,elements:updatedElements}:s;
    })
    await saveSlides(updatedSlides);
    setShowAddCode(false)
  };
  const handleEditCode =async (width: number, height: number, code: string,fontSize:number,x:number,y:number)=>{
    const EditingVideoElement = {
      ...editingElement,
      x,y,width,height,code,fontSize
    };
    if(!presentation) return;
    const currentSlide = presentation.slides[currentSlideIndex];
    const updatedElements = currentSlide.elements.map((el) =>
      el.id === editingElement?.id ? EditingVideoElement : el
    );
    const updatedSlides=presentation.slides.map((s,index)=>{
      return index===currentSlideIndex ? {...s,elements:updatedElements}:s;
    })
    await saveSlides(updatedSlides);
    setEditingElement(null)
  };

  //video element logic
  const handleAddVideo=async(width: number, height: number, src: string,autoplay:boolean)=>{
    if(!presentation) return;
    const currentSlide = presentation.slides[currentSlideIndex];
    const maxZIndex = currentSlide.elements.length === 0
      ? 0
      : Math.max(...currentSlide.elements.map(el => el.zIndex));
    const newVideoElement = {
      id: crypto.randomUUID(),
      type:'video',
      x:0,y:0,
      width:width,
      height:height,
      src:src,
      autoplay:autoplay,
      zIndex:maxZIndex+1 //max zindex of current element +1
    };
    const updatedElements = [...currentSlide.elements, newVideoElement];
    const updatedSlides=presentation.slides.map((s,index)=>{
      return index===currentSlideIndex ? {...s,elements:updatedElements}:s;
    })
    await saveSlides(updatedSlides);
    setShowAddVideo(false)
  };
  const handleEditVideo =async (width: number, height: number, src: string,autoplay:boolean,x:number,y:number)=>{
    const EditingVideoElement = {
      ...editingElement,
      x,y,width,height,src,autoplay
    };
    if(!presentation) return;
    const currentSlide = presentation.slides[currentSlideIndex];
    const updatedElements = currentSlide.elements.map((el) =>
      el.id === editingElement?.id ? EditingVideoElement : el
    );
    const updatedSlides=presentation.slides.map((s,index)=>{
      return index===currentSlideIndex ? {...s,elements:updatedElements}:s;
    })
    await saveSlides(updatedSlides);
    setEditingElement(null)
  };

  //image element logic
  const handleAddImage=async(width: number, height: number, src: string,alt:string)=>{
    if(!presentation) return;
    const currentSlide = presentation.slides[currentSlideIndex];
    const maxZIndex = currentSlide.elements.length === 0
      ? 0
      : Math.max(...currentSlide.elements.map(el => el.zIndex));
    const newImageElement = {
      id: crypto.randomUUID(),
      type:'image',
      x:0,y:0,
      width:width,
      height:height,
      src:src,
      alt:alt,
      zIndex:maxZIndex+1 //max zindex of current element +1
    };
    const updatedElements = [...currentSlide.elements, newImageElement];
    const updatedSlides=presentation.slides.map((s,index)=>{
      return index===currentSlideIndex ? {...s,elements:updatedElements}:s;
    })
    await saveSlides(updatedSlides);
    setShowAddImage(false)
  };
  const handleEditImage =async (width: number, height: number, src: string,alt:string,x:number,y:number)=>{
    const EditingImageElement = {
      ...editingElement,
      x,y,width,height,src,alt
    };
    if(!presentation) return;
    const currentSlide = presentation.slides[currentSlideIndex];
    const updatedElements = currentSlide.elements.map((el) =>
      el.id === editingElement?.id ? EditingImageElement : el
    );
    const updatedSlides=presentation.slides.map((s,index)=>{
      return index===currentSlideIndex ? {...s,elements:updatedElements}:s;
    })
    await saveSlides(updatedSlides);
    setEditingElement(null)
  };


  //text element logic
  const handleAddText=async(text: string, color: string, width: number, height: number, fontSize: number)=>{
    if(!presentation) return;
    const currentSlide = presentation.slides[currentSlideIndex];
    const maxZIndex = currentSlide.elements.length === 0
      ? 0
      : Math.max(...currentSlide.elements.map(el => el.zIndex));
    const newTextElement = {
      id: crypto.randomUUID(),
      type:'text',
      x:0,y:0,
      width:width,
      height:height,
      text:text,
      color:color,
      fontSize:fontSize,
      zIndex:maxZIndex+1 //max zindex of current element +1
    };
    const updatedElements = [...currentSlide.elements, newTextElement];
    const updatedSlides=presentation.slides.map((s,index)=>{
      return index===currentSlideIndex ? {...s,elements:updatedElements}:s;
    })
    await saveSlides(updatedSlides);
    setShowAddText(false)
  };
  const handleEditText =async (text: string, color: string, width: number, height: number, fontSize: number,x:number,y:number)=>{
    const EditingTextElement = {
      ...editingElement,
      x,y,width,height,text,color,fontSize
    };
    if(!presentation) return;
    const currentSlide = presentation.slides[currentSlideIndex];
    const updatedElements = currentSlide.elements.map((el) =>
      el.id === editingElement?.id ? EditingTextElement : el
    );
    const updatedSlides=presentation.slides.map((s,index)=>{
      return index===currentSlideIndex ? {...s,elements:updatedElements}:s;
    })
    await saveSlides(updatedSlides);
    setEditingElement(null)
  };

  //effect function
  useEffect(() => {
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
      setPresentation(found);
      setNewTitle(found.name);
    };

    fetchData();
  }, [token, id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!presentation) return;
      if (e.key === "ArrowLeft" && currentSlideIndex > 0) {
        setCurrentSlideIndex((i) => i - 1);
      }
      if (
        e.key === "ArrowRight" &&
        currentSlideIndex < presentation.slides.length - 1
      ) {
        setCurrentSlideIndex((i) => i + 1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentSlideIndex, presentation]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
    if (!dragInfo.current || !slideRef.current || !presentation) return;
    e.preventDefault();
    const rect = slideRef.current.getBoundingClientRect();
    
    // how many pixels mouse moved
    const deltaX = ((e.clientX - dragInfo.current.startMouseX) / rect.width) * 100;
    const deltaY = ((e.clientY - dragInfo.current.startMouseY) / rect.height) * 100;
    
    // new start= old one + moving distance
    let newX = dragInfo.current.startElX + deltaX;
    let newY = dragInfo.current.startElY + deltaY;
    
    // find current element,and get width and height from it
    const currentSlide = presentation.slides[currentSlideIndex];
    const el = currentSlide.elements.find(e => e.id === dragInfo.current!.elementId);
    if (!el) return;
    
    // boudary limits
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
    };

    const handleMouseUp = () => {
      if (!dragInfo.current) return ;
      dragInfo.current=null;
      if (presentation){
        saveSlides(presentation.slides);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [currentSlideIndex, presentation]);


  if (!presentation) return <div>Loading...</div>;
  const saveSlides = async (slides: any[]) => {
    if (!token) return;
    const data = await getStoreApi(token);
    const updated = data.store.presentations.map((p: Presentation) =>
      p.id === id ? { ...p, slides } : p
    );
    await updateStoreApi(token, { presentations: updated });
    setPresentation((prev) => prev && { ...prev, slides });
  };

  const handleAddSlide = async () => {
    const newSlide = {
      id: crypto.randomUUID(),
      elements: [],
      background: "",
    };
    const updatedSlides = [...presentation.slides, newSlide];
    await saveSlides(updatedSlides);
    setCurrentSlideIndex(updatedSlides.length - 1);
  };

  const handleDeleteSlide = async () => {
    if (presentation.slides.length === 1) {
      setError("Only one slide left. Delete the presentation instead.");
      return;
    }
    const updatedSlides = presentation.slides.filter(
      (_, index) => index !== currentSlideIndex
    );
    await saveSlides(updatedSlides);
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const handleDeletePresentation = async () => {
    if (!token) return;
    const data = await getStoreApi(token);
    const updated = data.store.presentations.filter(
      (p: Presentation) => p.id !== id
    );
    await updateStoreApi(token, { presentations: updated });
    navigate("/dashboard");
  };

  const handleTitleSave = async () => {
    if (!token) return;

    const data = await getStoreApi(token);

    const updated = data.store.presentations.map((p: Presentation) =>
      p.id === id ? { ...p, name: newTitle } : p
    );

    await updateStoreApi(token, { presentations: updated });

    setPresentation((prev) => prev && { ...prev, name: newTitle });
    setEditingTitle(false);
  };

  const slide = presentation.slides[currentSlideIndex];

  return (
    <div className="min-h-screen p-6 relative">
      <div className="flex justify-between items-center mb-4">
        <Button onClick={() => navigate("/dashboard")}>Back</Button>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete Presentation
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold">{presentation.name}</h2>
        <Button size="sm" onClick={() => setEditingTitle(true)}>
          Edit
        </Button>
      </div>


      <div className="relative border h-100 flex items-center justify-center bg-gray-100">
        <div className="absolute inset-0" onClick={()=>setSelectedElementId(null)} ref={slideRef}>
          {slide.elements.map((el) => (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.width}%`,
                height: `${el.height}%`,
                zIndex: el.zIndex,
                border: selectedElementId === el.id ? '2px solid blue' : 'none',
              }}
              onContextMenu={async(e)=>{
                e.preventDefault();
                const updatedSlide = slide.elements.filter(
                  (element) => element.id !== el.id
                );
                const updatedSlides=presentation.slides.map((s,index)=>{
                  return index===currentSlideIndex ? {...s,elements:updatedSlide}:s;
                })
                await saveSlides(updatedSlides);
              }}
              onDoubleClick={()=> setEditingElement(el)}
              onClick={(e)=>{
                e.preventDefault();
                e.stopPropagation();
                setSelectedElementId(el.id)}}
              onMouseDown={(e)=>{
                e.stopPropagation();
                if (selectedElementId !==el.id) return ;
                dragInfo.current = {
                  elementId: el.id,
                  startMouseX: e.clientX,    
                  startMouseY: e.clientY,
                  startElX: el.x,            
                  startElY: el.y,
                };
              }}
            >
            {el.type === 'text' && (
              <div 
              className="w-full h-full border border-gray-300 text-left overflow-auto whitespace-normal"
              style={{
                fontSize: `${el.fontSize}em`,
                color:el.color
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
                src={`${el.src}${el.autoplay ? '?autoplay=1' : ''}`}
                className="w-full h-full"
                allow="autoplay"
                title="video"
                style={{ pointerEvents: 'none' }}
              />
            )}

            {el.type === 'code' && (() => {
              const highlighted = hljs.highlightAuto(el.code, ['javascript', 'python', 'c']);
              return (
                <pre
                  className="w-full h-full border border-gray-300 overflow-auto m-0"
                  style={{ fontSize: `${el.fontSize}em`, whiteSpace: 'pre' , userSelect:'none'}}
                >
                  <code
                    className={`hljs language-${highlighted.language}`}
                    dangerouslySetInnerHTML={{ __html: highlighted.value }}
                  />
                </pre>
              );
            })()}

            {selectedElementId==el.id &&(
              <>
                <div 
                  style={
                    {
                      position:"absolute",
                      top:-2.5,
                      left:-2.5,
                      width:5,
                      height:5,
                      backgroundColor:"black",
                      cursor:"nwse-resize"
                    }
                  }></div>
                <div 
                  style={
                    {
                      position:"absolute",
                      top:-2.5,
                      right:-2.5,
                      width:5,
                      height:5,
                      backgroundColor:"black",
                      cursor:"nwse-resize"
                    }
                  }></div>
                <div 
                  style={
                    {
                      position:"absolute",
                      bottom:-2.5,
                      left:-2.5,
                      width:5,
                      height:5,
                      backgroundColor:"black",
                      cursor:"nwse-resize"
                    }
                  }></div>
                <div 
                  style={
                    {
                      position:"absolute",
                      bottom:-2.5,
                      right:-2.5,
                      width:5,
                      height:5,
                      backgroundColor:"black",
                      cursor:"nwse-resize"
                    }
                  }></div>
              </>
            )
          }

            </div>
        ))}
        </div>
        
        {presentation.slides.length > 1 && (
          <React.Fragment>
            <button
            key="arrow-left"
            disabled={currentSlideIndex === 0}
            className={`absolute left-2 text-2xl ${
                currentSlideIndex === 0
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
            className={`absolute right-2 text-2xl ${
                currentSlideIndex === presentation.slides.length - 1
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

      <div className="flex gap-3 mt-4">
        <Button onClick={handleAddSlide}>+ Add Slide</Button>
        <Button onClick={()=>{setShowAddText(true)}}>+ Add Text</Button>
        <Button onClick={()=>{setShowAddImage(true)}}>+ Add image</Button>
        <Button onClick={()=>{setShowAddVideo(true)}}>+ Add Video</Button>
        <Button onClick={()=>{setShowAddCode(true)}}>+ Add Code</Button>
        <Button variant="destructive" onClick={handleDeleteSlide}>
          Delete Slide
        </Button>
      </div>

      {showAddText && (
        <AddTextModal
          onClose={() => setShowAddText(false)}
          onSubmit={handleAddText}
        />
      )}

      {editingElement && editingElement.type === 'text' && (
        <AddTextModal
          onClose={() => setEditingElement(null)}
          onSubmit={handleEditText}
          initialData={editingElement}
        />
      )}

      {showAddImage && (
        <AddImageModal
          onClose={() => setShowAddImage(false)}
          onSubmit={handleAddImage}
        />
      )}
      {editingElement && editingElement.type === 'image' && (
        <AddImageModal
          onClose={() => setEditingElement(null)}
          onSubmit={handleEditImage}
          initialData={editingElement}
        />
      )}

      {showAddVideo && (
        <AddVideoModal
          onClose={() => setShowAddVideo(false)}
          onSubmit={handleAddVideo}
        />
      )}
      {editingElement && editingElement.type === 'video' && (
        <AddVideoModal
          onClose={() => setEditingElement(null)}
          onSubmit={handleEditVideo}
          initialData={editingElement}
        />
      )}

      {showAddCode && (
        <AddCodeModal
          onClose={() => setShowAddCode(false)}
          onSubmit={handleAddCode}
        />
      )}
      {editingElement && editingElement.type === 'code' && (
        <AddCodeModal
          onClose={() => setEditingElement(null)}
          onSubmit={handleEditCode}
          initialData={editingElement}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow">
            <p className="mb-4">Are you sure?</p>
            <div className="flex gap-3">
              <Button onClick={handleDeletePresentation}>Yes</Button>
              <Button onClick={() => setShowDeleteConfirm(false)}>
                No
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingTitle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow">
            <input
              className="border p-2 mb-4 w-full"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <div className="flex gap-3">
              <Button onClick={handleTitleSave}>Save</Button>
              <Button onClick={() => setEditingTitle(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      {error && (
        <ErrorPopup message={error} onClose={() => setError(null)} />
       )}
       <div className="flex gap-2 mt-4 overflow-x-auto">
        {presentation.slides.map((s, index) => (
            <div
            key={s.id}
            onClick={() => setCurrentSlideIndex(index)}
            className={`min-w-20 h-15 border flex items-center justify-center cursor-pointer ${
                index === currentSlideIndex
                ? "border-blue-500 ring-2 ring-blue-400"
                : "border-gray-300"
            }`}
            >
            <span className="text-sm">{index + 1}</span>
            </div>
        ))}
        </div>
    </div>
  );
};

export default PresentationPage;