import { CarouselProvider, Slider, Slide, DotGroup, CarouselContext } from "pure-react-carousel";
import "pure-react-carousel/dist/react-carousel.es.css";
import { ReactNode, DragEvent, useEffect, useRef } from "react";

interface ICarouselProps {
  children: ReactNode[];
  onChange?: (index: number) => void;
}

const useDraggedSlideIndex = () => {
  const draggedSlideIndexRef = useRef<number | null>(null);

  useEffect(() => {


    const handleDragEnd = () => {
      draggedSlideIndexRef.current = null;
    };

    document.addEventListener('dragstart', (event) => {
      console.log(parseInt((event.target as HTMLDivElement)?.dataset.index!, 10));
      draggedSlideIndexRef.current = parseInt((event.target as HTMLDivElement)?.dataset.index!, 10);
    });
    document.addEventListener('dragend', handleDragEnd);

    return () => {
      document.removeEventListener('dragstart', (event) => {
        console.log(parseInt((event.target as HTMLDivElement)?.dataset.index!, 10));
        draggedSlideIndexRef.current = parseInt((event.target as HTMLDivElement)?.dataset.index!, 10);
      });
      document.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  return draggedSlideIndexRef.current;
};

export const DotCarousel = (props: ICarouselProps) => {
  // const draggedSlideIndex = useDraggedSlideIndex();

  return (
    <CarouselProvider
      naturalSlideWidth={500}
      naturalSlideHeight={300}
      totalSlides={props.children.length}
      touchEnabled={true}
      dragEnabled={true}

    >
      <Slider>
        {props.children.map((widget, index) => (
          <Slide index={index} key={index + "carousel"} className="cursor-grap" data-index={index.toString()}>
            {widget}
          </Slide>
        ))}
      </Slider>
      <DotGroup className="flex items-center gap-5 justify-center [&>button]:w-3 [&>button]:h-3 -translate-y-2 sm:pt-2" />
      {/* {draggedSlideIndex !== null && (
        <div>Currently Dragged Slide Index: {draggedSlideIndex}</div>
      )} */}
    </CarouselProvider>
  );
};
