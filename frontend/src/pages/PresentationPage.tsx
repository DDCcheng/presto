import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import React, { useEffect, useState } from "react";
import {
  getStore as getStoreApi,
  updateStore as updateStoreApi,
} from "../services/api";
import type { Presentation, SlideElement } from "../types";
import { Button } from "../components/ui/button";
import ErrorPopup from "../components/common/ErrorPopup";
import AddTextModal from "@/components/common/slides/AddTextModal";

const PresentationPage = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingElement,setEditingElement]=useState<SlideElement | null>(null);

  // slide elements
  const [showAddText, setShowAddText] = useState(false);


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

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      const data = await getStoreApi(token);
      const found = data.store.presentations.find(
        (p: Presentation) => p.id === id
      );
      console.log('found:', JSON.stringify(found, null, 2));
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
      console.log('slides:', JSON.stringify(presentation.slides, null, 2));
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
        <div className="absolute inset-0">
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