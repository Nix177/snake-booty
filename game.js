// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);

// Update the audio initialization
let audioContext;
let backgroundMusic;
let musicBuffer;
const musicTracks = [
    "/Snake Chase_ Big Booty Hustle.mp3",
    "/La Serpiente y el Gran Trasero.mp3",
    "/Snake Booty Chase.mp3",
    "/Snake Booty Chase (1).mp3",
    "/Big Booty Snake Chase (8).mp3",
    "/Big Booty Snake Chase.mp3",
    "/Big Booty Snake Chase (3).mp3",
    "/Big Booty Snake Chase (5).mp3",
];
let currentTrackIndex = 0;

let musicVolume = 0.5;
let sfxVolume = 0.5;
let isInvincible = false;
let invincibilityTimer = 0;
const invincibilityDuration = 3000; // 3 seconds

// Add these variables at the top with other audio variables
let musicGainNode;
let currentMusicSource;

function shuffleTracks() {
    for (let i = musicTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [musicTracks[i], musicTracks[j]] = [musicTracks[j], musicTracks[i]];
    }
}

// Call shuffle at startup
shuffleTracks();

async function initializeAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Start with random track
        currentTrackIndex = Math.floor(Math.random() * musicTracks.length);
        
        try {
            const musicResponse = await fetch(musicTracks[currentTrackIndex]);
            const musicArrayBuffer = await musicResponse.arrayBuffer();
            musicBuffer = await audioContext.decodeAudioData(musicArrayBuffer);
            
            // Set up next track handler
            if (currentMusicSource) {
                currentMusicSource.onended = () => {
                    currentTrackIndex = (currentTrackIndex + 1) % musicTracks.length;
                    playBackgroundMusic();
                };
            }
            
            playBackgroundMusic();
        } catch (musicError) {
            console.error('Error loading music:', musicError);
            currentTrackIndex = (currentTrackIndex + 1) % musicTracks.length;
            initializeAudio();
        }
        
        // Load sound effects
        const bonusResponse = await fetch('mixkit-hungry-man-eating-2252.wav');
        const eatResponse = await fetch('mixkit-winning-a-coin-video-game-2069.wav');
        const loseResponse = await fetch('mixkit-player-losing-or-failing-2042.wav');
        
        bonusBuffer = await audioContext.decodeAudioData(await bonusResponse.arrayBuffer());
        eatBuffer = await audioContext.decodeAudioData(await eatResponse.arrayBuffer());
        loseBuffer = await audioContext.decodeAudioData(await loseResponse.arrayBuffer());
        
        startAudioButton.style.display = 'none';
        startScreen.style.pointerEvents = 'auto';
        startScreen.style.display = 'flex';
    } catch (error) {
        console.error('Error initializing audio:', error);
    }
}

// Function to play background music
function playBackgroundMusic() {
    if (audioContext && musicBuffer) {
        if (currentMusicSource) {
            currentMusicSource.stop();
            currentMusicSource.disconnect();
        }
        if (musicGainNode) {
            musicGainNode.disconnect();
        }
        
        currentMusicSource = audioContext.createBufferSource();
        musicGainNode = audioContext.createGain();
        
        musicGainNode.gain.value = musicVolume;
        
        currentMusicSource.buffer = musicBuffer;
        currentMusicSource.connect(musicGainNode);
        musicGainNode.connect(audioContext.destination);
        
        // Add onended handler to play next track
        currentMusicSource.onended = async () => {
            currentTrackIndex = (currentTrackIndex + 1) % musicTracks.length;
            try {
                const musicResponse = await fetch(musicTracks[currentTrackIndex]);
                const musicArrayBuffer = await musicResponse.arrayBuffer();
                musicBuffer = await audioContext.decodeAudioData(musicArrayBuffer);
                playBackgroundMusic();
            } catch (error) {
                console.error('Error loading next track:', error);
                currentTrackIndex = (currentTrackIndex + 1) % musicTracks.length;
                playBackgroundMusic();
            }
        };
        
        currentMusicSource.start(0);
        backgroundMusic = currentMusicSource;
    }
}

// Initialize audio context and sounds
let bonusBuffer;
let eatBuffer;
let loseBuffer;

// Modify the audio start button styling
const startAudioButton = document.getElementById('start-audio');
startAudioButton.style.position = 'absolute';
startAudioButton.style.top = '50%';
startAudioButton.style.left = '50%';
startAudioButton.style.transform = 'translate(-50%, -50%)';
startAudioButton.style.padding = '20px';
startAudioButton.style.fontSize = '24px';
startAudioButton.style.display = 'none';
startAudioButton.style.zIndex = '1000'; // Higher z-index to be on top
startAudioButton.style.cursor = 'pointer';
startAudioButton.style.backgroundColor = '#4CAF50';
startAudioButton.style.color = 'white';
startAudioButton.style.border = 'none';
startAudioButton.style.borderRadius = '5px';

// Show audio start button and initialize audio
startAudioButton.style.display = 'block';
startAudioButton.addEventListener('click', initializeAudio);

// Sound playing functions
function playSound(buffer) {
    if (audioContext && buffer) {
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        gainNode.gain.value = sfxVolume;
        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        source.start(0);
    }
}

function playBonusSound() {
    playSound(bonusBuffer);
}

function playEatSound() {
    playSound(eatBuffer);
}

function playLoseSound() {
    playSound(loseBuffer);
}

// Modify the startGame function
function startGame() {
    const nickname = nicknameInput.value.trim() || 'Player';
    if (nickname) {
        if (!audioContext) {
            startAudioButton.style.display = 'block';
            return;
        }
        gameStarted = true;
        startScreen.style.display = 'none';
        scoreDiv.style.display = 'block';
        resetGame();
    }
}

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 10, 0);
scene.add(directionalLight);

// Create ground plane with texture
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(2, 2); // Reduced from 4,4 to 2,2 to prevent overflow
const groundMaterial = new THREE.MeshStandardMaterial({ 
    map: groundTexture,
    side: THREE.DoubleSide
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Replace the player creation code with this new muscular man model
const playerGroup = new THREE.Group();

// Skin tone material
const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xD2B48C,  // Tan skin tone
    roughness: 0.7,
    metalness: 0.1
});

// Clothing material
const clothingMaterial = new THREE.MeshStandardMaterial({
    color: 0x2C3E50,  // Dark blue-gray
    roughness: 0.6,
    metalness: 0.2
});

// Head
const headGeometry = new THREE.SphereGeometry(0.5, 32, 32);
headGeometry.scale(1, 1.2, 1);  // Slightly elongated
const head = new THREE.Mesh(headGeometry, skinMaterial);
head.position.y = 3.5;

// Add hair to the head
const hairGroup = new THREE.Group();

// Create main hair volume
const hairMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,  // Dark black hair
    roughness: 0.8,
    metalness: 0.2
});

// Main hair volume on top
const topHairGeometry = new THREE.SphereGeometry(0.55, 32, 32);
topHairGeometry.scale(1, 0.7, 1);
const topHair = new THREE.Mesh(topHairGeometry, hairMaterial);
topHair.position.y = 0.2;
hairGroup.add(topHair);

// Side hair strands
const sideHairGeometry = new THREE.CylinderGeometry(0.2, 0.15, 0.6, 32);
const leftHair = new THREE.Mesh(sideHairGeometry, hairMaterial);
const rightHair = new THREE.Mesh(sideHairGeometry, hairMaterial);

leftHair.position.set(-0.4, -0.1, 0);
rightHair.position.set(0.4, -0.1, 0);
leftHair.rotation.z = 0.2;
rightHair.rotation.z = -0.2;

hairGroup.add(leftHair);
hairGroup.add(rightHair);

// Back hair
const backHairGeometry = new THREE.SphereGeometry(0.4, 32, 32);
backHairGeometry.scale(1, 1.2, 0.5);
const backHair = new THREE.Mesh(backHairGeometry, hairMaterial);
backHair.position.set(0, -0.2, -0.3);
hairGroup.add(backHair);

// Add some hair spikes for style
for (let i = 0; i < 8; i++) {
    const spikeGeometry = new THREE.ConeGeometry(0.1, 0.3, 32);
    const spike = new THREE.Mesh(spikeGeometry, hairMaterial);
    const angle = (i / 8) * Math.PI * 2;
    spike.position.set(
        Math.cos(angle) * 0.3,
        0.3,
        Math.sin(angle) * 0.3
    );
    spike.rotation.x = Math.random() * 0.5 - 0.25;
    spike.rotation.z = Math.random() * 0.5 - 0.25;
    hairGroup.add(spike);
}

head.add(hairGroup);
playerGroup.add(head);

// Add face to the head
const faceGroup = new THREE.Group();

// Eyes
const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.1,
    metalness: 0.8
});
const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
leftEye.position.set(-0.2, 0, 0.4);
rightEye.position.set(0.2, 0, 0.4);
faceGroup.add(leftEye);
faceGroup.add(rightEye);

// Nose
const noseGeometry = new THREE.SphereGeometry(0.08, 16, 16);
const noseMaterial = new THREE.MeshStandardMaterial({
    color: 0xD2B48C,
    roughness: 0.7,
    metalness: 0.1
});
const nose = new THREE.Mesh(noseGeometry, noseMaterial);
nose.position.set(0, -0.1, 0.45);
faceGroup.add(nose);

// Add face group to head
head.add(faceGroup);

// Neck
const neckGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.3, 32);
const neck = new THREE.Mesh(neckGeometry, skinMaterial);
neck.position.y = 3.2;
playerGroup.add(neck);

// Torso (very muscular)
const torsoGeometry = new THREE.CylinderGeometry(0.8, 1, 1.5, 32);
const torso = new THREE.Mesh(torsoGeometry, clothingMaterial);
torso.position.y = 2.2;
torso.scale.x = 1.5;  // Wide chest
playerGroup.add(torso);

// Shoulders and upper body
const shoulderGeometry = new THREE.SphereGeometry(0.5, 32, 32);

// Left shoulder
const leftShoulder = new THREE.Mesh(shoulderGeometry, skinMaterial);
leftShoulder.position.set(-1, 2.5, 0);
playerGroup.add(leftShoulder);

// Right shoulder
const rightShoulder = new THREE.Mesh(shoulderGeometry, skinMaterial);
rightShoulder.position.set(1, 2.5, 0);
playerGroup.add(rightShoulder);

// Arms (very muscular)
function createArm(side) {
    const armGroup = new THREE.Group();
    
    const upperArmGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1, 32);
    const lowerArmGeometry = new THREE.CylinderGeometry(0.25, 0.3, 1, 32);
    
    const upperArm = new THREE.Mesh(upperArmGeometry, skinMaterial);
    const lowerArm = new THREE.Mesh(lowerArmGeometry, skinMaterial);
    
    upperArm.position.y = -0.5;
    lowerArm.position.y = -1;
    
    armGroup.add(upperArm);
    armGroup.add(lowerArm);
    
    armGroup.position.set(side * 1, 2.2, 0);
    armGroup.rotation.z = side * 0.2;  // Slight angle
    
    return armGroup;
}

const leftArm = createArm(1);
const rightArm = createArm(-1);
playerGroup.add(leftArm);
playerGroup.add(rightArm);

// Legs
function createLeg(side) {
    const legGroup = new THREE.Group();
    
    const upperLegGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.2, 32);
    const lowerLegGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 32);
    
    const upperLeg = new THREE.Mesh(upperLegGeometry, clothingMaterial);
    const lowerLeg = new THREE.Mesh(lowerLegGeometry, skinMaterial);
    
    upperLeg.position.y = -0.6;
    lowerLeg.position.y = -1.2;
    
    legGroup.add(upperLeg);
    legGroup.add(lowerLeg);
    
    legGroup.position.set(side * 0.5, 0.6, 0);
    
    return legGroup;
}

const leftLeg = createLeg(1);
const rightLeg = createLeg(-1);
playerGroup.add(leftLeg);
playerGroup.add(rightLeg);

// Add muscular butt to player (modified size)
const buttGroup = new THREE.Group();
const cheekGeometry = new THREE.SphereGeometry(1, 16, 16); // Increased size
const cheekMaterial = clothingMaterial;
const leftCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
const rightCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
leftCheek.position.set(-0.4, 1.2, -0.3);
rightCheek.position.set(0.4, 1.2, -0.3);
// Store original Y positions for animation
leftCheek.userData.baseY = leftCheek.position.y;
rightCheek.userData.baseY = rightCheek.position.y;
buttGroup.add(leftCheek);
buttGroup.add(rightCheek);
playerGroup.add(buttGroup);

// Scale the entire player model up
playerGroup.scale.set(0.242, 0.242, 0.242); // Increased by 10% from 0.22
playerGroup.position.y = 0.1;  // Adjust height to ground level

scene.add(playerGroup);

// Create snake head (now a ball)
const snakeHeadGeometry = new THREE.SphereGeometry(0.5, 8, 8);
const snakeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2ecc71,
    roughness: 0.3,
    metalness: 0.1
});
const snake = new THREE.Mesh(snakeHeadGeometry, snakeMaterial);
snake.position.set(5, 0.5, 5);

// Add snake eyes
const snakeEyeGeometry = new THREE.CircleGeometry(0.05, 8);
const snakeEyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
const snakeLeftEye = new THREE.Mesh(snakeEyeGeometry, snakeEyeMaterial);
const snakeRightEye = new THREE.Mesh(snakeEyeGeometry, snakeEyeMaterial);
snakeLeftEye.position.set(-0.15, 0.1, 0.4);
snakeRightEye.position.set(0.15, 0.1, 0.4);
snake.add(snakeLeftEye);
snake.add(snakeRightEye);

// Add snake tongue
const snakeTongueGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.05);
const snakeTongueMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const snakeTongue = new THREE.Mesh(snakeTongueGeometry, snakeTongueMaterial);
snakeTongue.position.set(0, 0, 0.5);
snake.add(snakeTongue);

// Add forked tongue
const snakeForkGeometry = new THREE.BoxGeometry(0.05, 0.1, 0.05);
const snakeForkMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const snakeLeftFork = new THREE.Mesh(snakeForkGeometry, snakeForkMaterial);
const snakeRightFork = new THREE.Mesh(snakeForkGeometry, snakeForkMaterial);
snakeLeftFork.position.set(-0.1, 0, 0.6);
snakeRightFork.position.set(0.1, 0, 0.6);
snake.add(snakeLeftFork);
snake.add(snakeRightFork);

scene.add(snake);

// Animation variables
let walkCycle = 0;
const walkSpeed = 0.1;
const walkAmplitude = 0.3;

// Snake movement variables
let snakeSpeed = 0.05; // Reset back to original slower speed
const snakeGrowthRate = 24; // Doubled from 12 to 24 segments per food eaten
const snakeSegments = [];
let snakeDirection = 'right'; // Initialize with a default direction
let lastBehaviorChange = 0;
const behaviorInterval = 10000; // 10 seconds
let isChasingFood = true; // Start by chasing food

// Food system variables
let foods = []; // Array to store multiple food items
const maxFoods = 2; // Maximum number of food items on the map

// Create invisible walls with texture
const wallGeometry = new THREE.BoxGeometry(20, 2, 1); // Increased height from 0.1 to 2
const wallTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
wallTexture.wrapS = THREE.RepeatWrapping;
wallTexture.wrapT = THREE.RepeatWrapping;
wallTexture.repeat.set(4, 1);
const wallMaterial = new THREE.MeshBasicMaterial({ 
    map: wallTexture,
    transparent: true,
    opacity: 0.3
});
const wallMaterial2 = new THREE.MeshBasicMaterial({ 
    map: wallTexture,
    transparent: true,
    opacity: 0.3
});

// Create walls
const wallNorth = new THREE.Mesh(wallGeometry, wallMaterial);
const wallSouth = new THREE.Mesh(wallGeometry, wallMaterial);
const wallEast = new THREE.Mesh(wallGeometry, wallMaterial2);
const wallWest = new THREE.Mesh(wallGeometry, wallMaterial2);

// Position walls
wallNorth.position.set(0, 1, -10); // Adjusted Y position to center the taller walls
wallSouth.position.set(0, 1, 10);
wallEast.position.set(10, 1, 0);
wallWest.position.set(-10, 1, 0);

// Rotate walls
wallEast.rotation.y = Math.PI / 2;
wallWest.rotation.y = Math.PI / 2;

// Add walls to scene
scene.add(wallNorth);
scene.add(wallSouth);
scene.add(wallEast);
scene.add(wallWest);

// Create obstacles
const obstacles = [];
const obstacleTypes = [
    { color: 0xFF69B4, shape: 'heart' },    // Pink heart
    { color: 0x00FFFF, shape: 'star' },     // Cyan star
    { color: 0xFFD700, shape: 'diamond' },  // Gold diamond
    { color: 0xFF1493, shape: 'spiral' },   // Deep pink spiral
    { color: 0x00FF00, shape: 'clover' }    // Green clover
];

// Create 5 random obstacles
for (let i = 0; i < 5; i++) {
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    let obstacle;
    
    switch(type.shape) {
        case 'heart':
            // Create heart shape using spheres and cylinders
            const heartGroup = new THREE.Group();
            
            // Main body (two spheres)
            const sphereGeometry = new THREE.SphereGeometry(0.4, 16, 16);
            const sphereMaterial = new THREE.MeshStandardMaterial({ 
                color: type.color,
                roughness: 0.3,
                metalness: 0.2
            });
            
            const leftSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            const rightSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            leftSphere.position.set(-0.2, 0, 0);
            rightSphere.position.set(0.2, 0, 0);
            
            // Bottom point (cone)
            const coneGeometry = new THREE.ConeGeometry(0.4, 0.8, 16);
            const coneMaterial = new THREE.MeshStandardMaterial({ 
                color: type.color,
                roughness: 0.3,
                metalness: 0.2
            });
            const cone = new THREE.Mesh(coneGeometry, coneMaterial);
            cone.position.set(0, -0.4, 0);
            cone.rotation.x = Math.PI;
            
            heartGroup.add(leftSphere);
            heartGroup.add(rightSphere);
            heartGroup.add(cone);
            obstacle = heartGroup;
            break;
            
        case 'star':
            // Create star shape using multiple cones
            const starGroup = new THREE.Group();
            const starGeometry = new THREE.ConeGeometry(0.3, 0.6, 5);
            const starMaterial = new THREE.MeshStandardMaterial({ 
                color: type.color,
                roughness: 0.3,
                metalness: 0.2
            });
            
            for (let i = 0; i < 5; i++) {
                const starPoint = new THREE.Mesh(starGeometry, starMaterial);
                starPoint.rotation.x = -Math.PI / 2;
                starPoint.rotation.z = (i * 2 * Math.PI) / 5;
                starGroup.add(starPoint);
            }
            obstacle = starGroup;
            break;
            
        case 'diamond':
            // Create diamond shape using octahedron
            const diamondGeometry = new THREE.OctahedronGeometry(0.5);
            const diamondMaterial = new THREE.MeshStandardMaterial({ 
                color: type.color,
                roughness: 0.3,
                metalness: 0.2
            });
            obstacle = new THREE.Mesh(diamondGeometry, diamondMaterial);
            break;
            
        case 'spiral':
            // Create spiral shape using torus
            const spiralGeometry = new THREE.TorusGeometry(0.4, 0.1, 16, 100);
            const spiralMaterial = new THREE.MeshStandardMaterial({ 
                color: type.color,
                roughness: 0.3,
                metalness: 0.2
            });
            obstacle = new THREE.Mesh(spiralGeometry, spiralMaterial);
            obstacle.rotation.x = Math.PI / 2;
            break;
            
        case 'clover':
            // Create clover shape using spheres
            const cloverGroup = new THREE.Group();
            const cloverGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const cloverMaterial = new THREE.MeshStandardMaterial({ 
                color: type.color,
                roughness: 0.3,
                metalness: 0.2
            });
            
            // Center sphere
            const centerSphere = new THREE.Mesh(cloverGeometry, cloverMaterial);
            
            // Three outer spheres
            for (let i = 0; i < 3; i++) {
                const outerSphere = new THREE.Mesh(cloverGeometry, cloverMaterial);
                outerSphere.position.set(
                    Math.cos(i * 2 * Math.PI / 3) * 0.4,
                    0,
                    Math.sin(i * 2 * Math.PI / 3) * 0.4
                );
                cloverGroup.add(outerSphere);
            }
            
            cloverGroup.add(centerSphere);
            obstacle = cloverGroup;
            break;
    }
    
    let x, z;
    let validPosition = false;
    
    // Keep trying until we find a valid position
    while (!validPosition) {
        x = Math.floor(Math.random() * 18) - 9;
        z = Math.floor(Math.random() * 18) - 9;
        
        // Check if position is too close to player start or snake start
        const distanceToPlayer = Math.sqrt(x * x + z * z);
        const distanceToSnake = Math.sqrt((x - 5) * (x - 5) + (z - 5) * (z - 5));
        
        if (distanceToPlayer > 3 && distanceToSnake > 3) {
            validPosition = true;
        }
    }
    
    obstacle.position.set(x, 0.5, z);
    scene.add(obstacle);
    obstacles.push(obstacle);
}

// Game state
let gameOver = false;
let gameStarted = false;
let gamePaused = false;
let score = {
    timePoints: 0,
    foodPoints: 0,
    totalScore: 0,
    gameStartTime: Date.now(),
    lastScoreUpdateTime: Date.now()
};
let highScores = JSON.parse(localStorage.getItem('snakeHighScores')) || [];

// Create pause menu
const pauseMenu = document.createElement('div');
pauseMenu.style.position = 'absolute';
pauseMenu.style.top = '0';
pauseMenu.style.left = '0';
pauseMenu.style.width = '100%';
pauseMenu.style.height = '100%';
pauseMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
pauseMenu.style.display = 'none';
pauseMenu.style.flexDirection = 'column';
pauseMenu.style.alignItems = 'center';
pauseMenu.style.justifyContent = 'center';
pauseMenu.style.color = 'white';
pauseMenu.style.fontFamily = 'Arial';
document.body.appendChild(pauseMenu);

// Create pause title
const pauseTitle = document.createElement('h1');
pauseTitle.textContent = 'PAUSED';
pauseTitle.style.fontSize = '48px';
pauseTitle.style.marginBottom = '20px';
pauseMenu.appendChild(pauseTitle);

// Create resume button
const resumeButton = document.createElement('button');
resumeButton.textContent = 'Resume Game';
resumeButton.style.padding = '15px 30px';
resumeButton.style.fontSize = '24px';
resumeButton.style.cursor = 'pointer';
resumeButton.style.backgroundColor = '#4CAF50';
resumeButton.style.color = 'white';
resumeButton.style.border = 'none';
resumeButton.style.borderRadius = '5px';
resumeButton.style.marginBottom = '20px';
resumeButton.onclick = togglePause;
pauseMenu.appendChild(resumeButton);

// Create restart button
const restartButton = document.createElement('button');
restartButton.textContent = 'Restart Game';
restartButton.style.padding = '15px 30px';
restartButton.style.fontSize = '24px';
restartButton.style.cursor = 'pointer';
restartButton.style.backgroundColor = '#f44336';
restartButton.style.color = 'white';
restartButton.style.border = 'none';
restartButton.style.borderRadius = '5px';
restartButton.style.marginBottom = '20px';
restartButton.onclick = () => {
    togglePause();
    resetGame();
};
pauseMenu.appendChild(restartButton);

// Create quit button
const quitButton = document.createElement('button');
quitButton.textContent = 'Quit to Menu';
quitButton.style.padding = '15px 30px';
quitButton.style.fontSize = '24px';
quitButton.style.cursor = 'pointer';
quitButton.style.backgroundColor = '#2196F3';
quitButton.style.color = 'white';
quitButton.style.border = 'none';
quitButton.style.borderRadius = '5px';
quitButton.onclick = () => {
    togglePause();
    gameStarted = false;
    startScreen.style.display = 'flex';
    scoreDiv.style.display = 'none';
};
pauseMenu.appendChild(quitButton);

// Add next music button
const nextMusicButton = document.createElement('button');
nextMusicButton.textContent = 'Next Track';
nextMusicButton.style.padding = '15px 30px';
nextMusicButton.style.fontSize = '24px';
nextMusicButton.style.cursor = 'pointer';
nextMusicButton.style.backgroundColor = '#9C27B0';
nextMusicButton.style.color = 'white';
nextMusicButton.style.border = 'none';
nextMusicButton.style.borderRadius = '5px';
nextMusicButton.style.marginBottom = '20px';
nextMusicButton.onclick = async () => {
    if (currentMusicSource) {
        // Remove the automatic next track handler
        currentMusicSource.onended = null;
        // Stop and clean up current track
        currentMusicSource.stop();
        currentMusicSource.disconnect();
        if (musicGainNode) {
            musicGainNode.disconnect();
        }
    }
    
    currentTrackIndex = (currentTrackIndex + 1) % musicTracks.length;
    try {
        const musicResponse = await fetch(musicTracks[currentTrackIndex]);
        const musicArrayBuffer = await musicResponse.arrayBuffer();
        musicBuffer = await audioContext.decodeAudioData(musicArrayBuffer);
        playBackgroundMusic();
    } catch (error) {
        console.error('Error loading next track:', error);
    }
};
pauseMenu.appendChild(nextMusicButton);

// Fix the volume controls (they were using undefined sliders)
const volumeControls = document.createElement('div');
volumeControls.style.width = '80%';

const musicLabel = document.createElement('div');
musicLabel.textContent = 'Music Volume';
musicLabel.style.color = 'white';
musicLabel.style.marginBottom = '5px';

const musicSlider = document.createElement('input');
musicSlider.type = 'range';
musicSlider.min = '0';
musicSlider.max = '100';
musicSlider.value = musicVolume * 100;
musicSlider.style.width = '100%';

musicSlider.addEventListener('input', (e) => {
    musicVolume = e.target.value / 100;
    if (musicGainNode) {
        musicGainNode.gain.value = musicVolume;
    }
});

const sfxLabel = document.createElement('div');
sfxLabel.textContent = 'Sound Effects Volume';
sfxLabel.style.color = 'white';
sfxLabel.style.marginBottom = '5px';

const sfxSlider = document.createElement('input');
sfxSlider.type = 'range';
sfxSlider.min = '0';
sfxSlider.max = '100';
sfxSlider.value = sfxVolume * 100;
sfxSlider.style.width = '100%';

sfxSlider.addEventListener('input', (e) => {
    sfxVolume = e.target.value / 100;
});

// Style the sliders
const sliderStyle = `
    width: 100%;
    height: 8px;
    background: #555;
    outline: none;
    border-radius: 4px;
    -webkit-appearance: none;
    margin: 10px 0;
`;

[musicSlider, sfxSlider].forEach(slider => {
    slider.style.cssText = sliderStyle;
    slider.style.accentColor = '#4CAF50';
});

volumeControls.appendChild(musicLabel);
volumeControls.appendChild(musicSlider);
volumeControls.appendChild(sfxLabel);
volumeControls.appendChild(sfxSlider);

// Add volume controls to pause menu
pauseMenu.appendChild(volumeControls);

// Add pause menu toggle function
function togglePause() {
    gamePaused = !gamePaused;
    pauseMenu.style.display = gamePaused ? 'flex' : 'none';
}

// Create start screen
const startScreen = document.createElement('div');
startScreen.style.position = 'absolute';
startScreen.style.top = '0';
startScreen.style.left = '0';
startScreen.style.width = '100%';
startScreen.style.height = '100%';
startScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
startScreen.style.display = 'flex';
startScreen.style.flexDirection = 'column';
startScreen.style.alignItems = 'center';
startScreen.style.justifyContent = 'center';
startScreen.style.color = 'white';
startScreen.style.fontFamily = 'Arial';
startScreen.style.zIndex = '999'; // Modify start screen z-index to be behind the audio button
document.body.appendChild(startScreen);

// Create title
const title = document.createElement('h1');
title.textContent = '3D Snake Chase';
title.style.fontSize = '48px';
title.style.marginBottom = '20px';
startScreen.appendChild(title);

// Create high scores
const highScoresDiv = document.createElement('div');
highScoresDiv.style.marginBottom = '30px';
highScoresDiv.style.textAlign = 'center';
const highScoresTitle = document.createElement('h2');
highScoresTitle.textContent = 'High Scores';
highScoresTitle.style.marginBottom = '10px';
highScoresDiv.appendChild(highScoresTitle);

const highScoresList = document.createElement('div');
highScoresList.style.fontSize = '24px';
updateHighScoresList();
highScoresDiv.appendChild(highScoresList);
startScreen.appendChild(highScoresDiv);

// Create nickname input
const nicknameInput = document.createElement('input');
nicknameInput.type = 'text';
nicknameInput.placeholder = 'Enter your nickname';
nicknameInput.style.padding = '10px';
nicknameInput.style.fontSize = '18px';
nicknameInput.style.marginBottom = '20px';
nicknameInput.style.width = '200px';
nicknameInput.style.textAlign = 'center';
startScreen.appendChild(nicknameInput);

// Create start button
const startButton = document.createElement('button');
startButton.textContent = 'Start Game';
startButton.style.padding = '15px 30px';
startButton.style.fontSize = '24px';
startButton.style.cursor = 'pointer';
startButton.style.backgroundColor = '#4CAF50';
startButton.style.color = 'white';
startButton.style.border = 'none';
startButton.style.borderRadius = '5px';
startButton.onclick = startGame;
startScreen.appendChild(startButton);

// Create score display
const scoreDiv = document.createElement('div');
scoreDiv.style.position = 'absolute';
scoreDiv.style.top = '20px';
scoreDiv.style.left = '20px';
scoreDiv.style.color = 'white';
scoreDiv.style.fontSize = '24px';
scoreDiv.style.fontFamily = 'Arial';
scoreDiv.style.display = 'none';
document.body.appendChild(scoreDiv);

// Create game over display
const gameOverDiv = document.createElement('div');
gameOverDiv.style.position = 'absolute';
gameOverDiv.style.top = '0';
gameOverDiv.style.left = '0';
gameOverDiv.style.width = '100%';
gameOverDiv.style.height = '100%';
gameOverDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
gameOverDiv.style.display = 'none';
gameOverDiv.style.flexDirection = 'column';
gameOverDiv.style.alignItems = 'center';
gameOverDiv.style.justifyContent = 'center';
gameOverDiv.style.color = 'white';
gameOverDiv.style.fontFamily = 'Arial';
document.body.appendChild(gameOverDiv);

// Movement variables
let moveSpeed = 0.1;
const baseMoveSpeed = 0.1; // Store the base movement speed
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Dash mechanic variables
const dashDistance = 5; // Distance to dash in pixels
const dashDuration = 400; // Duration of dash animation in ms
const dashCooldown = 2000; // 2 second cooldown
let isDashing = false;
let lastDashTime = 0;
let dashStartPosition = null;
let dashEndPosition = null;
let dashProgress = 0;

// Power-up visual effect variables
const glowColors = {
    shield: 0x4169E1,  // Blue
    speed: 0xFFD700,   // Gold
    freeze: 0x00FFFF   // Cyan
};
const blinkStartTime = 1000; // Start blinking 1 second before power-up ends
const blinkRate = 200; // Blink every 200ms

// Key event listeners
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameStarted && !gameOver) {
        togglePause();
    }
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
    if (gameOver && e.key === 'r') {
        resetGame();
    }

    // Add ShiftLeft dash code
    if (e.code === 'ShiftLeft' && !isDashing && Date.now() - lastDashTime > dashCooldown) {
        isDashing = true;
        lastDashTime = Date.now();
        dashProgress = 0;

        // Store start position
        dashStartPosition = playerGroup.position.clone();

        // Calculate end position based on player's rotation
        const angle = playerGroup.rotation.y;
        dashEndPosition = dashStartPosition.clone();
        dashEndPosition.x += Math.sin(angle) * dashDistance;
        dashEndPosition.z += Math.cos(angle) * dashDistance;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

// Set camera position
camera.position.set(0, 5, 10);
camera.lookAt(playerGroup.position);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Collision detection
function checkCollision(obj1, obj2) {
    // If obj2 is a wall, use existing wall collision logic
    if (obj2 === wallNorth || obj2 === wallSouth || obj2 === wallEast || obj2 === wallWest) {
        const distance = obj1.position.distanceTo(obj2.position);
        // For walls, use a larger collision distance and check if we're actually hitting the wall
        const wallBounds = {
            north: { min: -10, max: 10, z: -10 },
            south: { min: -10, max: 10, z: 10 },
            east: { min: -10, max: 10, x: 10 },
            west: { min: -10, max: 10, x: -10 }
        };

        // Check if we're within the wall's bounds with reduced collision distance
        if (obj2 === wallNorth && Math.abs(obj1.position.z - wallBounds.north.z) < 0.8) {
            return obj1.position.x >= wallBounds.north.min && obj1.position.x <= wallBounds.north.max;
        }
        if (obj2 === wallSouth && Math.abs(obj1.position.z - wallBounds.south.z) < 0.8) {
            return obj1.position.x >= wallBounds.south.min && obj1.position.x <= wallBounds.south.max;
        }
        if (obj2 === wallEast && Math.abs(obj1.position.x - wallBounds.east.x) < 0.8) {
            return obj1.position.z >= wallBounds.east.min && obj1.position.z <= wallBounds.east.max;
        }
        if (obj2 === wallWest && Math.abs(obj1.position.x - wallBounds.west.x) < 0.8) {
            return obj1.position.z >= wallBounds.west.min && obj1.position.z <= wallBounds.west.max;
        }
        return false;
    }
    
    // For food (which is a Group) and other objects
    const pos1 = obj1.position;
    const pos2 = obj2.position;
    const distance = Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) +
        Math.pow(pos1.z - pos2.z, 2)
    );
    return distance < 1.0; // Increased collision radius for better detection
}

// Update high scores list
function updateHighScoresList() {
    highScoresList.innerHTML = '';
    highScores.sort((a, b) => b.score - a.score).slice(0, 5).forEach((entry, index) => {
        const scoreElement = document.createElement('div');
        scoreElement.textContent = `${index + 1}. ${entry.nickname}: ${entry.score}`;
        highScoresList.appendChild(scoreElement);
    });
}

// Show game over screen
function showGameOver() {
    gameOverDiv.innerHTML = '';
    
    const gameOverTitle = document.createElement('h1');
    gameOverTitle.textContent = 'GAME OVER!';
    gameOverTitle.style.fontSize = '48px';
    gameOverTitle.style.marginBottom = '20px';
    gameOverDiv.appendChild(gameOverTitle);

    const scoreText = document.createElement('h2');
    scoreText.textContent = `Your Score: ${score.totalScore}`;
    scoreText.style.fontSize = '36px';
    scoreText.style.marginBottom = '30px';
    gameOverDiv.appendChild(scoreText);

    const restartText = document.createElement('div');
    restartText.textContent = 'Press R to restart';
    restartText.style.fontSize = '24px';
    gameOverDiv.appendChild(restartText);

    gameOverDiv.style.display = 'flex';
}

// Reset game
function resetGame() {
    gameOver = false;
    score = {
        timePoints: 0,
        foodPoints: 0,
        totalScore: 0,
        gameStartTime: Date.now(),
        lastScoreUpdateTime: Date.now()
    };
    gameOverDiv.style.display = 'none';
    
    // Reset level
    currentLevel = 1;
    levelTransition = false;
    
    // Reset ground color
    groundMaterial.color.setHex(0x808080);
    
    // Reset obstacle colors
    obstacles.forEach(obstacle => {
        if (obstacle.material) {
            obstacle.material.color.setHex(0xFF69B4);
        } else if (obstacle.children) {
            obstacle.children.forEach(child => {
                if (child.material) {
                    child.material.color.setHex(0xFF69B4);
                }
            });
        }
    });
    
    // Remove all snakes
    snakes.forEach(snake => {
        scene.remove(snake.mesh);
        snake.segments.forEach(segment => scene.remove(segment));
    });
    snakes.length = 0;
    
    // Create initial snake and add it to scene
    const initialSnake = createSnake(0x2ecc71, 5, 5, 0);
    scene.add(initialSnake.mesh);
    snakes.push(initialSnake);
    
    playerGroup.position.set(0, 0.5, 0);
    
    // Remove all food
    foods.forEach(food => scene.remove(food));
    foods = [];
    
    // Create initial food
    createMouse();
    if (currentLevel >= 3) {
        createMouse(); // Create second food for levels 3 and above
    }
    
    // Reset power-up spawn timing
    lastPowerUpSpawn = Date.now();
    
    // Clear power-ups
    powerUps.forEach(powerUp => scene.remove(powerUp));
    powerUps.length = 0;
    
    // Reset shield state
    shieldActive = false;
    shieldTimer = 0;
    
    // Reset speed boost state
    speedBoostActive = false;
    speedBoostTimer = 0;
    moveSpeed = baseMoveSpeed;
    
    // Remove player glow
    playerGroup.children.forEach(child => {
        if (child.material) {
            child.material.emissive.setHex(0x000000);
            child.material.emissiveIntensity = 0;
        }
    });
    
    // Create initial power-up immediately
    createPowerUp();
}

// Snake evolution system
class SnakeEvolutionSystem {
    constructor(snake, gameEnvironment) {
        this.snake = snake;
        this.environment = gameEnvironment;
        this.mutationCooldown = 30; // Seconds between mutations
        this.evolutionFactors = {
            speedModifier: 1,
            lengthMultiplier: 1,
            energyConsumption: 1
        };
        this.lastMutationTime = Date.now();
    }

    // Environmental mutation
    environmentalMutation(zoneType) {
        switch(zoneType) {
            case 'ice':
                this.evolutionFactors.speedModifier = 0.5;
                this.evolutionFactors.lengthMultiplier = 1.5;
                break;
            case 'fire':
                this.evolutionFactors.speedModifier = 2;
                this.evolutionFactors.lengthMultiplier = 0.8;
                break;
            case 'neutral':
            default:
                this.resetEvolutionFactors();
        }
    }

    // Adaptive pathfinding
    adaptivePathfinding(playerPosition) {
        const complexityFactor = snakeSegments.length * 0.1;
        const predictionVector = this.predictPlayerMovement(playerPosition);
        return this.calculateInterceptCourse(predictionVector);
    }

    predictPlayerMovement(playerPosition) {
        // Basic prediction based on current movement
        const prediction = new THREE.Vector3();
        if (keys.w) prediction.z -= 1;
        if (keys.s) prediction.z += 1;
        if (keys.a) prediction.x -= 1;
        if (keys.d) prediction.x += 1;
        return prediction;
    }

    calculateInterceptCourse(predictionVector) {
        const target = isChasingFood && foods.length > 0 ? foods[0].position : playerGroup.position;
        const dx = target.x - snake.position.x;
        const dz = target.z - snake.position.z;
        
        // Calculate intercept point
        const interceptX = target.x + predictionVector.x * 2;
        const interceptZ = target.z + predictionVector.z * 2;
        
        return new THREE.Vector3(interceptX, 0.5, interceptZ);
    }

    resetEvolutionFactors() {
        this.evolutionFactors = {
            speedModifier: 1,
            lengthMultiplier: 1,
            energyConsumption: 1
        };
    }
}

// Create snake evolution system
const snakeEvolution = new SnakeEvolutionSystem(snake, scene);

// Function to create a new snake
function createSnake(color, startX, startZ, behaviorType) {
    const newSnake = new THREE.Mesh(snakeHeadGeometry, new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.3,
        metalness: 0.1
    }));
    newSnake.position.set(startX, 0.5, startZ);
    
    // Add snake's face elements
    const leftEye = new THREE.Mesh(snakeEyeGeometry, snakeEyeMaterial);
    const rightEye = new THREE.Mesh(snakeEyeGeometry, snakeEyeMaterial);
    const tongue = new THREE.Mesh(snakeTongueGeometry, snakeTongueMaterial);
    const leftFork = new THREE.Mesh(snakeForkGeometry, snakeForkMaterial);
    const rightFork = new THREE.Mesh(snakeForkGeometry, snakeForkMaterial);

    leftEye.position.set(-0.15, 0.1, 0.4);
    rightEye.position.set(0.15, 0.1, 0.4);
    tongue.position.set(0, 0, 0.5);
    leftFork.position.set(-0.1, 0, 0.6);
    rightFork.position.set(0.1, 0, 0.6);

    newSnake.add(leftEye);
    newSnake.add(rightEye);
    newSnake.add(tongue);
    newSnake.add(leftFork);
    newSnake.add(rightFork);

    // Add behavior traits for each snake
    const behavior = {
        type: behaviorType, // 0: original alternating, 1: player-only, 2: food-only, 3: random with food intervals
        isChasingFood: behaviorType === 2 || (behaviorType === 0 && Math.random() > 0.5),
        lastBehaviorChange: Date.now(),
        nextFoodChaseTime: behaviorType === 3 ? Date.now() + (Math.random() * 15000 + 5000) : 0, // Random time between 5-20 seconds
        isInRandomMode: behaviorType === 3
    };

    return {
        mesh: newSnake,
        segments: [],
        leftEye,
        rightEye,
        tongue,
        leftFork,
        rightFork,
        direction: 'right',
        behavior
    };
}

// Function to change level
function changeLevel() {
    currentLevel++;
    levelTransition = true;
    transitionStartTime = Date.now();
    isInvincible = true;
    invincibilityTimer = Date.now() + invincibilityDuration;
    
    // Create invincibility effect message
    const invincibilityMessage = document.createElement('div');
    invincibilityMessage.textContent = 'Invincible for 3 seconds!';
    invincibilityMessage.style.position = 'absolute';
    invincibilityMessage.style.top = '50%';
    invincibilityMessage.style.left = '50%';
    invincibilityMessage.style.transform = 'translate(-50%, -50%)';
    invincibilityMessage.style.color = '#FFD700';
    invincibilityMessage.style.fontSize = '36px';
    invincibilityMessage.style.fontWeight = 'bold';
    invincibilityMessage.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    document.body.appendChild(invincibilityMessage);
    
    setTimeout(() => {
        document.body.removeChild(invincibilityMessage);
    }, 2000);
    
    // Remove all snakes
    snakes.forEach(snake => {
        scene.remove(snake.mesh);
        snake.segments.forEach(segment => scene.remove(segment));
    });
    snakes.length = 0;

    // Change ground color based on level
    switch(currentLevel) {
        case 2:
            groundMaterial.color.setHex(0x2c3e50);  // Dark blue-gray
            break;
        case 3:
            groundMaterial.color.setHex(0x8B4513);  // Brown
            break;
        case 4:
            groundMaterial.color.setHex(0x4B0082);  // Purple
            break;
        case 5:
            groundMaterial.color.setHex(0x006400);  // Dark green
            break;
    }
    
    // Change obstacle colors and create new obstacle layout
    obstacles.forEach(obstacle => {
        if (obstacle.material) {
            obstacle.material.color.setHex(0x3498db);  // Blue
        } else if (obstacle.children) {
            obstacle.children.forEach(child => {
                if (child.material) {
                    child.material.color.setHex(0x3498db);
                }
            });
        }
    });
    
    // Create new obstacle layout
    createObstacles();
    
    // Remove all existing food
    foods.forEach(food => scene.remove(food));
    foods = [];
    
    // Create new food items
    createMouse();
    if (currentLevel >= 3) {
        createMouse(); // Create second food for levels 3 and above
    }

    // Create snakes for the level
    const spawnPositions = [
        { x: 5, z: 5 },
        { x: -5, z: -5 },
        { x: 5, z: -5 },
        { x: -5, z: 5 },
        { x: 0, z: 0 }
    ];
    
    // Shuffle spawn positions
    for (let i = spawnPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [spawnPositions[i], spawnPositions[j]] = [spawnPositions[j], spawnPositions[i]];
    }
    
    const numSnakes = Math.min(currentLevel, 5);
    for (let i = 0; i < numSnakes; i++) {
        const snake = createSnake(
            0x2ecc71,
            spawnPositions[i].x,
            spawnPositions[i].z,
            i
        );
        scene.add(snake.mesh);
        snakes.push(snake);
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (gameStarted && !gameOver && !gamePaused) {
        // Handle dash movement
        if (isDashing) {
            dashProgress = Math.min(1, (Date.now() - lastDashTime) / dashDuration);

            // Use smooth easing function for interpolation
            const easeProgress = 1 - Math.pow(1 - dashProgress, 3); // Cubic ease-out

            // Calculate next position
            const nextPosition = new THREE.Vector3();
            nextPosition.lerpVectors(dashStartPosition, dashEndPosition, easeProgress);

            // Check for wall collisions before applying dash movement
            const tempPos = playerGroup.position.clone();
            playerGroup.position.copy(nextPosition);

            let collision = false;
            if (checkCollision(playerGroup, wallNorth) || 
                checkCollision(playerGroup, wallSouth) || 
                checkCollision(playerGroup, wallEast) || 
                checkCollision(playerGroup, wallWest)) {
                collision = true;
            }

            // Check obstacle collisions
            for (const obstacle of obstacles) {
                if (checkCollision(playerGroup, obstacle)) {
                    collision = true;
                    break;
                }
            }

            if (collision) {
                // If there's a collision, stop the dash and revert position
                playerGroup.position.copy(tempPos);
                isDashing = false;
            } else {
                // If no collision, apply the dash movement
                playerGroup.position.copy(nextPosition);

                // End dash when complete
                if (dashProgress === 1) {
                    isDashing = false;
                }
            }
        }

        // Check invincibility timer
        if (isInvincible && Date.now() > invincibilityTimer) {
            isInvincible = false;
        }
        
        // Make player flash when invincible
        if (isInvincible) {
            const flashRate = 200; // Flash every 200ms
            const visible = Math.floor(Date.now() / flashRate) % 2 === 0;
            playerGroup.visible = visible;
        } else {
            playerGroup.visible = true;
        }

        // Handle level transition
        if (levelTransition) {
            const elapsed = Date.now() - transitionStartTime;
            const progress = Math.min(elapsed / transitionDuration, 1);
            
            // Animate player falling
            if (progress < 1) {
                playerGroup.position.y = 0.5 + Math.sin(progress * Math.PI) * 5;
            } else {
                playerGroup.position.y = 0.5;
                levelTransition = false;
                
                // Create snakes after level transition is complete
                const spawnPositions = [
                    { x: 5, z: 5 },
                    { x: -5, z: -5 },
                    { x: 5, z: -5 },
                    { x: -5, z: 5 },
                    { x: 0, z: 0 }
                ];
                
                // Shuffle spawn positions
                for (let i = spawnPositions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [spawnPositions[i], spawnPositions[j]] = [spawnPositions[j], spawnPositions[i]];
                }
                
                switch(currentLevel) {
                    case 2:
                        // Two snakes with different behaviors
                        const snake2a = createSnake(0x2ecc71, spawnPositions[0].x, spawnPositions[0].z, 0);
                        const snake2b = createSnake(0xe74c3c, spawnPositions[1].x, spawnPositions[1].z, 1);
                        scene.add(snake2a.mesh);
                        scene.add(snake2b.mesh);
                        snakes.push(snake2a, snake2b);
                        break;
                    case 3:
                        // Three snakes with different behaviors
                        const snake3a = createSnake(0x2ecc71, spawnPositions[0].x, spawnPositions[0].z, 0);
                        const snake3b = createSnake(0xe74c3c, spawnPositions[1].x, spawnPositions[1].z, 1);
                        const snake3c = createSnake(0xf1c40f, spawnPositions[2].x, spawnPositions[2].z, 2);
                        scene.add(snake3a.mesh);
                        scene.add(snake3b.mesh);
                        scene.add(snake3c.mesh);
                        snakes.push(snake3a, snake3b, snake3c);
                        break;
                    case 4:
                        // Four snakes with different behaviors
                        const snake4a = createSnake(0x2ecc71, spawnPositions[0].x, spawnPositions[0].z, 0);
                        const snake4b = createSnake(0xe74c3c, spawnPositions[1].x, spawnPositions[1].z, 1);
                        const snake4c = createSnake(0xf1c40f, spawnPositions[2].x, spawnPositions[2].z, 2);
                        const snake4d = createSnake(0x9b59b6, spawnPositions[3].x, spawnPositions[3].z, 3);
                        scene.add(snake4a.mesh);
                        scene.add(snake4b.mesh);
                        scene.add(snake4c.mesh);
                        scene.add(snake4d.mesh);
                        snakes.push(snake4a, snake4b, snake4c, snake4d);
                        break;
                    case 5:
                        // Five snakes with different behaviors
                        const snake5a = createSnake(0x2ecc71, spawnPositions[0].x, spawnPositions[0].z, 0);
                        const snake5b = createSnake(0xe74c3c, spawnPositions[1].x, spawnPositions[1].z, 1);
                        const snake5c = createSnake(0xf1c40f, spawnPositions[2].x, spawnPositions[2].z, 2);
                        const snake5d = createSnake(0x9b59b6, spawnPositions[3].x, spawnPositions[3].z, 3);
                        const snake5e = createSnake(0x1abc9c, spawnPositions[4].x, spawnPositions[4].z, 3);
                        scene.add(snake5a.mesh);
                        scene.add(snake5b.mesh);
                        scene.add(snake5c.mesh);
                        scene.add(snake5d.mesh);
                        scene.add(snake5e.mesh);
                        snakes.push(snake5a, snake5b, snake5c, snake5d, snake5e);
                        break;
                }
            }
        }

        // Check for level change
        if (score.totalScore >= 150 * currentLevel) {
            changeLevel();
        }

        // Store previous position for collision detection
        const previousPosition = playerGroup.position.clone();
        
        // Check wall collisions before applying movement
        let canMove = true;
        const nextPosition = playerGroup.position.clone();
        
        // Calculate diagonal movement speed adjustment
        const diagonalSpeed = moveSpeed / Math.sqrt(2); // Normalize diagonal speed
        
        // Diagonal movement combinations
        if (keys.w && keys.a) {
            nextPosition.z -= diagonalSpeed;
            nextPosition.x -= diagonalSpeed;
            walkCycle += walkSpeed;
            playerGroup.rotation.y = -Math.PI * 3/4;
        }
        else if (keys.w && keys.d) {
            nextPosition.z -= diagonalSpeed;
            nextPosition.x += diagonalSpeed;
            walkCycle += walkSpeed;
            playerGroup.rotation.y = Math.PI * 3/4;
        }
        else if (keys.s && keys.a) {
            nextPosition.z += diagonalSpeed;
            nextPosition.x -= diagonalSpeed;
            walkCycle += walkSpeed;
            playerGroup.rotation.y = -Math.PI * 1/4;
        }
        else if (keys.s && keys.d) {
            nextPosition.z += diagonalSpeed;
            nextPosition.x += diagonalSpeed;
            walkCycle += walkSpeed;
            playerGroup.rotation.y = Math.PI * 1/4;
        }
        else {
            // Original cardinal movement remains unchanged
            if (keys.w) {
                nextPosition.z -= moveSpeed;
                walkCycle += walkSpeed;
                playerGroup.rotation.y = Math.PI;
            }
            if (keys.s) {
                nextPosition.z += moveSpeed;
                walkCycle += walkSpeed;
                playerGroup.rotation.y = 0;
            }
            if (keys.a) {
                nextPosition.x -= moveSpeed;
                walkCycle += walkSpeed;
                playerGroup.rotation.y = -Math.PI / 2;
            }
            if (keys.d) {
                nextPosition.x += moveSpeed;
                walkCycle += walkSpeed;
                playerGroup.rotation.y = Math.PI / 2;
            }
        }
        
        // Check wall collisions
        const tempPosition = playerGroup.position.clone();
        playerGroup.position.copy(nextPosition);
        
        // Check collisions with walls
        if (checkCollision(playerGroup, wallNorth) || 
            checkCollision(playerGroup, wallSouth) || 
            checkCollision(playerGroup, wallEast) || 
            checkCollision(playerGroup, wallWest)) {
            playerGroup.position.copy(tempPosition);
            canMove = false;
        }
        
        // Check obstacle collisions
        if (canMove) {
            for (const obstacle of obstacles) {
                if (checkCollision(playerGroup, obstacle)) {
                    playerGroup.position.copy(tempPosition);
                    canMove = false;
                    break;
                }
            }
        }
        
        // If movement was blocked, revert to previous position
        if (!canMove) {
            playerGroup.position.copy(previousPosition);
        }

        // Animate limbs
        if (keys.w || keys.s || keys.a || keys.d) {
            // Arms swing
            leftArm.rotation.x = Math.sin(walkCycle) * walkAmplitude;
            rightArm.rotation.x = -Math.sin(walkCycle) * walkAmplitude;
            
            // Legs swing
            leftLeg.rotation.x = -Math.sin(walkCycle) * walkAmplitude;
            rightLeg.rotation.x = Math.sin(walkCycle) * walkAmplitude;

            // Butt cheeks animation
            leftCheek.position.y = leftCheek.userData.baseY + Math.abs(Math.sin(walkCycle)) * -0.1;
            rightCheek.position.y = rightCheek.userData.baseY + Math.abs(Math.sin(walkCycle + Math.PI)) * 0.1;
        } else {
            // Reset limb positions when not moving
            leftArm.rotation.x = 0;
            rightArm.rotation.x = 0;
            leftLeg.rotation.x = 0;
            rightLeg.rotation.x = 0;

            // Reset butt cheeks to default position
            leftCheek.position.y = leftCheek.userData.baseY;
            rightCheek.position.y = rightCheek.userData.baseY;
        }

        // Update score
        const currentTime = Date.now();
        const timeSinceLastUpdate = (currentTime - score.lastScoreUpdateTime) / 1000;
        score.timePoints += timeSinceLastUpdate;
        score.foodPoints = playerPowerUps.doublePoints ? score.foodPoints * 2 : score.foodPoints;
        score.totalScore = Math.floor(score.timePoints + score.foodPoints);
        score.lastScoreUpdateTime = currentTime;
        scoreDiv.textContent = `Score: ${score.totalScore}`;

        // Change behavior every 10 seconds
        if (Date.now() - lastBehaviorChange > behaviorInterval) {
            isChasingFood = !isChasingFood;
            lastBehaviorChange = Date.now();
        }

        // Check food collision with player
        for (const food of foods) {
            if (checkCollision(playerGroup, food)) {
                playBonusSound(); // Add sound effect
                score.foodPoints += 20;
                score.totalScore = Math.floor(score.timePoints + score.foodPoints);
                scoreDiv.textContent = `Score: ${score.totalScore}`;
                
                // Remove food and create new one
                scene.remove(food);
                foods = foods.filter(f => f !== food);
                createMouse();
            }
        }

        // Update all snakes
        snakes.forEach(snake => {
            // Update behavior based on type
            if (snake.behavior.type === 3) { // Random with food intervals
                const currentTime = Date.now();
                if (snake.behavior.isInRandomMode) {
                    // Check if it's time to chase food
                    if (currentTime >= snake.behavior.nextFoodChaseTime) {
                        snake.behavior.isChasingFood = true;
                        snake.behavior.isInRandomMode = false;
                    }
                }
            }

            // Determine target based on behavior type
            let target;
            if (snake.behavior.type === 1) { // Player-only
                target = playerGroup.position;
            } else if (snake.behavior.type === 2) { // Food-only
                target = foods.length > 0 ? foods[0].position : playerGroup.position;
            } else if (snake.behavior.type === 3) { // Random with food intervals
                target = snake.behavior.isChasingFood && foods.length > 0 ? foods[0].position : playerGroup.position;
            } else { // Original alternating behavior
                target = isChasingFood && foods.length > 0 ? foods[0].position : playerGroup.position;
            }

            const interceptPoint = snakeEvolution.adaptivePathfinding(target);
            const currentSnakeSpeed = snakeSpeed * snakeEvolution.evolutionFactors.speedModifier;
            
            // Store potential next positions
            const nextPositions = [
                { x: snake.mesh.position.x + currentSnakeSpeed, z: snake.mesh.position.z, dir: 'right', rotation: Math.PI / 2 },
                { x: snake.mesh.position.x - currentSnakeSpeed, z: snake.mesh.position.z, dir: 'left', rotation: -Math.PI / 2 },
                { x: snake.mesh.position.x, z: snake.mesh.position.z + currentSnakeSpeed, dir: 'down', rotation: 0 },
                { x: snake.mesh.position.x, z: snake.mesh.position.z - currentSnakeSpeed, dir: 'up', rotation: Math.PI }
            ];

            // For random behavior, shuffle positions
            if (snake.behavior.type === 3 && snake.behavior.isInRandomMode) {
                for (let i = nextPositions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [nextPositions[i], nextPositions[j]] = [nextPositions[j], nextPositions[i]];
                }
            } else {
                // Sort positions by distance to target
                nextPositions.sort((a, b) => {
                    const distA = Math.sqrt(Math.pow(a.x - target.x, 2) + Math.pow(a.z - target.z, 2));
                    const distB = Math.sqrt(Math.pow(b.x - target.x, 2) + Math.pow(b.z - target.z, 2));
                    return distA - distB;
                });
            }

            // Try each position until we find one that doesn't collide with obstacles
            let validPosition = false;
            let stuckCounter = 0;
            let lastValidPosition = null;

            for (const pos of nextPositions) {
                const tempPos = snake.mesh.position.clone();
                tempPos.x = pos.x;
                tempPos.z = pos.z;
                
                let collision = false;
                for (const obstacle of obstacles) {
                    if (tempPos.distanceTo(obstacle.position) < 0.75) {
                        collision = true;
                        break;
                    }
                }
                
                if (!collision) {
                    snake.mesh.position.x = pos.x;
                    snake.mesh.position.z = pos.z;
                    snake.direction = pos.dir;
                    // Rotate snake and its face elements
                    snake.mesh.rotation.y = pos.rotation;
                    snake.leftEye.rotation.y = pos.rotation;
                    snake.rightEye.rotation.y = pos.rotation;
                    snake.tongue.rotation.y = pos.rotation;
                    snake.leftFork.rotation.y = pos.rotation;
                    snake.rightFork.rotation.y = pos.rotation;
                    validPosition = true;
                    lastValidPosition = pos;
                    break;
                }
            }

            // If snake is stuck (no valid position found), try random movement
            if (!validPosition) {
                // Generate random direction
                const randomAngle = Math.random() * Math.PI * 2;
                const randomX = Math.cos(randomAngle) * currentSnakeSpeed;
                const randomZ = Math.sin(randomAngle) * currentSnakeSpeed;
                
                const tempPos = snake.mesh.position.clone();
                tempPos.x += randomX;
                tempPos.z += randomZ;
                
                // Check if random position is valid
                let collision = false;
                for (const obstacle of obstacles) {
                    if (tempPos.distanceTo(obstacle.position) < 0.75) {
                        collision = true;
                        break;
                    }
                }
                
                if (!collision) {
                    snake.mesh.position.x = tempPos.x;
                    snake.mesh.position.z = tempPos.z;
                    snake.direction = randomAngle > 0 ? 'right' : 'left';
                    snake.mesh.rotation.y = randomAngle;
                    snake.leftEye.rotation.y = randomAngle;
                    snake.rightEye.rotation.y = randomAngle;
                    snake.tongue.rotation.y = randomAngle;
                    snake.leftFork.rotation.y = randomAngle;
                    snake.rightFork.rotation.y = randomAngle;
                    validPosition = true;
                }
            }

            // Keep snake within bounds
            snake.mesh.position.x = Math.max(-9, Math.min(9, snake.mesh.position.x));
            snake.mesh.position.z = Math.max(-9, Math.min(9, snake.mesh.position.z));

            // Update snake segments
            for (let i = snake.segments.length - 1; i > 0; i--) {
                snake.segments[i].position.copy(snake.segments[i - 1].position);
            }
            if (snake.segments.length > 0) {
                snake.segments[0].position.copy(snake.mesh.position);
            }

            // Check collision with snake
            if (checkCollision(playerGroup, snake.mesh)) {
                if (!shieldActive && !isInvincible) {
                    playLoseSound();
                    gameOver = true;
                    const nickname = nicknameInput.value.trim() || 'Player';
                    highScores.push({ nickname, score: score.totalScore });
                    localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
                    updateHighScoresList();
                    showGameOver();
                }
            }
            
            // Check player collision with snake segments
            for (const segment of snake.segments) {
                if (checkCollision(playerGroup, segment)) {
                    if (!shieldActive && !isInvincible) {
                        gameOver = true;
                        const nickname = nicknameInput.value.trim() || 'Player';
                        highScores.push({ nickname, score: score.totalScore });
                        localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
                        updateHighScoresList();
                        showGameOver();
                        break;
                    }
                }
            }

            // Check food collision with snake
            for (const food of foods) {
                if (checkCollision(snake.mesh, food)) {
                    addSnakeSegment(snake); // Add segment to the specific snake
                    scene.remove(food);
                    foods = foods.filter(f => f !== food);
                    createMouse();
                    console.log('Snake ate food!');
                }
            }
        });

        // Camera follow
        camera.position.x = playerGroup.position.x;
        camera.position.z = playerGroup.position.z + 10;
        camera.lookAt(playerGroup.position);

        // Update power-ups
        updatePowerUps();
    }

    renderer.render(scene, camera);
}

// Start the animation loop
animate();

// Update addSnakeSegment function to add multiple segments
function addSnakeSegment(snake) {
    // Add multiple segments based on growth rate
    for (let i = 0; i < snakeGrowthRate; i++) {
        // Determine if this is the last segment to get the special butt design
        const isLastSegment = snake.segments.length === 0;
        
        let segment;
        if (isLastSegment) {
            // Create butt group
            const buttGroup = new THREE.Group();
            
            // Create left and right butt cheeks
            const cheekGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const cheekMaterial = new THREE.MeshStandardMaterial({ 
                color: snake.mesh.material.color.getHex(),
                roughness: 0.3,
                metalness: 0.1
            });
            
            const leftCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
            const rightCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
            
            leftCheek.position.set(-0.2, 0, 0);
            rightCheek.position.set(0.2, 0, 0);
            
            buttGroup.add(leftCheek);
            buttGroup.add(rightCheek);
            segment = buttGroup;
        } else {
            // Create regular body segment
            segment = new THREE.Mesh(snakeHeadGeometry, snake.mesh.material);
        }
        
        segment.position.y = 0.5;
        
        // Position it at the end of the snake
        const lastSegment = snake.segments[snake.segments.length - 1];
        if (lastSegment) {
            segment.position.copy(lastSegment.position);
        } else {
            // If no segments exist, position behind snake head based on direction
            segment.position.copy(snake.mesh.position);
            switch(snake.direction) {
                case 'up':
                    segment.position.z += 1;
                    break;
                case 'down':
                    segment.position.z -= 1;
                    break;
                case 'left':
                    segment.position.x += 1;
                    break;
                case 'right':
                    segment.position.x -= 1;
                    break;
            }
        }
        
        // If this is the last segment, update its rotation to match the snake's direction
        if (isLastSegment) {
            switch(snake.direction) {
                case 'up':
                    segment.rotation.y = Math.PI;
                    break;
                case 'down':
                    segment.rotation.y = 0;
                    break;
                case 'left':
                    segment.rotation.y = -Math.PI / 2;
                    break;
                case 'right':
                    segment.rotation.y = Math.PI / 2;
                    break;
            }
        }
        
        scene.add(segment);
        snake.segments.push(segment);
    }
}

// Food system (mouse)
function createMouse() {
    // Remove oldest food if we're at the limit
    if (foods.length >= maxFoods) {
        scene.remove(foods[0]);
        foods.shift();
    }

    // Create mouse model
    const food = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    bodyGeometry.scale(1.5, 1, 1);  // Elongate the body
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,  // Fur-like brown color
        roughness: 0.7,
        metalness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    food.add(body);

    // Ears
    const earGeometry = new THREE.SphereGeometry(0.12, 32, 32);
    earGeometry.scale(1, 1.5, 0.5);

    const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
    const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);

    leftEar.position.set(-0.48, 0.4, 0);
    rightEar.position.set(0.48, 0.4, 0);
    leftEar.rotation.z = -0.3;
    rightEar.rotation.z = 0.3;

    food.add(leftEar);
    food.add(rightEar);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.08, 32, 32);
    const eyeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        roughness: 0.1,
        metalness: 0.3
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);

    leftEye.position.set(-0.2, 0.2, 0.4);
    rightEye.position.set(0.2, 0.2, 0.4);

    food.add(leftEye);
    food.add(rightEye);

    // Tail
    const tailGeometry = new THREE.CylinderGeometry(0.02, 0.04, 0.8, 32);
    const tailMaterial = new THREE.MeshStandardMaterial({
        color: 0x5D4037,
        roughness: 0.6,
        metalness: 0.1
    });

    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, -0.2, -0.6);
    tail.rotation.x = Math.PI / 4;

    food.add(tail);

    // Whiskers
    function createWhisker(x, y) {
        const whiskerGeometry = new THREE.CylinderGeometry(0.004, 0.004, 0.4, 8);
        const whiskerMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const whisker = new THREE.Mesh(whiskerGeometry, whiskerMaterial);
        whisker.position.set(x, y, 0.56);
        whisker.rotation.x = Math.PI / 4;
        whisker.rotation.z = x > 0 ? -0.5 : 0.5;
        food.add(whisker);
    }

    createWhisker(-0.16, 0.24);
    createWhisker(-0.08, 0.24);
    createWhisker(0.08, 0.24);
    createWhisker(0.16, 0.24);
    
    // Find a valid position that's not on an obstacle or other food
    let validPosition = false;
    let x, z;
    
    while (!validPosition) {
        x = Math.floor(Math.random() * 18) - 9;
        z = Math.floor(Math.random() * 18) - 9;
        
        // Check if position is too close to player or snakes
        const distanceToPlayer = Math.sqrt(x * x + z * z);
        let tooCloseToSnake = false;
        for (const snake of snakes) {
            const distanceToSnake = Math.sqrt(
                (x - snake.mesh.position.x) * (x - snake.mesh.position.x) + 
                (z - snake.mesh.position.z) * (z - snake.mesh.position.z)
            );
            if (distanceToSnake < 3) {
                tooCloseToSnake = true;
                break;
            }
        }
        
        // Check if position is on an obstacle or other food
        let onObstacle = false;
        for (const obstacle of obstacles) {
            const distanceToObstacle = Math.sqrt(
                (x - obstacle.position.x) * (x - obstacle.position.x) + 
                (z - obstacle.position.z) * (z - obstacle.position.z)
            );
            if (distanceToObstacle < 1) {
                onObstacle = true;
                break;
            }
        }
        
        // Check distance to other food items
        let tooCloseToFood = false;
        for (const existingFood of foods) {
            const distanceToFood = Math.sqrt(
                (x - existingFood.position.x) * (x - existingFood.position.x) + 
                (z - existingFood.position.z) * (z - existingFood.position.z)
            );
            if (distanceToFood < 3) {
                tooCloseToFood = true;
                break;
            }
        }
        
        // Position is valid if it's not on an obstacle, not too close to player/snake/food
        if (!onObstacle && !tooCloseToSnake && !tooCloseToFood && distanceToPlayer > 3) {
            validPosition = true;
        }
    }
    
    food.position.set(x, 0.5, z);
    scene.add(food);
    foods.push(food);
}

// Add level system variables
let currentLevel = 1;
let levelTransition = false;
let transitionStartTime = 0;
const transitionDuration = 2000; // 2 seconds for transition

// Array to store all snakes
const snakes = [];

// Power-up system variables
const powerUps = [];
let lastPowerUpSpawn = 0;
const powerUpSpawnInterval = 10000; // 10 seconds
let shieldActive = false;
let shieldTimer = 0;
let speedBoostActive = false;
let speedBoostTimer = 0;
let freezeActive = false;
let freezeTimer = 0;

// Player power-up state
let playerPowerUps = {
    speed: false,
    shield: false,
    timeFreeze: false,
    doublePoints: false,
    ghost: false
};

// Create power-up
function createPowerUp() {
    const powerUp = new THREE.Group();

    // Randomly choose between shield, speed boost, and freeze
    const powerUpTypes = [
        { type: 'shield', color: 0x4169E1 },    // Blue
        { type: 'speed', color: 0xFFD700 },     // Gold
        { type: 'freeze', color: 0x00FFFF }     // Cyan
    ];
    
    const selectedType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    const color = selectedType.color;

    // Create glowing sphere
    const sphereGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const sphereMaterial = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    powerUp.add(sphere);

    // Add floating animation
    powerUp.userData = {
        floatOffset: Math.random() * Math.PI * 2,
        type: selectedType.type
    };

    // Find valid position
    let validPosition = false;
    let x, z;
    while (!validPosition) {
        x = Math.floor(Math.random() * 18) - 9;
        z = Math.floor(Math.random() * 18) - 9;
        
        // Check distance to player, snakes, food, and obstacles
        const distanceToPlayer = Math.sqrt(x * x + z * z);
        let tooClose = false;
        
        // Check snakes
        for (const snake of snakes) {
            const distanceToSnake = Math.sqrt(
                (x - snake.mesh.position.x) * (x - snake.mesh.position.x) + 
                (z - snake.mesh.position.z) * (z - snake.mesh.position.z)
            );
            if (distanceToSnake < 3) {
                tooClose = true;
                break;
            }
        }
        
        // Check obstacles
        for (const obstacle of obstacles) {
            const distanceToObstacle = Math.sqrt(
                (x - obstacle.position.x) * (x - obstacle.position.x) + 
                (z - obstacle.position.z) * (z - obstacle.position.z)
            );
            if (distanceToObstacle < 1) {
                tooClose = true;
                break;
            }
        }
        
        // Check food
        for (const food of foods) {
            const distanceToFood = Math.sqrt(
                (x - food.position.x) * (x - food.position.x) + 
                (z - food.position.z) * (z - food.position.z)
            );
            if (distanceToFood < 3) {
                tooClose = true;
                break;
            }
        }
        
        if (!tooClose && distanceToPlayer > 3) {
            validPosition = true;
        }
    }
    
    powerUp.position.set(x, 0.5, z);
    scene.add(powerUp);
    powerUps.push(powerUp);
}

// Apply power-up glow
function applyPowerUpGlow(type) {
    const color = glowColors[type];
    playerGroup.traverse((child) => {
        if (child.isMesh) {
            child.material.emissive = new THREE.Color(color);
            child.material.emissiveIntensity = 0.5;
        }
    });
}

// Remove power-up glow
function removePowerUpGlow() {
    playerGroup.traverse((child) => {
        if (child.isMesh) {
            child.material.emissive = new THREE.Color(0x000000);
            child.material.emissiveIntensity = 0;
        }
    });
}

// Update power-up animations and effects
function updatePowerUps() {
    const currentTime = Date.now();
    
    // Update power-up visual effects
    const updatePowerUpEffect = (active, endTime, type) => {
        if (active) {
            const timeLeft = endTime - currentTime;
            if (timeLeft <= blinkStartTime) {
                // Start blinking when power-up is about to end
                const shouldShow = Math.floor(currentTime / blinkRate) % 2 === 0;
                if (shouldShow) {
                    applyPowerUpGlow(type);
                } else {
                    removePowerUpGlow();
                }
            }
        }
    };

    // Update effects for each power-up type
    if (shieldActive) updatePowerUpEffect(shieldActive, shieldTimer, 'shield');
    if (speedBoostActive) updatePowerUpEffect(speedBoostActive, speedBoostTimer, 'speed');
    if (freezeActive) updatePowerUpEffect(freezeActive, freezeTimer, 'freeze');

    // Update floating animation and shield pulse
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.position.y = 0.5 + Math.sin(currentTime * 0.002 + powerUp.userData.floatOffset) * 0.2;
        powerUp.rotation.y += 0.02;

        // Check collision with player
        const distance = powerUp.position.distanceTo(playerGroup.position);
        if (distance < 0.75) {
            // Play power-up pickup sound
            playEatSound();

            if (powerUp.userData.type === 'shield') {
                shieldActive = true;
                shieldTimer = currentTime + 5000;
                applyPowerUpGlow('shield');
                
                // Add shield activation message
                const message = document.createElement('div');
                message.textContent = 'Shield Activated!';
                message.style.position = 'absolute';
                message.style.top = '50%';
                message.style.left = '50%';
                message.style.transform = 'translate(-50%, -50%)';
                message.style.color = '#4169E1';
                message.style.fontSize = '48px';
                message.style.fontWeight = 'bold';
                message.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
                document.body.appendChild(message);
                
                // Remove message after 2 seconds
                setTimeout(() => {
                    document.body.removeChild(message);
                }, 2000);
            } else if (powerUp.userData.type === 'speed') {
                // Apply speed boost
                speedBoostActive = true;
                speedBoostTimer = currentTime + 5000; // 5 seconds
                moveSpeed = baseMoveSpeed * 2; // Double speed
                applyPowerUpGlow('speed');
                
                // Show message
                const message = document.createElement('div');
                message.textContent = 'Speed Boost!';
                message.style.position = 'absolute';
                message.style.top = '50%';
                message.style.left = '50%';
                message.style.transform = 'translate(-50%, -50%)';
                message.style.color = '#FFD700';
                message.style.fontSize = '48px';
                message.style.fontWeight = 'bold';
                message.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
                document.body.appendChild(message);
                
                // Remove message after 2 seconds
                setTimeout(() => {
                    document.body.removeChild(message);
                }, 2000);
            } else if (powerUp.userData.type === 'freeze') {
                // Apply freeze effect
                freezeActive = true;
                freezeTimer = currentTime + 5000; // 5 seconds
                snakeSpeed = snakeSpeed / 3; // Temporarily reduce snake speed
                applyPowerUpGlow('freeze');
                
                // Show message
                const message = document.createElement('div');
                message.textContent = 'Freeze!';
                message.style.position = 'absolute';
                message.style.top = '50%';
                message.style.left = '50%';
                message.style.transform = 'translate(-50%, -50%)';
                message.style.color = '#00FFFF';
                message.style.fontSize = '48px';
                message.style.fontWeight = 'bold';
                message.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
                document.body.appendChild(message);
                
                // Remove message after 2 seconds
                setTimeout(() => {
                    document.body.removeChild(message);
                }, 2000);
            }
            
            // Remove power-up
            scene.remove(powerUp);
            powerUps.splice(i, 1);
        }
    }
    
    // Update shield pulse effect
    if (shieldActive) {
        const pulseIntensity = 0.5 + Math.sin(currentTime * 0.01) * 0.3;
        playerGroup.children.forEach(child => {
            if (child.material) {
                child.material.emissiveIntensity = pulseIntensity;
            }
        });
    }
    
    // Check if it's time to spawn a new power-up
    if (currentTime - lastPowerUpSpawn >= powerUpSpawnInterval) {
        createPowerUp();
        lastPowerUpSpawn = currentTime;
    }
    
    // Check if shield should end
    if (shieldActive && currentTime > shieldTimer) {
        shieldActive = false;
        
        // Remove player glow
        removePowerUpGlow();
        
        // Show message that shield ended
        const message = document.createElement('div');
        message.textContent = 'Shield Ended';
        message.style.position = 'absolute';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.color = '#4169E1';
        message.style.fontSize = '36px';
        message.style.fontWeight = 'bold';
        message.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        document.body.appendChild(message);
        
        // Remove message after 2 seconds
        setTimeout(() => {
            document.body.removeChild(message);
        }, 2000);
    }
    
    // Check if speed boost should end
    if (speedBoostActive && currentTime > speedBoostTimer) {
        speedBoostActive = false;
        moveSpeed = baseMoveSpeed; // Reset speed to base speed
        
        // Remove player glow
        removePowerUpGlow();
        
        // Show message that speed boost ended
        const message = document.createElement('div');
        message.textContent = 'Speed Boost Ended';
        message.style.position = 'absolute';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.color = '#FFD700';
        message.style.fontSize = '36px';
        message.style.fontWeight = 'bold';
        message.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        document.body.appendChild(message);
        
        // Remove message after 2 seconds
        setTimeout(() => {
            document.body.removeChild(message);
        }, 2000);
    }

    // Check if freeze should end
    if (freezeActive && currentTime > freezeTimer) {
        freezeActive = false;
        
        // Restore original snake speed
        snakeSpeed = snakeSpeed * 3; // Restore original speed
        
        // Remove player glow
        removePowerUpGlow();
        
        // Show message that freeze ended
        const message = document.createElement('div');
        message.textContent = 'Freeze Ended';
        message.style.position = 'absolute';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.color = '#00FFFF';
        message.style.fontSize = '36px';
        message.style.fontWeight = 'bold';
        message.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        document.body.appendChild(message);
        
        // Remove message after 2 seconds
        setTimeout(() => {
            document.body.removeChild(message);
        }, 2000);
    }
}

// Modify window load event
window.addEventListener('load', () => {
    startScreen.style.display = 'none'; // Hide start screen initially
    startScreen.style.pointerEvents = 'none'; // Disable interactions with start screen
    startAudioButton.style.display = 'block'; // Show audio button first
});