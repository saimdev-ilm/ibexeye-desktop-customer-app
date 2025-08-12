import React, { useState } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import { FaBackspace, FaBackward, FaHome, FaRestroom } from "react-icons/fa";

interface PopupModalProps {
  currentStage: 1 | 2;
  onClose: () => void;
  isOpen: boolean;
  setCurrentStage: (stage: 1 | 2) => void;
}

const PopupModal: React.FC<PopupModalProps> = ({
  currentStage,
  onClose,
  isOpen,
  setCurrentStage,
}) => {
  const [view, setView] = useState<
    | "default"
    | "sceneLibrary"
    | "scenarioLibrary"
    | "modelLibrary"
    | "modelSelection"
  >("default");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const resetModal = () => {
    setView("default");
    setSelectedModel(null);
    setCurrentStage(1);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  const title =
    view === "sceneLibrary"
      ? "Scene Library"
      : view === "scenarioLibrary"
      ? "Scenario Library"
      : view === "modelLibrary"
      ? "Model Library"
      : view === "modelSelection"
      ? "Model Selection"
      : "Hardware Random Faults";

  const buttonTexts =
    currentStage === 1
      ? ["New Scene", "Open Scene", "Scene Library"]
      : ["New Scenario", "Open Scenario", "Scenario Library"];

  const handleSceneLibraryClick = () => setView("sceneLibrary");
  const handleScenarioLibraryClick = () => setView("scenarioLibrary");
  const handleModelSelect = (model: string) => setSelectedModel(model);

  const handleFIServerLaunch = () => {
    const electronApi = (window as any).electron;
    if (electronApi && electronApi.launchFaultinjection) {
      electronApi.launchFaultinjection();
    } else {
      console.error("Electron API is not available");
    }
  };


  const handleEthernet = () => {
    const electronApi = (window as any).electron;
    if (electronApi && electronApi.launchFaultinjection) {
      electronApi.launchEthernet();
    } else {
      console.error("Electron API is not available");
    }
  };

  const handleNextClick = async () => {
    switch (view) {
      case "sceneLibrary":
        setView("default");
        setCurrentStage(2); 
        break;

      case "scenarioLibrary":
        setView("modelSelection");
        break;

      case "modelSelection":
        setView("modelLibrary"); // Navigate to Model Library
        break;

      case "modelLibrary":
        resetModal();
        onClose(); // Close the popup
        try {
          // Call the API to run fault injection
          // await handleFIServerLaunch();
          await handleEthernet();
          await handleApiCall();
        } catch (error) {
          console.error("Error during API call:", error);
        }
        break;

      default:
        setView("modelLibrary"); // Navigate to Model Library
    }
  };
  // Extracted function for the API call
  const handleApiCall = async () => {
    try {
      const response = await fetch("http://10.3.0.6:5000/run_fault_injection", {
        method: "POST", // or 'GET', depending on your API requirements
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: selectedModel }), // Send selected model data if needed
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API response:", data);
      setView("modelSelection"); // Move to the next view if API call is successful
    } catch (error) {
      console.error("Error calling the API:", error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0d0d16] bg-opacity-75 z-50">
      <div className="bg-theme shadow-3d rounded text-theme w-1/3 ">
        <div className="flex items-center justify-between p-4">
        <button
            onClick={handleClose}
            className="bg-customBlue py-2 hover:bg-customBlueHover material-button"
            aria-label="Close modal"
          >
            <span>
              <FaHome size={20}/>
            </span>
          </button>
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={handleClose}
            className="bg-red-700 hover:bg-red-800 material-button"
            aria-label="Close modal"
          >
            <span>
              <i className="fas fa-xmark"></i>
            </span>
          </button>
        </div>

        {view === "default" ? (
          <>
            <div className="p-4 mr-4 ml-4 mt-4 shadow-3d">
              <div className="flex items-center justify-center">
                <div className="flex items-center">
                  <div
                    className={classNames(
                      "flex items-center px-2 rounded-full",
                      { "bg-[#1976d2] text-white": currentStage >= 1 }
                    )}
                  >
                    1
                  </div>
                  <span className="mx-2">Scene</span>
                </div>
                <ArrowRightIcon className="w-6 h-6 text-theme mx-4" />
                <div className="flex items-center">
                  <div
                    className={classNames(
                      "flex items-center px-2 rounded-full",
                      { "shadow-3d text-white": currentStage >= 2 }
                    )}
                  >
                    2
                  </div>
                  <span className="mx-2">Scenario</span>
                </div>
              </div>
            </div>

            <div>
              <div className="shadow-3d p-4 mb-4 mr-4 ml-4">
                <h3 className="text-lg font-bold">
                  {currentStage === 1
                    ? "Scene Selection"
                    : "Scenario Selection"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {currentStage === 1
                    ? "Get started by creating a new scene"
                    : "Get started by creating a new scenario"}
                </p>

                <div className="flex space-x-4 items-center justify-evenly">
                  {buttonTexts.map((text, index) => (
                    <button
                      key={index}
                      className="material-button"
                      onClick={
                        text === "Scene Library"
                          ? handleSceneLibraryClick
                          : text === "Scenario Library"
                          ? handleScenarioLibraryClick
                          : undefined
                      }
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : view === "sceneLibrary" || view === "scenarioLibrary" ? (
          <>
            <div className="p-4 mr-4 ml-4 mt-4 shadow-3d">
              <div className="flex flex-col space-y-4 mt-4">
                <button
                  className={classNames("rounded  material-button", {
                    "": selectedModel === "None",
                    "": selectedModel !== "None",
                  })}
                  onClick={() => handleModelSelect("Trajectory Follower")}
                >
                  None
                </button>
                <button
                  className={classNames("rounded  material-button", {
                    "": selectedModel === "Trajectory Follower",
                    "": selectedModel !== "Trajectory Follower",
                  })}
                  onClick={() => handleModelSelect("Trajectory Follower")}
                >
                  Trajectory Follower
                </button>
                <button
                  className={classNames("rounded  material-button", {
                    "": selectedModel === "Highway Lane Changer",
                    "": selectedModel !== "Highway Lane Changer",
                  })}
                  onClick={() => handleModelSelect("Highway Lane Changer")}
                >
                  Highway Lane Changer
                </button>
              </div>
            </div>

            <div className="flex justify-end p-4">
              <button
                className="rounded w-full material-button"
                onClick={handleNextClick}
                disabled={!selectedModel}
              >
                Next
              </button>
            </div>
          </>
        ) : view === "modelLibrary" ? (
          <>
            <div className="p-4 mr-4 ml-4 mt-4 shadow-3d">
              <div className="flex flex-col space-y-4 mt-4">
                <button
                  className={classNames("rounded  material-button", {
                    "": selectedModel === "Ethernet",
                    "": selectedModel !== "Ethernet",
                  })}
                  onClick={() => handleModelSelect("Ethernet")}
                >
                  Ethernet Switch
                </button>
                <button
                  className={classNames("rounded  material-button", {
                    "": selectedModel === "Braking",
                    "": selectedModel !== "Braking",
                  })}
                  onClick={() => handleModelSelect("Braking")}
                >
                  Braking
                </button>
                <button
                  className={classNames("rounded  material-button", {
                    "": selectedModel === "ADAS",
                    " text-white": selectedModel !== "ADAS",
                  })}
                  onClick={() => handleModelSelect("ADAS")}
                >
                  ADAS
                </button>
              </div>
            </div>

            <div className="flex justify-end p-4">
              <button
                className="material-button w-full"
                onClick={handleNextClick}
                disabled={!selectedModel}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div>
            {/* Model Selection View */}
            <div className="border border-blue-900 p-4 mb-4 mr-4 ml-4">
              <p className="text-gray-600 mb-4">
                Get started by selecting a model
              </p>

              {/* Bottom Buttons */}
              <div className="flex space-x-4 items-center justify-evenly">
                <button
                  className="material-button"
                  onClick={() => console.log("New Model clicked")}
                >
                  New Model
                </button>
                <button className="material-button" onClick={handleNextClick}>
                  Model Library
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupModal;
