"use client";

import { useEffect, useRef } from "react";

const CLOUDS = [
  {
    id: "far-01",
    src: "/assets/clouds/cloud-small-01.webp",
    layer: "far",
  },
  {
    id: "mid-01",
    src: "/assets/clouds/cloud-medium-01.webp",
    layer: "mid",
  },
  {
    id: "near-01",
    src: "/assets/clouds/cloud-large-01.webp",
    layer: "near",
  },
];

function randomBetween(minimum, maximum) {
  return Math.random() * (maximum - minimum) + minimum;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export default function FlightScene() {
  const sceneRef = useRef(null);
  const planeRef = useRef(null);
  const cloudRefs = useRef([]);

  const movementRef = useRef({
    x: 0,
    targetX: 0,
    velocityX: 0,
    leftPressed: false,
    rightPressed: false,
    dragging: false,
    previousPointerX: 0,
    previousViewportWidth: 0,
  });

  const cloudStatesRef = useRef([]);

  useEffect(() => {
    const scene = sceneRef.current;
    const plane = planeRef.current;

    if (!scene || !plane) {
      return;
    }

    const movement = movementRef.current;

    let animationFrameId;
    let previousTime = performance.now();
    let elapsedTime = 0;

    function getCloudSettings(layer) {
      const viewportWidth = window.innerWidth;

      if (layer === "far") {
        return {
          minimumSpeed: 12,
          maximumSpeed: 18,
          minimumWidth: Math.max(
            120,
            viewportWidth * 0.11
          ),
          maximumWidth: Math.min(
            260,
            viewportWidth * 0.2
          ),
          minimumOpacity: 0.5,
          maximumOpacity: 0.68,
          swayMinimum: 4,
          swayMaximum: 8,
          rotationRange: 3,
        };
      }

      if (layer === "mid") {
        return {
          minimumSpeed: 26,
          maximumSpeed: 36,
          minimumWidth: Math.max(
            220,
            viewportWidth * 0.23
          ),
          maximumWidth: Math.min(
            520,
            viewportWidth * 0.4
          ),
          minimumOpacity: 0.72,
          maximumOpacity: 0.9,
          swayMinimum: 7,
          swayMaximum: 14,
          rotationRange: 4,
        };
      }

      return {
        minimumSpeed: 48,
        maximumSpeed: 66,
        minimumWidth: Math.max(
          420,
          viewportWidth * 0.48
        ),
        maximumWidth: Math.min(
          980,
          viewportWidth * 0.82
        ),
        minimumOpacity: 0.88,
        maximumOpacity: 1,
        swayMinimum: 12,
        swayMaximum: 24,
        rotationRange: 5,
      };
    }

    function createCloudState(
      cloudDefinition,
      index,
      initial = false
    ) {
      const settings = getCloudSettings(
        cloudDefinition.layer
      );

      const width = randomBetween(
        settings.minimumWidth,
        settings.maximumWidth
      );

      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      return {
        index,

        x: randomBetween(
          -width * 0.45,
          viewportWidth - width * 0.55
        ),

        y: initial
          ? randomBetween(
              -viewportHeight * 0.8,
              viewportHeight * 0.8
            )
          : randomBetween(
              -viewportHeight * 0.55,
              -width * 0.45
            ),

        width,

        speed: randomBetween(
          settings.minimumSpeed,
          settings.maximumSpeed
        ),

        opacity: randomBetween(
          settings.minimumOpacity,
          settings.maximumOpacity
        ),

        rotation: randomBetween(
          -settings.rotationRange,
          settings.rotationRange
        ),

        swayAmount: randomBetween(
          settings.swayMinimum,
          settings.swayMaximum
        ),

        swaySpeed: randomBetween(0.12, 0.3),

        phase: randomBetween(0, Math.PI * 2),
      };
    }

    function initialiseClouds() {
      const viewportHeight = window.innerHeight;

      cloudStatesRef.current = CLOUDS.map(
        (cloudDefinition, index) => {
          const cloudState = createCloudState(
            cloudDefinition,
            index,
            true
          );

          if (cloudDefinition.layer === "far") {
            cloudState.y = -viewportHeight * 0.15;
            cloudState.x = window.innerWidth * 0.08;
          }

          if (cloudDefinition.layer === "mid") {
            cloudState.y = viewportHeight * 0.2;
            cloudState.x = window.innerWidth * 0.55;
          }

          if (cloudDefinition.layer === "near") {
            cloudState.y = -viewportHeight * 0.65;
            cloudState.x = -cloudState.width * 0.2;
          }

          return cloudState;
        }
      );
    }

    function recycleCloud(
      cloudState,
      cloudDefinition
    ) {
      const replacementState = createCloudState(
        cloudDefinition,
        cloudState.index,
        false
      );

      Object.assign(cloudState, replacementState);
    }

    function updateClouds(deltaTime) {
      const viewportHeight = window.innerHeight;

      cloudStatesRef.current.forEach(
        (cloudState, index) => {
          const cloudElement =
            cloudRefs.current[index];

          const cloudDefinition = CLOUDS[index];

          if (!cloudElement || !cloudDefinition) {
            return;
          }

          cloudState.y +=
            cloudState.speed * deltaTime;

          const swayX =
            Math.sin(
              elapsedTime * cloudState.swaySpeed +
                cloudState.phase
            ) * cloudState.swayAmount;

          const slowRotation =
            Math.sin(
              elapsedTime * 0.08 +
                cloudState.phase
            ) * 0.7;

          cloudElement.style.width =
            `${cloudState.width}px`;

          cloudElement.style.opacity =
            `${cloudState.opacity}`;

          cloudElement.style.transform = `
            translate3d(
              ${cloudState.x + swayX}px,
              ${cloudState.y}px,
              0
            )
            rotate(
              ${
                cloudState.rotation +
                slowRotation
              }deg
            )
          `;

          const cloudHeight =
            cloudElement.getBoundingClientRect()
              .height ||
            cloudState.width * 0.6;

          if (
            cloudState.y >
            viewportHeight + cloudHeight
          ) {
            recycleCloud(
              cloudState,
              cloudDefinition
            );
          }
        }
      );
    }

    function getPlaneWidth() {
      return plane.getBoundingClientRect().width;
    }

    function getPlaneBounds() {
      const planeWidth = getPlaneWidth();
      const edgePadding = 16;

      return {
        minX: planeWidth / 2 + edgePadding,
        maxX:
          window.innerWidth -
          planeWidth / 2 -
          edgePadding,
      };
    }

    function clampPlanePosition(value) {
      const { minX, maxX } = getPlaneBounds();

      return clamp(value, minX, maxX);
    }

    function centrePlane() {
      const centreX = window.innerWidth / 2;

      movement.x = centreX;
      movement.targetX = centreX;
      movement.previousViewportWidth =
        window.innerWidth;
    }

    function handleKeyDown(event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        movement.leftPressed = true;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        movement.rightPressed = true;
      }
    }

    function handleKeyUp(event) {
      if (event.key === "ArrowLeft") {
        movement.leftPressed = false;
      }

      if (event.key === "ArrowRight") {
        movement.rightPressed = false;
      }
    }

    function handleWindowBlur() {
      movement.leftPressed = false;
      movement.rightPressed = false;
      movement.dragging = false;
      movement.velocityX = 0;
    }

    function handlePointerDown(event) {
      if (event.pointerType !== "touch") {
        return;
      }

      movement.dragging = true;
      movement.previousPointerX = event.clientX;

      scene.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event) {
      if (!movement.dragging) {
        return;
      }

      const deltaX =
        event.clientX -
        movement.previousPointerX;

      movement.previousPointerX = event.clientX;

      movement.targetX = clampPlanePosition(
        movement.targetX + deltaX
      );
    }

    function endPointerDrag(event) {
      movement.dragging = false;

      if (
        scene.hasPointerCapture?.(event.pointerId)
      ) {
        scene.releasePointerCapture(
          event.pointerId
        );
      }
    }

    function handleResize() {
      const previousWidth =
        movement.previousViewportWidth ||
        window.innerWidth;

      const normalizedX =
        previousWidth > 0
          ? movement.x / previousWidth
          : 0.5;

      movement.x = clampPlanePosition(
        normalizedX * window.innerWidth
      );

      movement.targetX = clampPlanePosition(
        movement.x
      );

      movement.previousViewportWidth =
        window.innerWidth;

      cloudStatesRef.current.forEach(
        (cloudState, index) => {
          const cloudDefinition = CLOUDS[index];

          if (!cloudDefinition) {
            return;
          }

          const settings = getCloudSettings(
            cloudDefinition.layer
          );

          cloudState.width = clamp(
            cloudState.width,
            settings.minimumWidth,
            settings.maximumWidth
          );

          cloudState.x = clamp(
            cloudState.x,
            -cloudState.width * 0.5,
            window.innerWidth -
              cloudState.width * 0.5
          );
        }
      );
    }

    function updatePlane(deltaTime) {
      const acceleration =
        window.innerWidth * 2.1;

      const maximumSpeed = Math.min(
        700,
        Math.max(
          260,
          window.innerWidth * 0.55
        )
      );

      if (movement.leftPressed) {
        movement.velocityX -=
          acceleration * deltaTime;
      }

      if (movement.rightPressed) {
        movement.velocityX +=
          acceleration * deltaTime;
      }

      movement.velocityX = clamp(
        movement.velocityX,
        -maximumSpeed,
        maximumSpeed
      );

      if (
        !movement.leftPressed &&
        !movement.rightPressed
      ) {
        const friction = Math.pow(
          0.0008,
          deltaTime
        );

        movement.velocityX *= friction;
      }

      movement.targetX +=
        movement.velocityX * deltaTime;

      movement.targetX = clampPlanePosition(
        movement.targetX
      );

      const smoothing =
        1 - Math.pow(0.00001, deltaTime);

      movement.x +=
        (movement.targetX - movement.x) *
        smoothing;

      movement.x = clampPlanePosition(
        movement.x
      );

      const hoverOffsetY =
        Math.sin(elapsedTime * 0.9) * 5 +
        Math.sin(
          elapsedTime * 0.37 + 1.8
        ) *
          3;

      const ambientRotation =
        Math.sin(elapsedTime * 0.7) * 0.7;

      const steeringDifference =
        movement.targetX - movement.x;

      const steeringRotation = clamp(
        steeringDifference * 0.035,
        -4,
        4
      );

      const hoverScale =
        1 +
        Math.sin(elapsedTime * 0.55) *
          0.004;

      plane.style.transform = `
        translate3d(
          ${movement.x}px,
          ${hoverOffsetY}px,
          0
        )
        translate(-50%, -50%)
        rotate(
          ${
            steeringRotation +
            ambientRotation
          }deg
        )
        scale(${hoverScale})
      `;
    }

    function animate(currentTime) {
      const deltaTime = Math.min(
        (currentTime - previousTime) / 1000,
        0.05
      );

      previousTime = currentTime;
      elapsedTime += deltaTime;

      updateClouds(deltaTime);
      updatePlane(deltaTime);

      animationFrameId =
        requestAnimationFrame(animate);
    }

    centrePlane();
    initialiseClouds();

    window.addEventListener(
      "keydown",
      handleKeyDown,
      { passive: false }
    );

    window.addEventListener(
      "keyup",
      handleKeyUp
    );

    window.addEventListener(
      "blur",
      handleWindowBlur
    );

    window.addEventListener(
      "resize",
      handleResize
    );

    scene.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    scene.addEventListener(
      "pointermove",
      handlePointerMove
    );

    scene.addEventListener(
      "pointerup",
      endPointerDrag
    );

    scene.addEventListener(
      "pointercancel",
      endPointerDrag
    );

    animationFrameId =
      requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      window.removeEventListener(
        "keyup",
        handleKeyUp
      );

      window.removeEventListener(
        "blur",
        handleWindowBlur
      );

      window.removeEventListener(
        "resize",
        handleResize
      );

      scene.removeEventListener(
        "pointerdown",
        handlePointerDown
      );

      scene.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      scene.removeEventListener(
        "pointerup",
        endPointerDrag
      );

      scene.removeEventListener(
        "pointercancel",
        endPointerDrag
      );
    };
  }, []);

  return (
    <main
      ref={sceneRef}
      className="flight-scene"
    >
      <div className="sky-texture" />

      <div className="haze haze-one">
        <img
          src="/assets/atmosphere/haze-soft-01.webp"
          alt=""
          draggable="false"
        />
      </div>

      <div className="haze haze-two">
        <img
          src="/assets/atmosphere/haze-soft-02.webp"
          alt=""
          draggable="false"
        />
      </div>

      <div className="cloud-layer cloud-layer-far">
        {CLOUDS.map((cloud, index) => {
          if (cloud.layer !== "far") {
            return null;
          }

          return (
            <img
              key={cloud.id}
              ref={(element) => {
                cloudRefs.current[index] =
                  element;
              }}
              className="cloud cloud-far"
              src={cloud.src}
              alt=""
              draggable="false"
            />
          );
        })}
      </div>

      <div className="cloud-layer cloud-layer-mid">
        {CLOUDS.map((cloud, index) => {
          if (cloud.layer !== "mid") {
            return null;
          }

          return (
            <img
              key={cloud.id}
              ref={(element) => {
                cloudRefs.current[index] =
                  element;
              }}
              className="cloud cloud-mid"
              src={cloud.src}
              alt=""
              draggable="false"
            />
          );
        })}
      </div>

      <div
        ref={planeRef}
        className="plane"
      >
        <img
          src="/assets/plane/plane-top-view.webp"
          alt="Airplane viewed from above"
          draggable="false"
        />
      </div>

      <div className="cloud-layer cloud-layer-near">
        {CLOUDS.map((cloud, index) => {
          if (cloud.layer !== "near") {
            return null;
          }

          return (
            <img
              key={cloud.id}
              ref={(element) => {
                cloudRefs.current[index] =
                  element;
              }}
              className="cloud cloud-near"
              src={cloud.src}
              alt=""
              draggable="false"
            />
          );
        })}
      </div>

      <div className="grain-overlay" />

      <div className="instructions desktop-instructions">
        Use ← → to steer
      </div>

      <div className="instructions mobile-instructions">
        Drag left or right to steer
      </div>
    </main>
  );
}