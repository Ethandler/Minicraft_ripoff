// ----- 🌍 Initialization -----
const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// ----- 🧍 Player Setup -----
const player = new THREE.Object3D();
player.position.set(0, 5, 0);
scene.add(player);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 1.6, 0);
player.add(camera);

// ----- 💡 Lighting -----
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// ----- ✅ Debug: Basic Ground Test -----
const groundGeometry = new THREE.BoxGeometry(50, 1, 50);
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.position.y = -0.5;
scene.add(ground);

// ----- 🕹️ Joystick Controls -----
let movement = { angle: 0, speed: 0 };
let lookSensitivity = 0.015;

try {
    const joystick = nipplejs.create({
        zone: document.getElementById('joystick-container'),
        mode: 'static',
        position: { left: '75px', bottom: '75px' },
        color: 'blue'
    });
    console.log('Joystick initialized successfully:', joystick);

    joystick.on('move', (evt, data) => {
        movement.angle = data.angle.radian;
        movement.speed = data.distance / 50;
        console.log('Joystick moved:', movement);
    });

    joystick.on('end', () => {
        movement.speed = 0;
        console.log('Joystick released');
    });
} catch (error) {
    console.error('Joystick Initialization Error:', error);
}

// ----- 🚶‍♂️ Simple Player Movement -----
let velocity = new THREE.Vector3();
const acceleration = 0.05;
const friction = 0.88;
const maxSpeed = 0.15;
const gravity = -0.01;
let velocityY = 0;
let isOnGround = false;

// ----- 🎯 Animation Loop -----
function animate() {
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

        const moveX = Math.cos(movement.angle) * movement.speed;
        const moveZ = Math.sin(movement.angle) * movement.speed;

        velocity.x += moveX * acceleration;
        velocity.z += moveZ * acceleration;

        velocity.clampLength(0, maxSpeed);
    } else {
        velocity.multiplyScalar(friction);
    }

    player.position.add(velocity);

    renderer.render(scene, camera);
}
animate();

// ----- 📱 Responsive Design -----
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});