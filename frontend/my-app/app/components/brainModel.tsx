"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

declare global { interface Window { BrainBrowser: any } }

type RegionMode = "global" | "AF7" | "AF8" | "TP9" | "TP10";

interface ElectrodeData {
  electrode_name: string;
  alpha: number;
  beta: number;
  beta_alpha_ratio: number;
  stress_intensity: number;
  timestamp: string;
}

interface ElectrodeStress {
  [key: string]: {
    intensity: number;
    lastUpdate: number;
  };
}

export default function BrainStressDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const [electrodeStress, setElectrodeStress] = useState<ElectrodeStress>({
    AF7: { intensity: 0, lastUpdate: 0 },
    AF8: { intensity: 0, lastUpdate: 0 },
    TP9: { intensity: 0, lastUpdate: 0 },
    TP10: { intensity: 0, lastUpdate: 0 }
  });

  // Use ref to always have access to latest state in closures
  const electrodeStressRef = useRef(electrodeStress);

  // Update ref whenever state changes
  useEffect(() => {
    electrodeStressRef.current = electrodeStress;
  }, [electrodeStress]);

  // Fade duration in milliseconds
  const FADE_DURATION = 8000; // 8 seconds fade out

  useEffect(() => {
    function loadScript(url: string): Promise<void> {
      return new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = url;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => { console.error("Failed to load:", url); reject(new Error(`Failed to load ${url}`)); };
        document.body.appendChild(s);
      });
    }

    (async () => {
      try {
        // Load BrainBrowser from local public directory
        await loadScript("/brain/brainbrowser.surface-viewer.min.js");

        const BrainBrowser = window.BrainBrowser;
        if (!BrainBrowser?.SurfaceViewer) {
          console.error("BrainBrowser loaded but SurfaceViewer is missing");
          return;
        }

        // Configure BrainBrowser workers
        BrainBrowser.config.set("worker_dir", "/brain/workers/");

        // Set the worker for MNI OBJ file format (relative to worker_dir)
        BrainBrowser.config.set("model_types.mniobj.worker", "mniobj.worker.js");

        // Set the worker for intensity data (relative to worker_dir)
        BrainBrowser.config.set("intensity_data_types.txt.worker", "text.intensity.worker.js");

        BrainBrowser.SurfaceViewer.start("brainbrowser-container", (viewer: any) => {
          // Add event listeners
          viewer.addEventListener("displaymodel", () => {
            console.log("Model displayed!");
          });

          viewer.addEventListener("loadintensitydata", () => {
            console.log("Intensity data loaded!");
          });

          viewer.addEventListener("changeintensityrange", () => {
            console.log("Intensity range changed!");
          });

          // Start rendering
          viewer.render();

          // Load color map (asynchronously, no callback needed)
          viewer.loadColorMapFromURL("/brain/spectral.txt");

          // Load the brain model
          viewer.loadModelFromURL("/brain/brain-surface.obj", {
            format: "mniobj",
            complete: function() {
              // Load intensity data
              console.log("Loading intensity data...");
              viewer.loadIntensityDataFromURL("/brain/atlas-values.txt", {
                complete: function() {
                  console.log("Intensity data load complete!");
                  console.log("Brain visualization ready!");
                  console.log("Viewer model:", viewer.model);
                  console.log("Viewer model_data:", viewer.model_data);

                  // Setup animation
                  // Get the first shape from the model
                  const shapes = viewer.model.children;
                  if (shapes.length === 0) {
                    console.error("No shapes in model!");
                    return;
                  }

                  const shape = shapes[0];
                  const geometry = shape.geometry;
                  const n = geometry.attributes.position.array.length / 3;
                  const positions = geometry.attributes.position.array as Float32Array;

                  // Get intensity data from model_data
                  const model_data = viewer.model_data.get(shape.userData.model_name);
                  const intensity_data = model_data?.intensity_data?.[0];

                  if (!intensity_data) {
                    console.error("No intensity data found!");
                    return;
                  }

                  console.log("Intensity data array length:", intensity_data.values?.length);

                  // Store original intensity values for restoration
                  const originalValues = new Float32Array(intensity_data.values);

                  // Auto-rotation setup with BrainBrowser's built-in autorotate
                  let rotationPauseTimeout: NodeJS.Timeout | null = null;
                  const PAUSE_DURATION = 2000; // Resume rotation after 2 seconds of inactivity

                  // Enable auto-rotation with multi-axis rotation for dynamic movement
                  // BrainBrowser autorotate uses boolean flags for each axis
                  viewer.autorotate.x = true;  // Rotate around X axis (up/down tilt)
                  viewer.autorotate.y = true;  // Rotate around Y axis (left/right spin)
                  viewer.autorotate.z = true;  // Rotate around Z axis (slight roll)

                  // Track if user is currently interacting
                  let isInteracting = false;
                  let wasAutorotating = { x: true, y: true, z: true };

                  // Add event listeners to the DOM element for more reliable interaction detection
                  const container = viewer.dom_element;

                  const pauseRotation = () => {
                    isInteracting = true;
                    wasAutorotating = {
                      x: viewer.autorotate.x,
                      y: viewer.autorotate.y,
                      z: viewer.autorotate.z
                    };
                    viewer.autorotate.x = false;
                    viewer.autorotate.y = false;
                    viewer.autorotate.z = false;

                    if (rotationPauseTimeout) {
                      clearTimeout(rotationPauseTimeout);
                      rotationPauseTimeout = null;
                    }
                  };

                  const resumeRotation = () => {
                    isInteracting = false;
                    if (rotationPauseTimeout) {
                      clearTimeout(rotationPauseTimeout);
                    }
                    rotationPauseTimeout = setTimeout(() => {
                      if (!isInteracting) {
                        viewer.autorotate.x = true;
                        viewer.autorotate.y = true;
                        viewer.autorotate.z = true;
                      }
                    }, PAUSE_DURATION);
                  };

                  container.addEventListener("mousedown", pauseRotation);
                  container.addEventListener("mouseup", resumeRotation);
                  container.addEventListener("mouseleave", resumeRotation); // Resume when cursor leaves
                  container.addEventListener("touchstart", pauseRotation);
                  container.addEventListener("touchend", resumeRotation);
                  container.addEventListener("touchcancel", resumeRotation); // Resume if touch cancelled

                  // Also listen globally for mouseup in case user releases outside container
                  const globalMouseUp = () => {
                    if (isInteracting) {
                      resumeRotation();
                    }
                  };
                  document.addEventListener("mouseup", globalMouseUp);

                  // Realistic brain activity baseline - most of brain has low-moderate activity
                  const BASELINE_ACTIVITY = 10;     // Resting brain regions (gray-blue)
                  const NORMAL_ACTIVITY = 20;      // Default active regions (light blue-green)
                  const HIGH_STRESS = 130;          // High stress/beta activity (red) - maps to upper end of color scale

                  // Initialize brain with realistic baseline activity distribution
                  for (let k = 0; k < n; k++) {
                    const x = positions[3*k + 0];
                    const y = positions[3*k + 1];
                    const z = positions[3*k + 2];

                    // Default cortex to normal activity
                    let baseActivity = NORMAL_ACTIVITY;

                    // Frontal cortex (executive function) - slightly higher baseline
                    if (y > 40 && z > 0) baseActivity = NORMAL_ACTIVITY + 0.05;

                    // Motor cortex (top of brain) - moderate activity
                    if (z > 60) baseActivity = NORMAL_ACTIVITY;

                    // Visual cortex (back of brain) - varies
                    if (y < -40) baseActivity = BASELINE_ACTIVITY + 0.1;

                    intensity_data.values[k] = baseActivity;
                  }
                  viewer.updateColors();

                  // Reset brain to baseline activity distribution
                  function resetToBaseline() {
                    if (!intensity_data || !intensity_data.values) return;

                    for (let k = 0; k < n; k++) {
                      const x = positions[3*k + 0];
                      const y = positions[3*k + 1];
                      const z = positions[3*k + 2];

                      let baseActivity = NORMAL_ACTIVITY;
                      if (y > 40 && z > 0) baseActivity = NORMAL_ACTIVITY + 0.05;
                      if (z > 60) baseActivity = NORMAL_ACTIVITY;
                      if (y < -40) baseActivity = BASELINE_ACTIVITY + 0.1;

                      intensity_data.values[k] = baseActivity;
                    }
                  }

                  // Paint a specific region with stress intensity
                  function paintRegion(mode: RegionMode, value01: number) {
                    if (!intensity_data || !intensity_data.values || mode === "global") return;

                    console.log(`Painting ${mode}: ${value01.toFixed(2)}`);

                    let highlightedCount = 0;
                    const RADIUS = 30; // Localized influence radius

                    for (let k = 0; k < n; k++) {
                      const x = positions[3*k + 0];
                      const y = positions[3*k + 1];
                      const z = positions[3*k + 2];

                      let inRegion = false;

                      if (mode === "AF7") {
                        // Left frontal (above left eye)
                        const centerX = 35, centerY = 55, centerZ = 30;
                        const dist = Math.sqrt(
                          Math.pow(x - centerX, 2) +
                          Math.pow(y - centerY, 2) +
                          Math.pow(z - centerZ, 2)
                        );
                        inRegion = dist < RADIUS;
                      } else if (mode === "AF8") {
                        // Right frontal (above right eye)
                        const centerX = -35, centerY = 55, centerZ = 30;
                        const dist = Math.sqrt(
                          Math.pow(x - centerX, 2) +
                          Math.pow(y - centerY, 2) +
                          Math.pow(z - centerZ, 2)
                        );
                        inRegion = dist < RADIUS;
                      } else if (mode === "TP9") {
                        // Left temporal (behind left ear)
                        const centerX = 65, centerY = -10, centerZ = 0;
                        const dist = Math.sqrt(
                          Math.pow(x - centerX, 2) +
                          Math.pow(y - centerY, 2) +
                          Math.pow(z - centerZ, 2)
                        );
                        inRegion = dist < RADIUS;
                      } else if (mode === "TP10") {
                        // Right temporal (behind right ear)
                        const centerX = -65, centerY = -10, centerZ = 0;
                        const dist = Math.sqrt(
                          Math.pow(x - centerX, 2) +
                          Math.pow(y - centerY, 2) +
                          Math.pow(z - centerZ, 2)
                        );
                        inRegion = dist < RADIUS;
                      }

                      if (inRegion) {
                        // Blend from baseline to high stress based on value01
                        intensity_data.values[k] = BASELINE_ACTIVITY + (HIGH_STRESS - BASELINE_ACTIVITY) * value01;
                        highlightedCount++;
                      }
                    }
                    console.log(`Highlighted ${highlightedCount} vertices in ${mode} region`);
                  }

                  // Function to update brain visualization based on current electrode stress levels
                  function updateBrainVisualization() {
                    const now = Date.now();

                    // Reset to baseline first
                    resetToBaseline();

                    // Use ref to get latest state (avoids stale closure)
                    const currentStress = electrodeStressRef.current;

                    console.log('Updating visualization, current stress:', currentStress);

                    // Paint each electrode region with fade-out based on time since last update
                    Object.entries(currentStress).forEach(([electrodeName, data]) => {
                      const timeSinceUpdate = now - data.lastUpdate;

                      // Only paint if we have recent data (within FADE_DURATION)
                      if (timeSinceUpdate < FADE_DURATION && data.intensity > 0) {
                        // Calculate fade factor (1.0 = just updated, 0.0 = fully faded)
                        const fadeFactor = 1 - (timeSinceUpdate / FADE_DURATION);

                        // Apply fade to intensity
                        const fadedIntensity = data.intensity * fadeFactor;

                        console.log(`${electrodeName}: intensity=${data.intensity.toFixed(2)}, fade=${fadeFactor.toFixed(2)}, final=${fadedIntensity.toFixed(2)}`);

                        // Only paint if intensity is significant
                        if (fadedIntensity > 0.1) {
                          paintRegion(electrodeName as RegionMode, fadedIntensity);
                        }
                      }
                    });

                    // Update colors once after painting all regions
                    viewer.updateColors();
                  }

                  // Set up animation loop for smooth fade-out
                  const animationTimer = setInterval(() => {
                    updateBrainVisualization();
                  }, 100); // Update at 10fps for smooth fading

                  // Subscribe to electrode_data updates from Supabase
                  const channel = supabase
                    .channel('electrode-updates')
                    .on(
                      'postgres_changes',
                      {
                        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                        schema: 'public',
                        table: 'electrode_data'
                      },
                      (payload) => {
                        console.log('Electrode data update:', payload);

                        if (payload.new && typeof payload.new === 'object') {
                          const data = payload.new as ElectrodeData;
                          const electrodeName = data.electrode_name;

                          // Update state with new electrode data
                          setElectrodeStress(prev => ({
                            ...prev,
                            [electrodeName]: {
                              intensity: data.stress_intensity,
                              lastUpdate: Date.now()
                            }
                          }));

                          console.log(`${electrodeName}: stress=${data.stress_intensity.toFixed(2)}, ratio=${data.beta_alpha_ratio.toFixed(2)}`);
                        }
                      }
                    )
                    .subscribe();

                  console.log("Subscribed to electrode_data realtime updates");

                  viewer.addEventListener("destroy", () => {
                    // Clean up animation timer
                    clearInterval(animationTimer);

                    // Clean up Supabase subscription
                    channel.unsubscribe();

                    if (rotationPauseTimeout) {
                      clearTimeout(rotationPauseTimeout);
                    }
                    // Remove DOM event listeners
                    container.removeEventListener("mousedown", pauseRotation);
                    container.removeEventListener("mouseup", resumeRotation);
                    container.removeEventListener("mouseleave", resumeRotation);
                    container.removeEventListener("touchstart", pauseRotation);
                    container.removeEventListener("touchend", resumeRotation);
                    container.removeEventListener("touchcancel", resumeRotation);
                    document.removeEventListener("mouseup", globalMouseUp);
                    // Disable autorotation
                    viewer.autorotate.x = false;
                    viewer.autorotate.y = false;
                    viewer.autorotate.z = false;
                  });
                }
              });
            }
          });
        });
      } catch (e) {
        console.error(e);
      }
    })();

    return () => { /* nothing to cleanup; scripts left in DOM is fine in dev */ };
  }, []);

  return (
    <div
      id="brainbrowser-container"
      ref={ref}
      style={{
        width: "100%",
        height: "80vh",
        border: "1px solid #333",
        borderRadius: "8px",
        overflow: "hidden"
      }}
    />
  );
}
