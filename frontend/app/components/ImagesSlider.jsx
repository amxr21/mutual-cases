"use client"
import { ImageContainer } from './index';
import { Image1, Image2, Image3, Image4, Image5, Image6 } from "../constants/imags";

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Autoplay, FreeMode } from 'swiper/modules';

/**
 * Hero image strip — an endless, continuously-moving marquee.
 *
 * The seamless conveyor effect comes from:
 *   - loop: true                     -> infinite wrap-around
 *   - autoplay.delay: 0              -> never pauses between slides
 *   - speed: large + linear easing   -> constant smooth motion (no stepping)
 *   - freeMode                       -> slides flow instead of snapping
 *
 * disableOnInteraction:false keeps it moving after hover/touch.
 */

const IMAGES = [Image1, Image2, Image3, Image4, Image5, Image6]

function ImagesSlider() {
  return (
    <div className='w-full overflow-hidden'>
      <Swiper
        modules={[Autoplay, FreeMode]}
        slidesPerView={'auto'}
        spaceBetween={14}
        loop={true}
        freeMode={true}
        speed={6000}
        allowTouchMove={true}
        autoplay={{
          delay: 0,
          disableOnInteraction: false,
          pauseOnMouseEnter: false,
        }}
        className="mySwiper hero-marquee"
      >
        {/* Duplicate the set so the loop always has slides filling the viewport. */}
        {[...IMAGES, ...IMAGES].map((img, indx) => (
          <SwiperSlide key={indx} style={{ width: 'auto' }}>
            <ImageContainer pos={indx % IMAGES.length} imageSrc={img} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default ImagesSlider
