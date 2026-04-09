import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEffect, useState } from "react";
import {
  getStore as getStoreApi,
  updateStore as updateStoreApi,
} from "../services/api";
import type { Presentation } from "../types";
import { Button } from "../components/ui/button";
import ErrorPopup from "../components/common/ErrorPopup";

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

  
};

export default PresentationPage;