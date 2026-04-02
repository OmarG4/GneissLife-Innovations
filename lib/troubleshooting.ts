export type TroubleshootingIssue = {
  id: string;
  title: string;
  summary: string;
  checks: string[];
  notes?: string[];
  snippet?: {
    label: string;
    code: string;
  };
};

export type TroubleshootingCategory = {
  id: string;
  title: string;
  intro: string;
  firstStep: string;
  tools: string[];
  expected?: string[];
  issues: TroubleshootingIssue[];
};

export const troubleshootingCategories: TroubleshootingCategory[] = [
  {
    id: "power",
    title: "Power",
    intro:
      "Start here when the device will not turn on, flickers, or randomly shuts down. The original flow prioritizes battery polarity, BMS output, and wiring before firmware.",
    firstStep:
      "Verify the switch is on, batteries are inserted correctly, and BMS output voltage is present before moving to deeper checks.",
    tools: ["Multimeter", "Fully charged batteries", "Insulated tools"],
    expected: ["Battery cells should read about 3.0V to 4.2V each", "BMS output should be about 10.8V to 12.6V"],
    issues: [
      {
        id: "no-power",
        title: "No power at all",
        summary:
          "If the ESP32 power LED stays dark, the likely causes are battery polarity, no BMS output, a bad switch, or a broken VIN/GND connection.",
        checks: [
          "Measure each battery cell individually and replace any cell below about 2.5V.",
          "Confirm positive battery orientation and verify red is positive, black is ground.",
          "Measure voltage at BMS input and output. If input is fine but output is dead, the BMS may be in protection mode.",
          "Test the power switch with continuity mode and check the ESP32 VIN and GND solder joints.",
        ],
        notes: [
          "The troubleshooting source calls battery polarity the most common setup mistake.",
          "Disconnect batteries before checking wiring.",
        ],
      },
      {
        id: "flicker",
        title: "Power LED flickers or dims",
        summary:
          "Flickering usually points to an intermittent connection rather than a firmware problem.",
        checks: [
          "Check battery holder spring contacts and re-seat the cells.",
          "Re-solder BMS input and output connections if they look dull or loose.",
          "Toggle the power switch several times to expose intermittent failure.",
          "If the ESP32 is socketed, press it down firmly and inspect VIN/GND joints.",
        ],
        notes: [
          "Wiggle testing while watching the LED is useful for identifying loose mechanical connections.",
        ],
      },
      {
        id: "unexpected-shutdowns",
        title: "Random shutdowns under load",
        summary:
          "If the system boots and then dies, voltage sag or a protection event is more likely than a dead board.",
        checks: [
          "Measure the 3.3V rail while WiFi and fans are active.",
          "Check whether battery voltage drops too low when the fan ramps up.",
          "Add a bulk capacitor near the ESP32 if the rail is dipping during bursts.",
          "Disconnect peripherals one by one to isolate whether a short or overloaded rail is involved.",
        ],
        notes: [
          "The source flow treats brown-out style resets as a key sign of unstable power delivery.",
        ],
      },
    ],
  },
  {
    id: "sensors",
    title: "Sensors",
    intro:
      "Use this section when readings are missing, unstable, or clearly unrealistic. The source guide starts with the I2C bus before blaming individual sensors.",
    firstStep:
      "Run an I2C scanner first. Confirm expected addresses before changing firmware logic or replacing hardware.",
    tools: ["Arduino IDE", "Serial Monitor", "Multimeter", "I2C scanner sketch"],
    expected: ["Expected I2C addresses: SHT40 at 0x44, SGP40 at 0x59, BME690 at 0x76 or 0x77"],
    issues: [
      {
        id: "none-detected",
        title: "No sensors detected on I2C",
        summary:
          "When the scanner shows nothing, the bus is usually miswired or missing pull-ups.",
        checks: [
          "Confirm SDA is on GPIO21 and SCL is on GPIO22.",
          "Verify 3.3V and GND to every breakout board.",
          "Check for missing or incorrect pull-up resistors on SDA and SCL.",
          "Inspect for solder bridges or reversed sensor wiring.",
        ],
        snippet: {
          label: "I2C scanner",
          code: `#include <Wire.h>

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  Serial.println("I2C Scanner");
}

void loop() {
  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      Serial.print("Found: 0x");
      if (address < 16) Serial.print("0");
      Serial.println(address, HEX);
    }
  }
  delay(3000);
}`,
        },
      },
      {
        id: "one-missing",
        title: "Only one sensor is missing",
        summary:
          "If two sensors appear and one does not, the bus is probably fine and the problem is specific to that sensor or its address/config.",
        checks: [
          "Check continuity from the missing sensor back to SDA and SCL.",
          "Verify the sensor breakout orientation and pinout.",
          "For BME690, test both 0x76 and 0x77 and confirm the board is in I2C mode, not SPI.",
          "Swap the suspect sensor with a known-good unit if possible.",
        ],
      },
      {
        id: "erratic-readings",
        title: "Sensor values are erratic or unrealistic",
        summary:
          "If values jump wildly, focus on grounding, bus stability, calibration time, and environmental contamination.",
        checks: [
          "Make sure all sensors share a clean 3.3V rail and common ground.",
          "Allow calibration time for VOC-related sensors before trusting the values.",
          "Keep sensors away from strong airflow, heat sources, and direct breath when validating.",
          "Inspect wiring length and routing if noise appears only when fans are running.",
        ],
        notes: [
          "The flowchart repeatedly treats I2C bus quality and startup warm-up time as first-class causes of bad readings.",
        ],
      },
    ],
  },
  {
    id: "wifi",
    title: "WiFi",
    intro:
      "WiFi troubleshooting is mostly about credentials, 2.4GHz compatibility, router settings, and reconnection behavior.",
    firstStep:
      "Check the serial output and LED behavior first. Fast blue blinking usually means the device is still trying to join WiFi.",
    tools: ["Router admin access", "Phone hotspot for testing", "Serial Monitor"],
    issues: [
      {
        id: "blue-blink",
        title: "Blue LED blinks for too long",
        summary:
          "This usually means the board can try to connect but never completes the join.",
        checks: [
          "Double-check SSID and password exactly, including case and special characters.",
          "Confirm the router is exposing a 2.4GHz network because ESP32 does not use 5GHz.",
          "Move the device close to the router for testing.",
          "Try a simple phone hotspot to rule out router-specific configuration issues.",
        ],
      },
      {
        id: "timeout",
        title: "Connection timeout",
        summary:
          "Timeouts often mean the credentials or security mode are incompatible even though the network is visible.",
        checks: [
          "Use WPA2 or WPA2/WPA3 mixed mode instead of WPA3-only.",
          "Check for DHCP exhaustion or slow router assignment.",
          "Restart the router and temporarily reduce advanced roaming features.",
          "If signal is weak, increase WiFi timeout in firmware during testing.",
        ],
      },
      {
        id: "disconnects",
        title: "Connects and then drops",
        summary:
          "Repeated connect-disconnect cycles usually point to signal quality, power stability, or router settings like fast roaming.",
        checks: [
          "Check RSSI and test closer to the router.",
          "Disable band steering or aggressive roaming options in mesh systems.",
          "Verify the power rail stays stable during WiFi transmission bursts.",
          "Watch the serial log to see if reconnect loops line up with fan or sensor activity.",
        ],
      },
    ],
  },
  {
    id: "mqtt",
    title: "MQTT / Smart Home",
    intro:
      "This section handles broker connectivity, TLS issues, Home Assistant discovery, and command topic verification.",
    firstStep:
      "Confirm WiFi works first, then verify the MQTT broker is alive and reachable from another machine before changing firmware.",
    tools: ["Mosquitto broker", "mosquitto_pub", "mosquitto_sub", "Serial Monitor", "OpenSSL"],
    issues: [
      {
        id: "broker",
        title: "Broker not reachable",
        summary:
          "If MQTT never connects, test the broker separately before debugging discovery or payload shape.",
        checks: [
          "Verify the Mosquitto service is running on the broker host.",
          "Use mosquitto_sub and mosquitto_pub from another machine to confirm publish/subscribe works.",
          "Check the firewall is open on port 1883 or 8883.",
          "Use the broker IP directly if hostname resolution is questionable.",
        ],
      },
      {
        id: "credentials",
        title: "Wrong credentials or topic setup",
        summary:
          "Authentication errors usually come from mismatched user/password or a test broker that still expects anonymous access rules.",
        checks: [
          "Validate MQTT user and password on the command line before retesting the firmware.",
          "Confirm client ID is unique per device.",
          "Make sure state, availability, and command topics match the configured device ID.",
          "Check serial error codes for refused login or network failure.",
        ],
      },
      {
        id: "tls",
        title: "TLS certificate or discovery issues",
        summary:
          "If basic MQTT works on 1883 but fails on 8883, certificate handling is the likely blocker.",
        checks: [
          "Extract the broker certificate with OpenSSL and update the firmware certificate string.",
          "Temporarily test plain MQTT to isolate whether transport security is the only failing layer.",
          "Verify Home Assistant MQTT integration is enabled and pointing at the same broker.",
          "Republish discovery data after reconnecting so entities get recreated cleanly.",
        ],
      },
    ],
  },
  {
    id: "fans",
    title: "Fans",
    intro:
      "Fan troubleshooting in the source guide focuses on wiring, PWM control, airflow direction, and unexpected full-speed behavior.",
    firstStep:
      "Check whether the fans physically spin on power-up and whether the reported fan speed changes with VOC conditions.",
    tools: ["Visual inspection", "Multimeter", "Serial Monitor", "Tissue test for airflow"],
    issues: [
      {
        id: "not-spinning",
        title: "Fans do not spin",
        summary:
          "If both fans are dead, first verify wiring and PWM output before assuming the motors are bad.",
        checks: [
          "Confirm fan power and ground wiring.",
          "Check the PWM channels and pin assignments in firmware.",
          "Test each fan directly with known-good power if possible.",
          "Verify fans are not disabled by command state or safety logic.",
        ],
      },
      {
        id: "noisy",
        title: "Fans are loud or vibrating",
        summary:
          "Noise usually means alignment, mounting, or worn fan hardware rather than a sensor bug.",
        checks: [
          "Inspect the fan blades for contact or wobble.",
          "Check mounting pressure and housing alignment.",
          "Listen for grinding that suggests a failing bearing.",
          "Reduce speed in firmware temporarily to see whether the noise is purely mechanical resonance.",
        ],
      },
      {
        id: "max-speed",
        title: "Fans stay at maximum speed",
        summary:
          "The guide treats persistent max speed as a VOC-trigger or calibration problem before a PWM bug.",
        checks: [
          "Check the current VOC index in the serial output.",
          "Recalibrate the device in clean air if VOC readings remain elevated.",
          "Verify sensor values are not stuck at a falsely high level.",
          "Confirm the command topic has not overridden the fan speed to 100%.",
        ],
      },
    ],
  },
  {
    id: "leds",
    title: "LEDs",
    intro:
      "LED issues are usually simple hardware problems, but the guide also uses LEDs as status signals for WiFi, MQTT, calibration, risk, and battery state.",
    firstStep:
      "First decide whether the problem is no light, wrong color, or misleading state behavior.",
    tools: ["Visual inspection", "Multimeter", "GPIO test sketch"],
    issues: [
      {
        id: "none",
        title: "No LEDs illuminate",
        summary:
          "If every LED is dead, verify power and GPIO wiring before debugging status logic.",
        checks: [
          "Confirm the board is powered and the GPIO pins are mapped correctly.",
          "Check resistor values and LED polarity.",
          "Run a simple LED test sketch to force each color on.",
          "Inspect solder joints around the LED cluster.",
        ],
      },
      {
        id: "wrong-color",
        title: "Wrong color or wrong status behavior",
        summary:
          "Mixed-up colors often mean pin mapping or wiring order is wrong rather than state logic itself.",
        checks: [
          "Verify green, red, and blue channels are wired to the expected pins.",
          "Test each color individually with a small sketch.",
          "Compare the live LED state against the intended firmware meanings for WiFi, MQTT, calibration, mold risk, and battery.",
          "Check whether inverted logic is needed for the LED hardware used.",
        ],
      },
      {
        id: "dim",
        title: "LEDs are dim or intermittent",
        summary:
          "Dim LEDs point to poor current limiting choices, unstable voltage, or weak solder joints.",
        checks: [
          "Inspect resistor sizing and power rail stability.",
          "Reflow any suspect solder joints.",
          "Test whether dimming happens only when WiFi or fans are active.",
          "Check whether one color channel is consistently weaker than the others.",
        ],
      },
    ],
  },
  {
    id: "battery",
    title: "Battery",
    intro:
      "Battery flows focus on runtime, charging, inaccurate battery percentages, and excessive drain caused by WiFi or fan behavior.",
    firstStep:
      "Measure real battery voltage with a meter before trusting the reported percentage.",
    tools: ["Multimeter", "Runtime observation", "Serial Monitor"],
    issues: [
      {
        id: "short-runtime",
        title: "Battery dies too quickly",
        summary:
          "Short runtime often comes from continuous WiFi retries, max-speed fans, or a short somewhere in the system.",
        checks: [
          "Check whether WiFi is failing and repeatedly reconnecting.",
          "See if the fans are pinned at full speed because VOC readings are high.",
          "Feel for hot components that suggest a short or abnormally high current draw.",
          "Measure average current draw if possible and compare it to expected runtime.",
        ],
      },
      {
        id: "charging",
        title: "Battery does not charge or seems inconsistent",
        summary:
          "Charging problems should be treated separately from telemetry problems by validating the battery path and charge circuit first.",
        checks: [
          "Confirm charger output and battery pack voltage both rise as expected.",
          "Inspect the BMS and charge path for damaged or reversed wiring.",
          "Verify the battery chemistry and voltage range match the firmware assumptions.",
          "Check whether the reported percentage is only a mapping issue while the actual voltage is fine.",
        ],
      },
      {
        id: "wrong-reading",
        title: "Battery percentage looks wrong",
        summary:
          "Bad percentage values are often calibration or scaling issues rather than actual battery failure.",
        checks: [
          "Compare reported battery voltage against a meter reading.",
          "Verify ADC scaling and the voltage divider assumption in firmware.",
          "Check the min/max voltage range used to map percentage.",
          "Re-test at both a high and low voltage point to confirm the curve is sensible.",
        ],
      },
    ],
  },
  {
    id: "general",
    title: "General",
    intro:
      "This category covers reboot loops, freezes, erratic behavior, and a full system-level acceptance test.",
    firstStep:
      "If the issue looks generic, first decide whether it is really power, sensors, or connectivity in disguise before going deeper.",
    tools: ["Serial Monitor", "Minimal test firmware", "Multimeter", "Thermal check"],
    issues: [
      {
        id: "reboot",
        title: "Device keeps rebooting",
        summary:
          "Repeated reboot loops usually point to watchdog resets, brown-out conditions, firmware crashes, flash corruption, or a hardware short.",
        checks: [
          "Check serial output for watchdog reset, brown-out, or Guru Meditation messages.",
          "Measure the 3.3V rail during operation and while peripherals are active.",
          "Flash minimal test code and disconnect peripherals to separate firmware from hardware issues.",
          "Erase flash and re-upload firmware if corruption is suspected.",
        ],
      },
      {
        id: "freeze",
        title: "Device freezes or hangs",
        summary:
          "Freezes often come from blocking firmware, a stuck I2C bus, or long-running code that starves the watchdog.",
        checks: [
          "Add debug logging to identify the point where execution stops.",
          "Test whether the I2C bus is getting stuck by a sensor transaction.",
          "Break up long blocking tasks and reset the watchdog in long-running routines.",
          "Use a bus recovery routine if the I2C lines can be trapped low.",
        ],
        snippet: {
          label: "I2C recovery helper",
          code: `void recoverI2C() {
  pinMode(21, OUTPUT);
  pinMode(22, OUTPUT);

  for (int i = 0; i < 9; i++) {
    digitalWrite(22, LOW);
    delayMicroseconds(5);
    digitalWrite(22, HIGH);
    delayMicroseconds(5);
  }

  Wire.begin(21, 22);
  Serial.println("I2C bus recovered");
}`,
        },
      },
      {
        id: "erratic",
        title: "Erratic or inconsistent behavior",
        summary:
          "Inconsistent behavior usually means noise, unstable power, loose connections, EMI, or race conditions in code.",
        checks: [
          "Add bulk and bypass capacitance near the ESP32 and sensitive parts.",
          "Re-solder suspect joints and separate fan wiring from sensor wiring.",
          "Twist SDA/SCL together and keep them away from noisy power lines.",
          "Check for hidden thermal or EMI issues if failures correlate with load or environment.",
        ],
      },
      {
        id: "full-test",
        title: "Run a complete system test",
        summary:
          "Use the source checklist when you need end-to-end validation before deployment.",
        checks: [
          "Validate battery voltage, BMS output, and 3.3V stability.",
          "Confirm all sensors appear on I2C and produce reasonable values.",
          "Verify fans, LEDs, WiFi, MQTT, and battery reporting behave as expected.",
          "Run the system continuously for several hours and confirm no freezes, reboots, or thermal issues appear.",
        ],
      },
    ],
  },
];
