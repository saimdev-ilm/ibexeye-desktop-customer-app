import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination"; // Import pagination styles
import "../styles/addonsSlider.css";
import {
  FaShieldAlt,
  FaCloud,
  FaMapMarkedAlt,
  FaFireAlt,
  FaSmile,
  FaThermometer,
  FaDigitalTachograph,
  FaCube,
} from "react-icons/fa";

const sliderData = [
  {
    title: "Cybersecurity Add-Ons",
    description: "Network protection and enhanced security features",
    Icon: FaShieldAlt,
    altText: "Cybersecurity Add-Ons",
    btnText: "Request Demo",
    btnLink: "#",
  },
  {
    title: "Remote Firmware Update",
    description: "Capability to update firmware remotely and securely",
    Icon: FaCloud, // Replace with an appropriate React icon
    altText: "Remote Firmware Update",
    btnText: "Request Demo",
    btnLink: "#",
  },
  {
    title: "Heat Maps",
    description: "Visualize high activity areas for better analysis",
    Icon: FaMapMarkedAlt, // Replace with an appropriate React icon
    altText: "Heat Maps for High Activity Areas",
    btnText: "Request Demo",
    btnLink: "#",
  },
  {
    title: "Smoke & Fire Detection",
    description: "Visual detection of smoke and fire for enhanced safety",
    Icon: FaFireAlt, // Replace with an appropriate React icon
    altText: "Visual Smoke and Fire Detection",
    btnText: "Request Demo",
    btnLink: "#",
  },
  {
    title: "Facial Recognition",
    description: "Enhanced algorithms for better facial recognition",
    Icon: FaSmile, // Replace with an appropriate React icon
    altText: "Enhanced Facial Recognition Algorithms",
    btnText: "Request Demo",
    btnLink: "#",
  },
  {
    title: "Thermographic Mapping",
    description: "Pipeline mapping using thermographic imaging",
    Icon: FaThermometer, // Replace with an appropriate React icon
    altText: "Thermographic Mapping of Pipelines",
    btnText: "Request Demo",
    btnLink: "#",
  },
  {
    title: "Digital Twin",
    description: "Track assets digitally for efficient management",
    Icon: FaDigitalTachograph, // Replace with an appropriate React icon
    altText: "Digital Twin for Asset Tracking",
    btnText: "Request Demo",
    btnLink: "#",
  },
  {
    title: "Augmented Reality",
    description: "Live data overlay using AR technology",
    Icon: FaCube, // Replace with an appropriate React icon
    altText: "Augmented Reality (AR) for Live Data Overlay",
    btnText: "Request Demo",
    btnLink: "#",
  },
  {
    title: "Cloud Backup & Recovery",
    description: "Secure cloud-based data backup and recovery",
    Icon: FaCloud, // Replace with an appropriate React icon
    altText: "Secure Cloud-Based Data Backup and Recovery",
    btnText: "Request Demo",
    btnLink: "#",
  },
];

const SliderSwiper: React.FC = () => {
  const swiperRef = useRef<any>(null);

  const handleMouseEnter = () => {
    if (swiperRef.current && swiperRef.current.autoplay) {
      swiperRef.current.autoplay.stop();
    }
  };

  const handleMouseLeave = () => {
    if (swiperRef.current && swiperRef.current.autoplay) {
      swiperRef.current.autoplay.start();
    }
  };

  return (
    <div className="relative addonsSlider">
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        modules={[Navigation, Autoplay, Pagination]}
        spaceBetween={20}
        slidesPerView={3}
        navigation={{
          nextEl: ".custom-swiper-next-1",
          prevEl: ".custom-swiper-prev-1",
        }}
        pagination={{
          clickable: true,
          el: ".custom-swiper-pagination", // Custom pagination class
        }}
        loop={true}
        autoplay={{
          delay: 2000,
          disableOnInteraction: false,
        }}
        speed={500}
      >
        {/* Slides */}
        {sliderData.map((item, index) => (
          <SwiperSlide
            key={index}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="overflow-hidden">
              <div className="m-2 flex flex-col items-center bg-[#F8F8FB] rounded-3xl shadow-md border border-gray-200 p-4 justify-around text-center h-[280px] cursor-pointer">
                <h5 className="mb-2 text-sm font-semibold text-center 2xl:text-base text-customBlue two-line-title">
                  {item.title}
                </h5>
                <div className="flex items-center justify-center w-20 h-20 my-3 border rounded-full 2xl:w-24 2xl:h-24 2xl:my-2 3xl:my-5 bg-customBlue">
                  <item.Icon className="text-4xl text-white" />
                </div>
                <p className="mb-3 text-xs text-gray-500 2xl:text-sm line-clamp-2">
                  {item.description}
                </p>
                <a
                  href={item.btnLink}
                  className="text-xs rounded-full material-button 2xl:text-sm 2k-scaled:text-lg 3xl:text-lg 2xl:mb-2 2k-scaled:my-5 3xl:my-5"
                >
                  {item.btnText}
                </a>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      {/* Custom Pagination Wrapper */}
      <div className="custom-pagination-wrapper">
        <div className="custom-swiper-prev-1">
          <i className="fas fa-chevron-left"></i>
        </div>
        <div className="custom-swiper-pagination"></div>
        <div className="custom-swiper-next-1">
          <i className="fas fa-chevron-right"></i>
        </div>
      </div>
    </div>
  );
};

export default SliderSwiper;
