import { useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEffect, useState } from "react";
import { getStore as getStoreApi } from "../services/api";
import type { Presentation, Slide, SlideElement } from "../types";
import { buildVideoSrc } from "../lib/utils";

import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import c from "highlight.js/lib/languages/c";
import "highlight.js/styles/github.css";

//supported languages for syntax highlighting
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("c", c);

//Slideshow viewing page
const PreviewPage = () => {
  const { id } = useParams();
  const { token } = useAuth();
  //loaded presentation data
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  //initial slide index from url
  const urlSlide = Number(searchParams.get("slide")) || 0;
  const [currentSlideIndex, setCurrentSlideIndex] = useState(urlSlide);

  const [prevSlideIndex, setPrevSlideIndex] = useState<number | null>(null);
  //animation state controls 
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  /*
   * Navigate to a specific slide index
   * Handles bounds, transitions, and URL sync
   */
  const goToSlide = (index: number) => {
    if (!presentation) return;
    if (isAnimating) return;

    //clamp index with a safe range
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

  /*
   * Fetch presentation data from API
   */
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      if (!token) return;
      const data = await getStoreApi(token);
      //find presentation by route id
      const found = data.store.presentations.find(
        (p: Presentation) => p.id === id
      );
      if (cancelled) return;
      if (found) {
        setPresentation(found);
        //get slide index from url 
        const urlSlide = Number(searchParams.get("slide")) || 0;
        const safeIndex = Math.max(0, Math.min(urlSlide, found.slides.length - 1));
        setCurrentSlideIndex(safeIndex);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [token, id]);

  /*
   * Keyboard navigation (arrow keys)
   */
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

  if (!presentation) return <div>Loading...</div>;

  const slide =
  presentation.slides[currentSlideIndex] ??
  presentation.slides[0];

  /*
   * Compute slide background (solid, gradient, image)
   */
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

  /*
   * Render all elements inside a slide (text, image, video, code)
   */
  const renderSlide = (s: Slide) =>
    s.elements.map((el: SlideElement) => (
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
            className="w-full h-full  overflow-auto whitespace-normal text-left"
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
            src={buildVideoSrc(el.src, el.autoplay)}
            className="w-full h-full"
            title="video"
            allow="autoplay"
          />
        )}

        {el.type === "code" && (() => {
          const highlighted = hljs.highlightAuto(el.code, [
            "javascript",
            "python",
            "c",
          ]);

          return (
            <pre className="w-full h-full overflow-auto m-0">
              <code
                className={`hljs language-${highlighted.language}`}
                dangerouslySetInnerHTML={{ __html: highlighted.value }}
              />
            </pre>
          );
        })()}
      </div>
    ));

  const prevTransform = () => {
    if (!isAnimating) return "translateX(0%)";

    return direction === "left"
      ? "translateX(-100%)"
      : "translateX(100%)";
  };

  const currentTransform = () => {
    if (!isAnimating) return "translateX(0%)";

    return direction === "left"
      ? "translateX(100%)"
      : "translateX(-100%)";
  };

  return (
    <div className="w-screen h-screen relative" style={getBackgroundStyle()} aria-label={`Presentation viewer: ${presentation.name}`}>

      {prevSlideIndex !== null && (
        <div
          className="absolute w-full h-full transition-transform duration-300 ease-in-out"
          style={{
            transform: prevTransform(),
          }}
          aria-hidden="true"
        >
          {renderSlide(presentation.slides[prevSlideIndex])}
        </div>
      )}

      <div
        className="absolute w-full h-full transition-transform duration-300 ease-in-out"
        style={{
          transform: currentTransform(),
        }}
        aria-live="polite"
      >
        {renderSlide(slide)}
      </div>

      <button
        className="absolute left-5 top-1/2 text-black text-3xl"
        disabled={currentSlideIndex === 0}
        onClick={() => goToSlide(currentSlideIndex - 1)}
        aria-label="Previous slide"
      >
        ←
      </button>

      <button
        className="absolute right-5 top-1/2 text-black text-3xl"
        disabled={currentSlideIndex === presentation.slides.length - 1}
        onClick={() => goToSlide(currentSlideIndex + 1)}
        aria-label="Next slide"
      >
        →
      </button>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-black" aria-live="polite">
        {currentSlideIndex + 1} / {presentation.slides.length}
      </div>

    </div>
  );
};

export default PreviewPage;
