const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
app.use(express.static("."));

// --- NOMINAL FALCON 9 CONSTANTS ---
const F9_CONSTANTS = {
  thrust: 7607, // Sea-level thrust (kN)
  dry_mass: 25600, // Stage dry mass (kg)
  fuel_mass: 395700, // Propellant mass (kg)
  burn_duration: 162, // First stage burn duration (s)
  vacuumThrust: 8227, // Vacuum thrust (kN)
  endThrust: 4800, // Thrust at throttle-down before MECO (kN)
  maxQTime: 70, // Time of Max-Q, used for thrust profile (s)
};

const GRAVITY_MS2 = 9.807;
const UPDATE_INTERVAL_MS = 250;

// --- Physics tick function ---
function runPhysicsTick(state, constants) {
  // Destructure state for easier access
  let { time, altitude, vVert, vHoriz, fuel, downrange } = state;

  // Destructure constants
  const {
    thrust,
    dry_mass,
    fuel_mass,
    burn_duration,
    vacuumThrust,
    endThrust,
    maxQTime,
  } = constants;

  const dt = UPDATE_INTERVAL_MS / 1000; // Time step in seconds

  // --- Fuel and Mass Calculation ---
  const t_frac = time / burn_duration;
  fuel = Math.max(0, 100 * (1 - t_frac)); // Linear fuel consumption
  const propMass = fuel_mass * (fuel / 100);
  const totalMass = dry_mass + propMass;

  // Exit if mass is non-positive to prevent division by zero
  if (totalMass <= 0) {
    return { ...state, fuel: 0, thrust: 0 };
  }

  // --- Thrust Profile ---
  let currentThrust;
  if (time < maxQTime) {
    // Linear interpolation from sea-level to vacuum thrust up to Max-Q
    currentThrust = thrust + (vacuumThrust - thrust) * (time / maxQTime);
  } else {
    // Linear interpolation from vacuum to end-of-burn thrust
    currentThrust =
      vacuumThrust -
      (vacuumThrust - endThrust) *
        ((time - maxQTime) / (burn_duration - maxQTime));
  }

  // --- CORRECTED FORCE CALCULATION ---
  // 1. Define forces individually in Newtons
  const thrustForce = currentThrust * 1000;
  const gravityForce = totalMass * GRAVITY_MS2;

  // 2. Define the rocket's pitch angle (gravity turn)
  // Angle from the vertical axis. 0 is straight up.
  const pitch = (Math.PI / 4) * t_frac; // Pitches to 45 degrees by MECO

  // 3. Decompose the thrust force into vertical and horizontal components
  const thrustVertical = thrustForce * Math.cos(pitch);
  const thrustHorizontal = thrustForce * Math.sin(pitch);

  // 4. Calculate the net force in each direction
  // Gravity acts only in the negative vertical direction.
  const netForceVertical = thrustVertical - gravityForce;
  const netForceHorizontal = thrustHorizontal; // No drag in this model

  // 5. Calculate acceleration based on Newton's Second Law (F=ma => a=F/m)
  const verticalAcceleration = netForceVertical / totalMass;
  const horizontalAcceleration = netForceHorizontal / totalMass;

  // --- Update Kinematics ---
  // Update velocities based on acceleration over the time step
  vVert += verticalAcceleration * dt;
  vHoriz += horizontalAcceleration * dt;

  // Update positions based on new velocities over the time step
  altitude += vVert * dt;
  downrange += vHoriz * dt;
  time += dt;

  return {
    time,
    altitude,
    vVert,
    vHoriz,
    fuel,
    downrange,
    thrust: currentThrust,
  };
}

// --- Socket.IO simulation logic ---
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  let interval;

  socket.on("start-simulation", ({ mode, params }) => {
    console.log(`Starting ${mode} simulation`);
    // Initial state for both nominal and display simulations
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
      // Run the physics for the "perfect" nominal flight
      nominal = runPhysicsTick(nominal, F9_CONSTANTS);

      // Run physics for the flight to be displayed (which can have anomalies/changes)
      if (mode === "predictive") {
        display = runPhysicsTick(display, F9_CONSTANTS);
        // Introduce a random fuel leak anomaly
        if (
          display.time > 40 &&
          display.time < 100 &&
          !hasAnomaly &&
          Math.random() < 0.15
        ) {
          hasAnomaly = true;
          anomalyStart = display.time;
        }
        if (hasAnomaly) {
          display.fuel -= 0.1 * Math.pow(display.time - anomalyStart, 1.5);
          display.fuel = Math.max(0, display.fuel);
        }
      } else {
        // Run with user-defined parameters
        display = runPhysicsTick(display, { ...F9_CONSTANTS, ...params });
      }

      // Check for significant deviation to display a warning
      let anomalyMessage = null;
      if (mode === "predictive" && nominal.fuel - display.fuel > 2.0) {
        anomalyMessage = "⚠️  High Burn Rate Anomaly Detected!";
      }

      // Emit the data packet to the client
      socket.emit("data", {
        time: nominal.time,
        nominal: {
          altitude: nominal.altitude,
          downrange: nominal.downrange,
          velocity: Math.sqrt(nominal.vVert ** 2 + nominal.vHoriz ** 2),
          fuel: nominal.fuel,
          thrust: nominal.thrust, // Already in kN from constants
        },
        display: {
          altitude: display.altitude,
          downrange: display.downrange,
          velocity: Math.sqrt(display.vVert ** 2 + display.vHoriz ** 2),
          fuel: display.fuel,
          thrust: display.thrust, // Already in kN
        },
        anomaly: anomalyMessage,
      });

      // Stop the simulation after the main engine cutoff (MECO)
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
