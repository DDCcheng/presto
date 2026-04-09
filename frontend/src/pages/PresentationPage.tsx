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

  
};

export default PresentationPage;