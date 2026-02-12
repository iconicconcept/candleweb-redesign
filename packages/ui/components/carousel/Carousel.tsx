import { CarouselProvider, Slider, Slide, DotGroup } from "pure-react-carousel";
import "pure-react-carousel/dist/react-carousel.es.css";

export interface ICarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  videos: string[];
}

export const VideoCarousel = (props: ICarouselProps) => {
  return (
    <div className="w-full h-full relative max-w-[545px] max-h-[346px]">
      <CarouselProvider
        naturalSlideWidth={500}
        naturalSlideHeight={300}
        totalSlides={props.videos.length}
        touchEnabled={false}
        dragEnabled={false}
      >
        <Slider>
          {props.videos.map((video, index) => (
            <Slide index={index} key={index}>
              <div className="overlay m-[10px] sm:m-[5px] sm:mx-auto lg:w-[400px] lg:h-[300px] xs:!max-w-[300px] sm:max-w-[330px] sm:max-h-[230px] !w-web !h-web">
                <div className="p-2 rounded-2xl h-full w-full bg-[#2A2B33]">
                  <iframe
                    className="frame w-web h-web sm:w-full sm:h-full rounded-2xl overflow-hidden"
                    src={video}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </Slide>
          ))}
        </Slider>
        <DotGroup className="flex items-center gap-5 justify-center absolute -bottom-[25px]  left-1/2 -translate-x-1/2" />
      </CarouselProvider>
    </div>
  );
};
