const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  dialog,
  session,
  shell,
} = require("electron");
const path = require("path");
const { spawn } = require("child_process");
app.setName("Ibex Simulator");

// Global variable to store the dynamically detected Vite port
let vitePort = null;
let mainWindow = null;

// Function to detect Vite's port from console output
function detectVitePortFromOutput(data) {
  const output = data.toString();
  console.log(output); // Keep the original console output visible
  
  // Only parse for port if we haven't found it yet
  if (!vitePort) {
    // Use regex to find the port in Vite's output message
    const portMatch = output.match(/Local:\s+http:\/\/localhost:(\d+)/);
    if (portMatch && portMatch[1]) {
      vitePort = parseInt(portMatch[1]);
      console.log(`✅ Detected Vite running on port: ${vitePort}`);
      
      // If main window exists, load the URL
      if (mainWindow) {
        const url = `http://localhost:${vitePort}/`;
        console.log(`Loading Vite from: ${url}`);
        mainWindow.loadURL(url);
        
        // Show window after a short delay to ensure content is loaded
        setTimeout(() => {
          if (splashWindow) {
            splashWindow.destroy();
            splashWindow = null;
          }
          mainWindow.setFullScreen(true);
          mainWindow.show();
        }, 1500);
      }
    }
  }
}

// Create the main application window
function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const window = new BrowserWindow({
    width: Math.floor(width * 1),
    height: Math.floor(height * 1),
    x: Math.floor((width - width * 1) / 2),
    y: Math.floor((height - height * 1) / 2),
    minWidth: 400,
    minHeight: 300,
    frame: false,
    icon: path.join(__dirname, "/frontend/src/assets/logo/iconlogo.png"),
    show: false, // Don't show the main window immediately
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      webSecurity: process.env.NODE_ENV !== "development", // Enable security in production
      experimentalFeatures: false, // Ensure experimental features are off
    },
  });
  console.log(path.join(__dirname, "frontend/src/assets/logo/ibexEyeIcon.png"));

  // In production mode, load the file directly
  if (process.env.NODE_ENV !== "development") {
    window.loadFile(path.join(__dirname, "frontend/dist/index.html"));
    window.once("ready-to-show", () => {
      if (splashWindow) {
        splashWindow.destroy();
        splashWindow = null;
      }
      window.setFullScreen(true);
      window.show();
    });
  } else if (vitePort) {
    // If we already have detected the Vite port, load it immediately
    const url = `http://localhost:${vitePort}/`;
    console.log(`Loading Vite from: ${url}`);
    window.loadURL(url);
    
    // Show window after a short delay to ensure content is loaded
    setTimeout(() => {
      if (splashWindow) {
        splashWindow.destroy();
        splashWindow = null;
      }
      window.setFullScreen(true);
      window.show();
    }, 1500);
  }
  // Otherwise, the detectVitePortFromOutput function will handle this when it detects the port

  // Window controls
  ipcMain.on("minimize-main-window", () => window.minimize());
  ipcMain.on("maximize-main-window", () => {
    if (window.isFullScreen()) {
      window.setFullScreen(false); // Exit full screen
      window.webContents.send("window-state-changed", "unmaximized"); // Notify renderer
    } else {
      window.setFullScreen(true); // Enter full screen (instead of maximize)
      window.webContents.send("window-state-changed", "maximized"); // Notify renderer
    }
  });

  ipcMain.on("close-main-window", () => window.close());

  // CORS Configuration
  const filter = {
    urls: ["*://54.235.23.73/*"], // Define your specific URL pattern here
  };

  session.defaultSession.webRequest.onBeforeSendHeaders(
    filter,
    (details, callback) => {
      details.requestHeaders["Origin"] = null; // Remove the 'Origin' header
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Access-Control-Allow-Origin": ["*"],
        "Access-Control-Allow-Headers": ["*"],
      },
    });
  });

  return window;
}

// Handle new windows with independent controls
function createNewWindow(url) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const newWindow = new BrowserWindow({
    width: Math.floor(width * 0.99),
    height: Math.floor(height * 0.99),
    x: Math.floor((width - width * 0.99) / 2),
    y: Math.floor((height - height * 0.99) / 2),
    minWidth: 400,
    minHeight: 300,
    frame: false,
    icon: path.join(__dirname, "/frontend/src/assets/iconlogo.ico"),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      webSecurity: process.env.NODE_ENV !== "development",
    },
  });

  newWindow.loadURL(url);

  newWindow.once("ready-to-show", () => {
    newWindow.show();
  });

  ipcMain.on("minimize-window", () => newWindow.minimize());
  ipcMain.on("maximize-window", () => {
    if (newWindow.isMaximized()) {
      newWindow.unmaximize();
    } else {
      newWindow.maximize();
    }
  });
  ipcMain.on("close-window", () => newWindow.close());

  return newWindow;
}

// Handle new windows to maintain style and controls
app.on("web-contents-created", (event, webContents) => {
  webContents.setWindowOpenHandler(({ url }) => {
    createNewWindow(url);  
    return { action: "deny" }; 
  });
});

// Splash screen
let splashWindow = null;
function createSplashWindow() {
  const splash = new BrowserWindow({
    width: 550,
    height: 650,
    frame: false,
    transparent: true,  
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "splash-preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  splash.loadFile(path.join(__dirname, "./splash.html"));
  return splash;
}

 

// Start the application
app.whenReady().then(() => {
  splashWindow = createSplashWindow();
  
  if (process.env.NODE_ENV === "development") {
    // Create main window first and store it in global variable
    mainWindow = createMainWindow();
    
    // Don't start Vite ourselves - the concurrently script is already doing it
    // Instead, just listen for the Vite process output
    process.stdout.on('data', detectVitePortFromOutput);
    
    // Set a timeout for fallback if port detection fails
    setTimeout(() => {
      if (!vitePort && mainWindow) {
        console.log("⚠️ Port detection failed - trying common Vite ports");
        // Try common Vite ports in sequence
        const tryPorts = [5173, 5174, 5175, 5176, 5177, 5178];
        
        const tryNextPort = (index) => {
          if (index >= tryPorts.length) {
            console.error("❌ Could not connect to any Vite port");
            return;
          }
          
          const port = tryPorts[index];
          const url = `http://localhost:${port}/`;
          
          console.log(`Trying ${url}`);
          
          // Try to fetch the URL to check if it's responding
          fetch(url)
            .then(response => {
              if (response.ok) {
                console.log(`✅ Connected to Vite at ${url}`);
                vitePort = port;
                mainWindow.loadURL(url);
                
                setTimeout(() => {
                  if (splashWindow) {
                    splashWindow.destroy();
                    splashWindow = null;
                  }
                  mainWindow.setFullScreen(true);
                  mainWindow.show();
                }, 1500);
              } else {
                tryNextPort(index + 1);
              }
            })
            .catch(() => {
              tryNextPort(index + 1);
            });
        };
        
        tryNextPort(0);
      }
    }, 10000); // 10 seconds timeout
  } else {
    // Production mode
    mainWindow = createMainWindow();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      splashWindow = createSplashWindow();
      mainWindow = createMainWindow();
    }
  });
});

ipcMain.on("open-external-url", (event, { url }) => {
  event.preventDefault();
  
  // Validate URL before opening
  if (url.startsWith("https://trusted-domain.com")) {
    shell.openExternal(url);
  } else {
    console.warn("Blocked unsafe external URL:", url);
  }
});

// Quit the application when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Handle unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});