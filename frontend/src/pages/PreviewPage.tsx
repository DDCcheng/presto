import { useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEffect, useState } from "react";
import { getStore as getStoreApi } from "../services/api";
import type { Presentation } from "../types";

const PreviewPage = () => {
  const { id } = useParams();
  const { token } = useAuth();

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const fetchData = async () => {
    if (!token) return;

    const data = await getStoreApi(token);
    const found = data.store.presentations.find(
      (p: Presentation) => p.id === id
    );

    setPresentation(found ?? null);
  };

  useEffect(() => {
    fetchData();
  }, [token, id]);


  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!presentation) return;

      if (e.key === "ArrowLeft" && currentSlideIndex > 0) {
        setCurrentSlideIndex(i => i - 1);
      }
      if (e.key === "ArrowRight" && currentSlideIndex < presentation.slides.length - 1) {
        setCurrentSlideIndex(i => i + 1);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentSlideIndex, presentation]);


  if (!presentation) return <div>Loading...</div>;

  const slide =
  presentation.slides[currentSlideIndex] ??
  presentation.slides[0];

  const getBackgroundStyle = () => {
  const slide = presentation.slides[currentSlideIndex];

  const bg = slide.background || presentation.defaultBackground;

  if (!bg) return { backgroundColor: "white" };

  if (bg.type === "solid") {
    return { backgroundColor: bg.color };
  }

  if (bg.type === "gradient") {
    return {
      background: `linear-gradient(to right, ${bg.gradientStart}, ${bg.gradientEnd})`,
    };
  }

  if (bg.type === "image") {
    return {
      backgroundImage: `url(${bg.image})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  return { backgroundColor: "white" };
};

  return (
    <div className="w-screen h-screen relative" style={getBackgroundStyle()}>

      <div className="w-full h-full relative">
        {slide.elements.map((el) => (
          <div
            key={el.id}
            style={{
              position: "absolute",
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.width}%`,
              height: `${el.height}%`,
              zIndex: el.zIndex,
            }}
          >
            

            
          </div>
        ))}
      </div>

      

    </div>
  );
};

export default PreviewPage;