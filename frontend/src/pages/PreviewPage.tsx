import { useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEffect, useState } from "react";
import { getStore as getStoreApi } from "../services/api";
import type { Presentation } from "../types";


const PreviewPage = () => {
  const { id } = useParams();
  const { token } = useAuth();

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

const urlSlide = Number(searchParams.get("slide")) || 0;
const [currentSlideIndex, setCurrentSlideIndex] = useState(urlSlide);

const [prevSlideIndex, setPrevSlideIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

const goToSlide = (index: number) => {
    if (!presentation) return;
    if (isAnimating) return;

    const safeIndex = Math.max(
      0,
      Math.min(index, presentation.slides.length - 1)
    );

    const currentSlide = presentation.slides[currentSlideIndex];
    const transition = currentSlide.transition || "none";

    if (transition === "none") {
      setCurrentSlideIndex(safeIndex);
      setSearchParams({ slide: String(safeIndex) });
      return;
    }

    const dir: "left" | "right" =
      transition === "slide-left" ? "left" : "right";

    setDirection(dir);
    setPrevSlideIndex(currentSlideIndex);
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentSlideIndex(safeIndex);
      setPrevSlideIndex(null);
      setDirection(null);
      setIsAnimating(false);
      setSearchParams({ slide: String(safeIndex) });
    }, 300);
  };


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
        goToSlide(currentSlideIndex - 1);
      }
      if (e.key === "ArrowRight" && currentSlideIndex < presentation.slides.length - 1) {
        goToSlide(currentSlideIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentSlideIndex, presentation]);

  useEffect(() => {
    if (!presentation) return;

    const urlSlide = Number(searchParams.get("slide")) || 0;

    const safeIndex = Math.max(
        0,
        Math.min(urlSlide, presentation.slides.length - 1)
    );

    setCurrentSlideIndex(safeIndex);
    }, [presentation]);


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
            {el.type === "text" && (
              <div
                className="w-full h-full"
                style={{
                  fontSize: `${el.fontSize}em`,
                  color: el.color,
                  fontFamily: el.fontFamily,
                }}
              >
                {el.text}
              </div>
            )}

            {el.type === "image" && (
              <img src={el.src} alt={el.alt} className="w-full h-full object-contain" />
            )}

            {el.type === "video" && (
              <iframe
                src={el.src}
                className="w-full h-full"
                title="video"
                allow="autoplay"
              />
            )}

            {el.type === "code" && (
              <pre className="w-full h-full overflow-auto">
                <code>{el.code}</code>
              </pre>
            )}
          </div>
        ))}
      </div>

      <button
        className="absolute left-5 top-1/2 text-black text-3xl"
        disabled={currentSlideIndex === 0}
        onClick={() => goToSlide(currentSlideIndex - 1)}
      >
        ←
      </button>

      <button
        className="absolute right-5 top-1/2 text-black text-3xl"
        disabled={currentSlideIndex === presentation.slides.length - 1}
        onClick={() => goToSlide(currentSlideIndex + 1)}
      >
        →
      </button>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-black">
        {currentSlideIndex + 1} / {presentation.slides.length}
      </div>

    </div>
  );
};

export default PreviewPage;