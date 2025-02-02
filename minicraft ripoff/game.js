// ----- 🌍 Initialization -----
const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue

// ----- 🧍 Player Setup -----
const player = new THREE.Object3D();
player.position.set(0, 5, 0);
scene.add(player);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 1.6, 0);
player.add(camera);

// ----- 💡 Lighting -----
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); 
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// ----- 🌱 Ground Generation -----
const terrainSize = 50;
const groundGeometry = new THREE.BoxGeometry(1, 1, 1);
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });

for (let x = -terrainSize / 2; x <= terrainSize / 2; x++) {
    for (let z = -terrainSize / 2; z <= terrainSize / 2; z++) {
        const cube = new THREE.Mesh(groundGeometry, groundMaterial);
        cube.position.set(x, 0, z);
        scene.add(cube);
    }
}

// ----- 🕹️ Joystick Controls -----
let movement = { angle: 0, speed: 0 };
let lookSensitivity = 0.015; // Default sensitivity

const joystick = nipplejs.create({
    zone: document.getElementById('joystick-container'),
    mode: 'static',
    position: { left: '75px', bottom: '75px' },
    color: 'blue'
});

joystick.on('move', (evt, data) => {
    movement.angle = data.angle.radian;
    movement.speed = data.distance / 50;
});

joystick.on('end', () => {
    movement.speed = 0;
});

// ----- 🎥 Camera Controls -----
let isSwiping = false;
let lastTouch = { x: 0, y: 0 };
let rotation = { yaw: 0, pitch: 0 };

const touchZone = document.getElementById('touch-zone');

touchZone.addEventListener('touchstart', (e) => {
    isSwiping = true;
    lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isTouching = true; 
    heldTime = 0; 
});

touchZone.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;

    const deltaX = e.touches[0].clientX - lastTouch.x;
    const deltaY = e.touches[0].clientY - lastTouch.y;

    rotation.yaw -= deltaX * lookSensitivity;
    rotation.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotation.pitch - deltaY * lookSensitivity));

    player.rotation.y = rotation.yaw;
    camera.rotation.x = rotation.pitch;

    lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
});

touchZone.addEventListener('touchend', (e) => {
    if (heldTime < 300) {
        placeBlock(e.changedTouches[0].clientX, e.changedTouches[0].clientY); 
    }
    isSwiping = false;
    isTouching = false;
});

// ----- 🚶‍♂️ Movement & Physics -----
let velocity = new THREE.Vector3();
const acceleration = 0.05;
const friction = 0.88;
const maxSpeed = 0.15;
const gravity = -0.01;
let velocityY = 0;
let isOnGround = false;

// ----- 🗿 Raycasting for Block Interaction -----
const raycaster = new THREE.Raycaster();
let heldTime = 0;
let isTouching = false;

// Place a Block
function placeBlock(x, y) {
    const mouse = new THREE.Vector2(
        (x / window.innerWidth) * 2 - 1,
        -(y / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const hit = intersects[0];
        const normal = hit.face.normal;
        const position = hit.point.clone().add(normal).floor().addScalar(0.5);

        const block = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        block.position.copy(position);
        scene.add(block);
    }
}

// Delete a Block
function deleteBlock() {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const hit = intersects[0];
        if (hit.object !== player) {
            scene.remove(hit.object);
        }
    }
}

// ----- 🎯 Main Animation Loop -----
let lastFrameTime = performance.now();

function animate() {
    const currentTime = performance.now();
    const delta = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    requestAnimationFrame(animate);

    if (!isOnGround) {
        velocityY += gravity;
        player.position.y += velocityY;
    }

    if (player.position.y <= 1) {
        player.position.y = 1;
        velocityY = 0;
        isOnGround = true;
    } else {
        isOnGround = false;
    }

    if (movement.speed > 0) {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3(-forward.z, 0, forward.x);
        const moveX = Math.cos(movement.angle) * movement.speed;
        const moveY = Math.sin(movement.angle) * movement.speed;

        velocity.addScaledVector(forward, moveY * acceleration);
        velocity.addScaledVector(right, moveX * acceleration);

        velocity.clampLength(0, maxSpeed);
    } else {
        velocity.multiplyScalar(friction);
    }

    player.position.add(velocity);

    if (isTouching) {
        heldTime += delta;
        if (heldTime >= 1000) {
            deleteBlock();
            isTouching = false;
        }
    }

    renderer.render(scene, camera);
}
animate();

// ----- 📱 Responsive Design -----
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ----- ⚙️ In-Game Menu -----
const menu = document.getElementById('menu');
const menuToggle = document.getElementById('menu-toggle');
const sensitivitySlider = document.getElementById('sensitivity-slider');
const sensitivityValue = document.getElementById('sensitivity-value');

menuToggle.addEventListener('click', () => {
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
});

document.getElementById('close-menu').addEventListener('click', () => {
    menu.style.display = 'none';
});

sensitivitySlider.addEventListener('input', (e) => {
    lookSensitivity = parseFloat(e.target.value);
    sensitivityValue.textContent = lookSensitivity.toFixed(3);
});