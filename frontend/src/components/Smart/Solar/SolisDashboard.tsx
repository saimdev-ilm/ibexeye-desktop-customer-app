import React, { useEffect, useState } from "react";
import webSocketService from "../../../services/socketConnection";
import { useNavigate } from "react-router-dom";

// Standardized mapping of topics to human-readable names
const topicMappings: Record<string, string> = {
    "solar_assistant/inverter_1/grid_voltage/state": "Grid Voltage (V)",
    "solar_assistant/inverter_1/grid_power_ld/state": "Grid Power Load (W)",
    "solar_assistant/inverter_1/load_power_non-essential/state": "Non-Essential Load Power (W)",
    "solar_assistant/inverter_1/ac_output_voltage/state": "AC Output Voltage (V)",
    "solar_assistant/inverter_1/load_power/state": "Total Load Power (W)",
    "solar_assistant/inverter_1/pv_power_2/state": "PV (Solar) Power 2 (W)",
    "solar_assistant/total/battery_power/state": "Battery Power (W)",
    "solar_assistant/total/battery_state_of_charge/state": "Battery State of Charge (%)",
    "solar_assistant/inverter_1/load_power_essential/state": "Essential Load Power (W)",
    "solar_assistant/inverter_1/grid_frequency/state": "Grid Frequency (Hz)",
    "solar_assistant/inverter_1/pv_current_1/state": "PV (Solar) Current 1 (A)",
    "solar_assistant/inverter_1/grid_power_ct/state": "Grid Power Consumption (W)",
    "solar_assistant/inverter_1/battery_voltage/state": "Battery Voltage (V)",
    "solar_assistant/inverter_1/pv_current_2/state": "PV (Solar) Current 2 (A)",
    "solar_assistant/inverter_1/temperature/state": "Inverter Temperature (°C)",
    "solar_assistant/inverter_1/battery_current/state": "Battery Current (A)",
    "solar_assistant/inverter_1/grid_power/state": "Grid Power (W)",
    "solar_assistant/inverter_1/pv_voltage_1/state": "PV (Solar) Voltage 1 (V)",
    "solar_assistant/inverter_1/pv_voltage_2/state": "PV (Solar) Voltage 2 (V)",
    "solar_assistant/inverter_1/pv_power_1/state": "PV (Solar) Power 1 (W)"
};

const SolisDashboard: React.FC = () => {
    const [solarData, setSolarData] = useState<Record<string, string>>({});
    const navigate = useNavigate();

    useEffect(() => {
        webSocketService.connect();

        webSocketService.on("solar_assistant", (data: string) => {
            try {
                const parsedData = JSON.parse(data);
                console.log("📡 Parsed solar data:", parsedData);

                if (!parsedData || !parsedData.topic || !parsedData.message) {
                    console.error("❌ Invalid data received:", parsedData);
                    return;
                }

                setSolarData((prevData) => ({
                    ...prevData,
                    [parsedData.topic]: parsedData.message,
                }));
            } catch (error) {
                console.error("❌ Error parsing solar data:", error);
            }
        });

        return () => {
            webSocketService.disconnect();
        };
    }, []);

    const goToHome = () => {
        navigate("/")
    }

    return (
        <div className="min-h-screen p-6 bg-gray-100">
            <div className="flex items-center justify-center gap-4 mb-4">
                <h2 className="text-2xl font-bold text-center text-customBlue">
                    Solis Dashboard
                </h2>
                <button className="px-3 py-2 text-white rounded bg-customBlue" onClick={goToHome}>Home</button>
            </div>      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                {Object.keys(topicMappings).map((topic) => (
                    <div key={topic} className="p-4 bg-white shadow-md rounded-xl">
                        <h3 className="text-lg font-semibold">{topicMappings[topic]}</h3>
                        <p className="text-2xl font-bold">{solarData[topic] ?? "0"}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SolisDashboard;
