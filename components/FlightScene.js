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

const ISLANDS = [
    {
        id: "island-small",
        src: "/assets/islands/island-small-01.webp",
        size: "small",
    },
    {
        id: "island-medium",
        src: "/assets/islands/island-medium-01.webp",
        size: "medium",
    },
    {
        id: "island-large",
        src: "/assets/islands/island-large-01.webp",
        size: "large",
    },
];

const ENABLE_ISLANDS = false;

function randomBetween(minimum, maximum) {
    return Math.random() * (maximum - minimum) + minimum;
}

function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
}

export default function FlightScene() {
    const sceneRef = useRef(null);
    const planeRef = useRef(null);
    const cloudRefs = useRef([]);
    const islandRef = useRef(null);
    const audioRef = useRef(null);

    const movementRef = useRef({
        x: 0,
        targetX: 0,
        velocityX: 0,
        currentTilt: 0,
        leftPressed: false,
        rightPressed: false,
        dragging: false,
        previousPointerX: 0,
        previousViewportWidth: 0,
        soundStarted: false,
    });

    const cloudStatesRef = useRef([]);

    const islandStateRef = useRef({
        active: false,
        definition: null,
        x: 0,
        y: 0,
        width: 0,
        speed: 0,
        opacity: 1,
        rotation: 0,
        swayAmount: 0,
        swaySpeed: 0,
        phase: 0,
        nextSpawnTime: 0,
    });

    useEffect(() => {
        const scene = sceneRef.current;
        const plane = planeRef.current;
        const islandElement = islandRef.current;

        if (!scene || !plane || !islandElement) {
            return;
        }

        const movement = movementRef.current;
        const audio = audioRef.current;
        const islandState = islandStateRef.current;

        let animationFrameId;
        let previousTime = performance.now();
        let elapsedTime = 0;
        let cachedPlaneWidth = 100;

        function startPlaneSound() {
            if (!audio || movement.soundStarted) {
                return;
            }

            audio.volume = 0.06;

            const playPromise = audio.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        movement.soundStarted = true;
                    })
                    .catch((error) => {
                        console.warn(
                            "Plane audio could not start:",
                            error
                        );
                    });
            }
        }

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
                    heightRatio: 0.55,
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
                    heightRatio: 0.6,
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
                heightRatio: 0.65,
            };
        }

        function getIslandSettings(size) {
            const viewportWidth = window.innerWidth;

            if (size === "small") {
                return {
                    minimumWidth: Math.max(
                        130,
                        viewportWidth * 0.11
                    ),
                    maximumWidth: Math.min(
                        240,
                        viewportWidth * 0.2
                    ),
                    minimumSpeed: 18,
                    maximumSpeed: 26,
                    minimumOpacity: 0.55,
                    maximumOpacity: 0.72,
                    swayMinimum: 3,
                    swayMaximum: 7,
                    heightRatio: 0.75,
                };
            }

            if (size === "medium") {
                return {
                    minimumWidth: Math.max(
                        220,
                        viewportWidth * 0.2
                    ),
                    maximumWidth: Math.min(
                        420,
                        viewportWidth * 0.35
                    ),
                    minimumSpeed: 24,
                    maximumSpeed: 34,
                    minimumOpacity: 0.68,
                    maximumOpacity: 0.86,
                    swayMinimum: 5,
                    swayMaximum: 10,
                    heightRatio: 0.72,
                };
            }

            return {
                minimumWidth: Math.max(
                    320,
                    viewportWidth * 0.3
                ),
                maximumWidth: Math.min(
                    620,
                    viewportWidth * 0.52
                ),
                minimumSpeed: 30,
                maximumSpeed: 42,
                minimumOpacity: 0.8,
                maximumOpacity: 0.96,
                swayMinimum: 7,
                swayMaximum: 14,
                heightRatio: 0.7,
            };
        }

        function getCloudXPosition(layer, width) {
            const viewportWidth = window.innerWidth;

            if (layer !== "near") {
                return randomBetween(
                    -width * 0.45,
                    viewportWidth - width * 0.55
                );
            }

            const useLeftSide = Math.random() < 0.5;

            if (useLeftSide) {
                return randomBetween(
                    -width * 0.4,
                    width * 0.05
                );
            }

            return randomBetween(
                viewportWidth - width * 0.95,
                viewportWidth - width * 0.55
            );
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

            const estimatedHeight =
                width * settings.heightRatio;

            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            return {
                index,

                x: getCloudXPosition(
                    cloudDefinition.layer,
                    width
                ),

                y: initial
                    ? randomBetween(
                        -viewportHeight * 0.8,
                        viewportHeight * 0.8
                    )
                    : -estimatedHeight -
                    randomBetween(80, 260),

                width,
                heightRatio: settings.heightRatio,

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
            cloudStatesRef.current = CLOUDS.map(
                (cloudDefinition, index) => {
                    const cloudState = createCloudState(
                        cloudDefinition,
                        index,
                        false
                    );

                    const layerDelay =
                        cloudDefinition.layer === "far"
                            ? randomBetween(20, 140)
                            : cloudDefinition.layer === "mid"
                                ? randomBetween(180, 420)
                                : randomBetween(60, 220);

                    cloudState.y -= layerDelay;

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
              ${cloudState.rotation +
                        slowRotation
                        }deg
            )
          `;

                    const cloudHeight =
                        cloudState.width *
                        cloudState.heightRatio;

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

        function scheduleNextIsland(
            minimumDelay = 12,
            maximumDelay = 24
        ) {
            islandState.nextSpawnTime =
                elapsedTime +
                randomBetween(
                    minimumDelay,
                    maximumDelay
                );
        }

        function chooseIslandX(width) {
            const viewportWidth = window.innerWidth;
            const useLeftSide = Math.random() < 0.5;

            if (useLeftSide) {
                return randomBetween(
                    -width * 0.25,
                    Math.max(
                        20,
                        viewportWidth * 0.25
                    )
                );
            }

            return randomBetween(
                viewportWidth * 0.62,
                viewportWidth - width * 0.55
            );
        }

        function spawnIsland() {
            const definition = randomItem(ISLANDS);
            const settings = getIslandSettings(
                definition.size
            );

            const width = randomBetween(
                settings.minimumWidth,
                settings.maximumWidth
            );

            islandState.active = true;
            islandState.definition = definition;
            islandState.width = width;
            islandState.x = chooseIslandX(width);
            islandState.y = -width * 0.85;

            islandState.speed = randomBetween(
                settings.minimumSpeed,
                settings.maximumSpeed
            );

            islandState.opacity = randomBetween(
                settings.minimumOpacity,
                settings.maximumOpacity
            );

            islandState.rotation = randomBetween(
                -5,
                5
            );

            islandState.swayAmount = randomBetween(
                settings.swayMinimum,
                settings.swayMaximum
            );

            islandState.swaySpeed =
                randomBetween(0.08, 0.18);

            islandState.phase =
                randomBetween(0, Math.PI * 2);

            islandState.heightRatio =
                settings.heightRatio;

            islandElement.src = definition.src;
            islandElement.style.display = "block";
            islandElement.style.width = `${width}px`;
            islandElement.style.opacity =
                `${islandState.opacity}`;
        }

        function deactivateIsland() {
            islandState.active = false;
            islandState.definition = null;

            islandElement.style.display = "none";

            scheduleNextIsland(12, 26);
        }

        function updateIsland(deltaTime) {
            if (!islandState.active) {
                if (
                    elapsedTime >=
                    islandState.nextSpawnTime
                ) {
                    spawnIsland();
                }

                return;
            }

            islandState.y +=
                islandState.speed * deltaTime;

            const swayX =
                Math.sin(
                    elapsedTime *
                    islandState.swaySpeed +
                    islandState.phase
                ) * islandState.swayAmount;

            const rotationOffset =
                Math.sin(
                    elapsedTime * 0.06 +
                    islandState.phase
                ) * 0.6;

            islandElement.style.transform = `
        translate3d(
          ${islandState.x + swayX}px,
          ${islandState.y}px,
          0
        )
        rotate(
          ${islandState.rotation +
                rotationOffset
                }deg
        )
      `;

            const islandHeight =
                islandState.width *
                islandState.heightRatio;

            if (
                islandState.y >
                window.innerHeight + islandHeight
            ) {
                deactivateIsland();
            }
        }

        function updatePlaneMeasurements() {
            cachedPlaneWidth =
                plane.getBoundingClientRect().width ||
                100;
        }

        function getPlaneBounds() {
            const edgePadding = 16;

            return {
                minX:
                    cachedPlaneWidth / 2 +
                    edgePadding,

                maxX:
                    window.innerWidth -
                    cachedPlaneWidth / 2 -
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

            if (
                event.key === "ArrowLeft" ||
                event.key === "ArrowRight"
            ) {
                event.preventDefault();
                startPlaneSound();
            }

            if (event.key === "ArrowLeft") {
                movement.leftPressed = true;
            }

            if (event.key === "ArrowRight") {
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

            startPlaneSound();

            if (event.pointerType !== "touch") {
                return;
            }

            movement.dragging = true;
            movement.previousPointerX =
                event.clientX;

            scene.setPointerCapture(event.pointerId);
        }

        function handlePointerMove(event) {
            if (!movement.dragging) {
                return;
            }

            const deltaX =
                event.clientX -
                movement.previousPointerX;

            movement.previousPointerX =
                event.clientX;

            movement.targetX = clampPlanePosition(
                movement.targetX + deltaX
            );
        }

        function endPointerDrag(event) {
            movement.dragging = false;

            if (
                scene.hasPointerCapture?.(
                    event.pointerId
                )
            ) {
                scene.releasePointerCapture(
                    event.pointerId
                );
            }
        }

        function handleResize() {
            updatePlaneMeasurements();

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
                    const cloudDefinition =
                        CLOUDS[index];

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

            if (islandState.active) {
                islandState.x = clamp(
                    islandState.x,
                    -islandState.width * 0.4,
                    window.innerWidth -
                    islandState.width * 0.5
                );
            }
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

            const pitchRotation =
                Math.sin(elapsedTime * 0.55) * 2.2 +
                Math.sin(elapsedTime * 0.21 + 1.4) * 0.8;

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

            movement.targetX =
                clampPlanePosition(
                    movement.targetX
                );

            const smoothing =
                1 - Math.pow(0.00001, deltaTime);

            movement.x +=
                (movement.targetX - movement.x) *
                smoothing;

            movement.x =
                clampPlanePosition(movement.x);

            const hoverOffsetY =
                Math.sin(elapsedTime * 0.9) * 5 +
                Math.sin(
                    elapsedTime * 0.37 + 1.8
                ) *
                3;

            const ambientRotation =
                Math.sin(elapsedTime * 0.7) *
                0.7;

            const targetTilt = clamp(
                movement.velocityX * 0.012,
                -5,
                5
            );

            movement.currentTilt ??= 0;

            const tiltSmoothing =
                1 - Math.pow(0.0005, deltaTime);

            movement.currentTilt +=
                (targetTilt - movement.currentTilt) *
                tiltSmoothing;

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
                rotateX(${pitchRotation}deg)
                rotateZ(
                    ${movement.currentTilt +
                ambientRotation
                }deg
                )
                scale(${hoverScale})
                `;
        }

        function animate(currentTime) {
            const deltaTime = Math.min(
                (currentTime - previousTime) /
                1000,
                0.05
            );

            previousTime = currentTime;
            elapsedTime += deltaTime;

            updateClouds(deltaTime);
            if (ENABLE_ISLANDS) {
                updateIsland(deltaTime);
            }
            updatePlane(deltaTime);

            animationFrameId =
                requestAnimationFrame(animate);
        }

        updatePlaneMeasurements();
        centrePlane();
        initialiseClouds();

        islandElement.style.display = "none";

        // The first island appears sooner than later islands.

        if (ENABLE_ISLANDS) {
            scheduleNextIsland(5, 10);
        }

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

        //cleanup

        return () => {


            cancelAnimationFrame(
                animationFrameId
            );


            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }

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
            <audio
                ref={audioRef}
                src="/assets/audio/plane-engine-loop.mp3"
                loop
                preload="auto"
            />
            <div className="sky-texture" />

            <div className="haze haze-one">
                <img
                    src="/assets/atmosphere/haze-soft-01.webp"
                    alt=""
                    draggable="false"
                    decoding="async"
                />
            </div>

            <div className="haze haze-two">
                <img
                    src="/assets/atmosphere/haze-soft-02.webp"
                    alt=""
                    draggable="false"
                    decoding="async"
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
                            decoding="async"
                        />
                    );
                })}
            </div>

            <div className="island-layer">
                <img
                    ref={islandRef}
                    className="island"
                    src="/assets/islands/island-small-01.webp"
                    alt=""
                    draggable="false"
                    decoding="async"
                />
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
                            decoding="async"
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
                    decoding="async"
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
                            decoding="async"
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