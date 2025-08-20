"use client" 
import { ImageContainer } from './index';
import { Image1, Image2, Image3, Image4, Image5, Image6 } from "../constants/imags";

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Autoplay } from 'swiper/modules';
 

function ImagesSlider() {
  return (
    <div className='w-full  '>
      <Swiper
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        slidesPerView={'auto'}
        spaceBetween={14} 
        height={'10px'}
        modules={[Autoplay]} 
        className="mySwiper" 
      >
        {
          [Image1, Image2, Image3, Image4, Image5, Image6, Image2, Image3, Image4, Image5, Image6].map((img, indx) => { 
            return (
              <SwiperSlide>
                <ImageContainer pos={indx} imageSrc={img} />
              </SwiperSlide>
            )
          })
        }

      </Swiper>
    </div>
  )
}

export default ImagesSlider