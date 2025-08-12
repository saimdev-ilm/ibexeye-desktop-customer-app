import React from "react";
import MainLayout from "./layouts/MainLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ModeProvider } from "./contexts/ModeContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { DroneDeploymentProvider } from "./contexts/DroneDeploymentContext"; // ADD THIS

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ModeProvider>
          <WebSocketProvider>
            <DroneDeploymentProvider>  
              <MainLayout />
            </DroneDeploymentProvider>  
          </WebSocketProvider>
        </ModeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;