const express = require("express");
const app = express();
const server = require("http").createServer(app);

// ✅ Socket.IO with CORS (Netlify + local dev allowed)
const io = require("socket.io")(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://kevin-rocket-simulation.netlify.app",
    ],
    methods: ["GET", "POST"],
  },
});

app.use(express.static("."));

// --- NOMINAL FALCON 9 CONSTANTS ---
const F9_CONSTANTS = {
  thrust: 7607, // Sea-level thrust (kN)
  dry_mass: 25600, // Stage dry mass (kg)
  fuel_mass: 395700, // Propellant mass (kg)
  burn_duration: 162, // First stage burn duration (s)
  vacuumThrust: 8227, // Vacuum thrust (kN)
  endThrust: 4800, // Thrust at throttle-down before MECO (kN)
  maxQTime: 70, // Time of Max-Q (s)

  // Drag model (simple)
  dragCoef: 0.298, // Approx Cd for Falcon 9
  area: 10.52, // Cross-sectional area (m^2)
};

const GRAVITY_MS2 = 9.807;
const UPDATE_INTERVAL_MS = 250;

// --- Helper: Atmospheric Density (simple exponential model) ---
function getAirDensity(altitude) {
  // Sea level density ~1.225 kg/m^3, scale height ~8500m
  const rho = 1.225 * Math.exp(-Math.max(0, altitude) / 8500);
  return Math.max(0, rho);
}

// --- Physics tick function ---
function runPhysicsTick(state, constants) {
  let { time, altitude, vVert, vHoriz, fuel, downrange } = state;

  const {
    thrust,
    dry_mass,
    fuel_mass,
    burn_duration,
    vacuumThrust,
    endThrust,
    maxQTime,
    dragCoef,
    area,
  } = constants;

  const dt = UPDATE_INTERVAL_MS / 1000;

  // --- 1) Fuel & Mass (fuel persists; no time-based reset) ---
  const fuelConsumptionRate = 100 / burn_duration; // % per second
  fuel = Math.max(0, fuel - fuelConsumptionRate * dt);

  const propMass = fuel_mass * (fuel / 100);
  const totalMass = dry_mass + propMass;

  const t_frac = Math.min(time / burn_duration, 1);

  if (totalMass <= 0) {
    return { ...state, fuel: 0, thrust: 0 };
  }

  // --- 2) Thrust Profile ---
  let currentThrustkN;
  if (time >= burn_duration || fuel <= 0) {
    currentThrustkN = 0;
  } else if (time < maxQTime) {
    currentThrustkN = thrust + (vacuumThrust - thrust) * (time / maxQTime);
  } else {
    const progress = (time - maxQTime) / (burn_duration - maxQTime);
    currentThrustkN = vacuumThrust - (vacuumThrust - endThrust) * progress;
  }

  const thrustForce = currentThrustkN * 1000; // N

  // --- 3) Pitch (simple linear gravity turn: 0 -> 45deg) ---
  const pitch = (Math.PI / 4) * t_frac;

  // --- 4) Forces ---
  const gravityForce = totalMass * GRAVITY_MS2;

  const thrustVert = thrustForce * Math.cos(pitch);
  const thrustHoriz = thrustForce * Math.sin(pitch);

  // Drag
  const velocity = Math.sqrt(vVert ** 2 + vHoriz ** 2);
  const airDensity = getAirDensity(altitude);
  const dragForce = 0.5 * airDensity * velocity ** 2 * dragCoef * area;

  let dragVert = 0;
  let dragHoriz = 0;

  if (velocity > 0) {
    // Drag opposes velocity
    dragVert = dragForce * (vVert / velocity);
    dragHoriz = dragForce * (vHoriz / velocity);
  }

  const netForceVert = thrustVert - gravityForce - dragVert;
  const netForceHoriz = thrustHoriz - dragHoriz;

  // --- 5) Integrate ---
  const accelVert = netForceVert / totalMass;
  const accelHoriz = netForceHoriz / totalMass;

  vVert += accelVert * dt;
  vHoriz += accelHoriz * dt;

  altitude += vVert * dt;
  downrange += vHoriz * dt;
  time += dt;

  // Prevent going below ground (optional safety)
  if (altitude < 0) {
    altitude = 0;
    vVert = 0;
  }

  return {
    time,
    altitude,
    vVert,
    vHoriz,
    fuel,
    downrange,
    thrust: currentThrustkN,
  };
}

// --- Socket.IO logic ---
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  let interval;

  socket.on("start-simulation", ({ mode, params }) => {
    console.log(`Starting ${mode} simulation`);

    const initialState = {
      time: 0,
      altitude: 0,
      vVert: 0,
      vHoriz: 0,
      fuel: 100,
      downrange: 0,
    };

    let nominal = { ...initialState };
    let display = { ...initialState };

    let hasAnomaly = false;
    let anomalyStart = 0;

    interval = setInterval(() => {
      // Nominal run (always Falcon 9)
      nominal = runPhysicsTick(nominal, F9_CONSTANTS);

      // Display run (predictive = same rocket but with anomaly, comparative = user params)
      if (mode === "predictive") {
        display = runPhysicsTick(display, F9_CONSTANTS);

        // Random anomaly window
        if (
          display.time > 40 &&
          display.time < 100 &&
          !hasAnomaly &&
          Math.random() < 0.15
        ) {
          hasAnomaly = true;
          anomalyStart = display.time;
        }

        // Apply anomaly AFTER tick so it persists
        if (hasAnomaly) {
          display.fuel -= 0.1 * Math.pow(display.time - anomalyStart, 1.5);
          display.fuel = Math.max(0, display.fuel);
        }
      } else {
        display = runPhysicsTick(display, { ...F9_CONSTANTS, ...params });
      }

      // Anomaly warning
      let anomalyMessage = null;
      if (mode === "predictive" && nominal.fuel - display.fuel > 2.0) {
        anomalyMessage = "⚠️ High Burn Rate Anomaly Detected!";
      }

      // Emit
      socket.emit("data", {
        time: nominal.time,
        nominal: {
          altitude: nominal.altitude,
          downrange: nominal.downrange,
          velocity: Math.sqrt(nominal.vVert ** 2 + nominal.vHoriz ** 2),
          fuel: nominal.fuel,
          thrust: nominal.thrust,
        },
        display: {
          altitude: display.altitude,
          downrange: display.downrange,
          velocity: Math.sqrt(display.vVert ** 2 + display.vHoriz ** 2),
          fuel: display.fuel,
          thrust: display.thrust,
        },
        anomaly: anomalyMessage,
      });

      // Stop after MECO
      if (nominal.time >= F9_CONSTANTS.burn_duration) {
        clearInterval(interval);
      }
    }, UPDATE_INTERVAL_MS);
  });

  socket.on("disconnect", () => {
    clearInterval(interval);
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
