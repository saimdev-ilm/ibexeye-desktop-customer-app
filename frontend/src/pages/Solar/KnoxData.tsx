import React, { useEffect, useState } from "react";
import webSocketService from "../../services/socketConnection";
import { useNavigate } from "react-router-dom";

// Standardized mapping of topics to human-readable names
const knoxTopicMappings: Record<string, string> = {
  "knox/inverter_1/serial_number": "Serial Number",
  "knox/inverter_1/battery_maximum_charge_current": "Battery Max Charge Current (A)",
  "knox/inverter_1/battery_constant_charge_voltage": "Battery Constant Charge Voltage (V)",
  "knox/inverter_1/battery_floating_charge_voltage": "Battery Floating Charge Voltage (V)",
  "knox/inverter_1/battery_discharge_max_current_in_hybrid_mode": "Battery Discharge Max Current (A)",
  "knox/inverter_1/ac_input_frequency": "AC Input Frequency (Hz)",
  "knox/inverter_1/solar_input_current_1": "Solar Input Current 1 (A)",
  "knox/inverter_1/battery_voltage": "Battery Voltage (V)",
  "knox/inverter_1/solar_input_current_2": "Solar Input Current 2 (A)",
  "knox/inverter_1/inner_temperature": "Inverter Temperature (°C)",
  "knox/inverter_1/battery_current": "Battery Current (A)",
  "knox/inverter_1/solar_input_voltage_1": "Solar Input Voltage 1 (V)",
  "knox/inverter_1/solar_input_voltage_2": "Solar Input Voltage 2 (V)",
  "knox/inverter_1/ac_input_voltage_r": "AC Input Voltage R (V)",
  "knox/inverter_1/ac_output_voltage_r": "AC Output Voltage R (V)",
  "knox/inverter_1/battery_capacity": "Battery Capacity (%)",
  "knox/inverter_1/solar_input_power_1": "Solar Input Power 1 (W)",
  "knox/inverter_1/ac_output_total_active_power": "AC Output Total Active Power (W)",
  "knox/inverter_1/ac_input_total_active_power": "AC Input Total Active Power (W)",
  "knox/inverter_1/solar_input_power_2": "Solar Input Power 2 (W)",
};

const KnoxData: React.FC = () => {
  const [knoxData, setKnoxData] = useState<Record<string, string>>({});
  const timeouts = new Map<string, NodeJS.Timeout>();
  const navigate = useNavigate();
  useEffect(() => {
    console.log("🔌 Connecting to WebSocket...");
    webSocketService.connect();

    webSocketService.on("knox", (data: string) => {
      console.log("📩 Raw WebSocket message received:", data);

      try {
        const parsedData = JSON.parse(data);
        console.log("📡 Parsed Knox data:", parsedData);

        if (!parsedData || !parsedData.topic || !parsedData.message) {
          console.error("❌ Invalid data received:", parsedData);
          return;
        }

        // Extract the actual topic and value from the message
        const messageParts = parsedData.message.split(/\s+/);
        const extractedTopic = messageParts[0]; // Extracted topic name
        let extractedValue = messageParts.slice(1).join(" "); // Join the remaining parts as the value

        // Special handling for serial number (since it does not have a unit at the end)
        if (extractedTopic === "knox/inverter_1/serial_number") {
          extractedValue = messageParts[1]; // Serial number is the second part
        } else {
          extractedValue = messageParts[messageParts.length - 2]; // Get the value before unit
        }

        console.log(`🔹 Updating Knox Data: [${extractedTopic}] = ${extractedValue}`);

        // Update the state
        setKnoxData((prevData) => ({
          ...prevData,
          [extractedTopic]: extractedValue,
        }));

        // Reset the timer for "knox/inverter_1/ac_input_total_active_power"
        if (extractedTopic === "knox/inverter_1/ac_input_total_active_power") {
          if (timeouts.has(extractedTopic)) {
            clearTimeout(timeouts.get(extractedTopic)!); // Clear existing timeout
          }
          const timeoutId = setTimeout(() => {
            console.log(`⏳ No update for [${extractedTopic}] in 5s, setting to 0.`);
            setKnoxData((prevData) => ({
              ...prevData,
              [extractedTopic]: "0",
            }));
          }, 12000); // 12 seconds timeout
          timeouts.set(extractedTopic, timeoutId);
        }
      } catch (error) {
        console.error("❌ Error parsing Knox data:", error);
      }
    });

    return () => {
      console.log("🔌 Disconnecting from WebSocket...");
      webSocketService.disconnect();
      timeouts.forEach((timeout) => clearTimeout(timeout)); // Clear all timeouts
    };
  }, []);

  const goToHome = () => {
    navigate("/")
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="flex items-center justify-center gap-4 mb-4">
        <h2 className="text-2xl font-bold text-center text-customBlue">
          Knox Data Dashboard
        </h2>
        <button className="px-3 py-2 text-white rounded bg-customBlue" onClick={goToHome}>Home</button>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {Object.entries(knoxTopicMappings).map(([topic, label]) => (
          <div
            key={topic}
            className="p-4 text-center bg-white border border-gray-200 shadow-md rounded-xl"
          >
            <h3 className="text-lg font-semibold text-gray-700">{label}</h3>
            <p className="text-2xl font-bold text-gray-900">
              {knoxData[topic] ?? "0"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KnoxData;
