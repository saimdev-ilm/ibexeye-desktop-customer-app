import {useState} from "react";

const PowerManagement: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState("optimized");

  const options = [
    {
      label: "High Quality Video",
      description: "Enjoy the best video quality, uses more battery.",
      value: "best-video",
    },
    {
      label: "Smart Optimized",
      description: "Perfect balance between video quality and battery life.",
      value: "optimized",
    },
    {
      label: "Battery Saver Mode",
      description: "Extend battery life with reduced video quality.",
      value: "best-battery",
    },
  ];
  

  
  return (
    <div className="w-full py-2 mx-auto bg-white rounded-lg text-customBlue">
      {options.map((option) => (
        <div
          key={option.value}
          onClick={() => setSelectedOption(option.value)}
          className={`flex justify-between items-center py-3 px-4 mb-3 rounded-3xl cursor-pointer ${
            selectedOption === option.value
              ? "border shadow"
              : "border hover:bg-gray-100"
          }`}
        >
          <div>
            <p className="font-semibold">{option.label}</p>
            <p className="text-sm text-gray-400">{option.description}</p>
          </div>
          {selectedOption === option.value && (
            <span className="text-xl text-customBlue">✔</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default PowerManagement;
