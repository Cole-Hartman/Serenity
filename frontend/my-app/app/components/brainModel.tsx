"use client";

import { useEffect, useRef } from "react";

declare global { interface Window { BrainBrowser: any } }

type RegionMode = "global" | "AF7" | "AF8" | "TP9" | "TP10";

export default function BrainStressDemo() {
  const ref = useRef<HTMLDivElement>(null);

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
                  const HIGH_STRESS = 0.85;          // High stress/beta activity (red)

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

                  function paint(mode: RegionMode, value01: number) {
                    if (!intensity_data || !intensity_data.values) return;

                    console.log(`Painting mode: ${mode}, intensity: ${value01.toFixed(2)}`);

                    // Reset to baseline activity distribution
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

                    // Highlight specific electrode regions based on Muse 2 positions
                    if (mode !== "global") {
                      let highlightedCount = 0;

                      for (let k = 0; k < n; k++) {
                        const x = positions[3*k + 0];
                        const y = positions[3*k + 1];
                        const z = positions[3*k + 2];

                        // Calculate distance from electrode position
                        let inRegion = false;
                        const RADIUS = 30; // Localized influence radius

                        if (mode === "AF7") {
                          // Left frontal (above left eye) - x > 0 (left), y > 0 (front), z > 0 (upper)
                          const centerX = 35, centerY = 55, centerZ = 30;
                          const dist = Math.sqrt(
                            Math.pow(x - centerX, 2) +
                            Math.pow(y - centerY, 2) +
                            Math.pow(z - centerZ, 2)
                          );
                          inRegion = dist < RADIUS;
                        }

                        if (mode === "AF8") {
                          // Right frontal (above right eye) - x < 0 (right), y > 0 (front), z > 0 (upper)
                          const centerX = -35, centerY = 55, centerZ = 30;
                          const dist = Math.sqrt(
                            Math.pow(x - centerX, 2) +
                            Math.pow(y - centerY, 2) +
                            Math.pow(z - centerZ, 2)
                          );
                          inRegion = dist < RADIUS;
                        }

                        if (mode === "TP9") {
                          // Left temporal (behind left ear) - x > 0 (left), y < 0 (back), z ~ 0 (side)
                          const centerX = 65, centerY = -10, centerZ = 0;
                          const dist = Math.sqrt(
                            Math.pow(x - centerX, 2) +
                            Math.pow(y - centerY, 2) +
                            Math.pow(z - centerZ, 2)
                          );
                          inRegion = dist < RADIUS;
                        }

                        if (mode === "TP10") {
                          // Right temporal (behind right ear) - x < 0 (right), y < 0 (back), z ~ 0 (side)
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
                          intensity_data.values[k] = 75.5 + BASELINE_ACTIVITY + (HIGH_STRESS - BASELINE_ACTIVITY) * value01;
                          highlightedCount++;
                        }
                      }
                      console.log(`Highlighted ${highlightedCount} vertices in ${mode} region`);
                    }

                    viewer.updateColors();
                  }

                  // Simulate Muse 2 electrode activity with mock data
                  // In production, replace with real EEG data from your Supabase stream
                  let t = 0;
                  const timer = setInterval(() => {
                    t += 0.25;

                    // Simulate beta/alpha ratios for each electrode (0-1 scale)
                    const af7Stress = 0.5 + 0.4 * Math.sin(t * 0.7);  // Left frontal stress
                    const af8Stress = 0.5 + 0.3 * Math.cos(t * 0.5);  // Right frontal stress
                    const tp9Stress = 0.5 + 0.35 * Math.sin(t * 0.4); // Left temporal
                    const tp10Stress = 0.5 + 0.25 * Math.cos(t * 0.6); // Right temporal

                    // Light up the electrode with highest stress
                    const maxStress = Math.max(af7Stress, af8Stress, tp9Stress, tp10Stress);

                    if (af7Stress === maxStress && af7Stress > 0.65) {
                      paint("AF7", af7Stress);
                    } else if (af8Stress === maxStress && af8Stress > 0.65) {
                      paint("AF8", af8Stress);
                    } else if (tp9Stress === maxStress && tp9Stress > 0.6) {
                      paint("TP9", tp9Stress);
                    } else if (tp10Stress === maxStress && tp10Stress > 0.6) {
                      paint("TP10", tp10Stress);
                    } else {
                      // Show baseline when no significant stress
                      paint("global", 0);
                    }
                  }, 800);

                  viewer.addEventListener("destroy", () => {
                    clearInterval(timer);
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
