const dragHeart = document.getElementById('drag-heart');
const trashZone = document.getElementById('trash-zone');
const loveZone = document.getElementById('love-zone');
const feedbackText = document.getElementById('feedback-text');
const mainCard = document.getElementById('mainCard');
const successCard = document.getElementById('successCard');
const gameArea = document.querySelector('.game-area');

// Game State
let yesAttempts = 0;
let isDragging = false;
let startX, startY, initialLeft, initialTop;
let trashOffset = { x: 0, y: 0 };

// Phrases
const trashPhrases = [
    "I'm not trash! 🗑️",
    "How dare you! 😤",
    "Try the other one! 👉",
    "Nope, not here! 🚫",
    "I'm precious! 💎",
    "Are you blind? 🕶️",
    "Wrong hole! 😳",
    "Heart goes in Heart! ❤️",
    "Get away! 😱",
    "Nuh uh! ☝️"
];

const yesPhrases = [
    "Are you sure? 🥺",
    "Really really sure? 🧐",
    "Lock your answer? 🔒",
    "Final answer? 📝",
    "Promise? 💍",
];

// Ensure initial state
window.onload = () => {
    successCard.style.display = 'none'; // Double check JS side hiding
    successCard.classList.add('hidden');
    mainCard.classList.remove('hidden');
    mainCard.style.display = 'flex';
};

// Touch/Mouse Start
const onDragStart = (e) => {
    // Determine input type and coordinates
    const isTouch = e.type === 'touchstart';
    if (!isTouch) e.preventDefault(); // Prevent default for mouse, touch needs it for scroll sometimes but we disabled touch-action

    // If using touch, only track first finger
    if (isTouch && e.touches.length > 1) return;

    isDragging = true;

    // Get client coordinates
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    // Get current position relative to game-area
    // We use offsetLeft/Top because we are constrained to the game area container now
    initialLeft = dragHeart.offsetLeft;
    initialTop = dragHeart.offsetTop;

    startX = clientX;
    startY = clientY;

    dragHeart.style.transition = 'none';
    dragHeart.style.cursor = 'grabbing';
    dragHeart.style.animation = 'none'; // Stop heartbeat

    // Change feedback
    feedbackText.innerText = "Drag me! ❤️";
    feedbackText.style.animation = 'none';
};

// Touch/Mouse Move
const onDragMove = (e) => {
    if (!isDragging) return;

    const isTouch = e.type === 'touchmove';
    if (isTouch) e.preventDefault(); // Prevent scrolling 100%

    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    const dx = clientX - startX;
    const dy = clientY - startY;

    // New positions
    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;

    // Constrain to Game Area
    const box = gameArea.getBoundingClientRect();
    const heartW = dragHeart.offsetWidth;
    const heartH = dragHeart.offsetHeight;

    // Relative constraint math
    // The dragHeart's parent is game-area. 
    // Boundary check isn't strictly necessary for visual flow but nice to keep it on screen
    // We'll just let it fly but update position

    dragHeart.style.left = `${newLeft}px`;
    dragHeart.style.top = `${newTop}px`;

    // We need global coordinates for collision detection since elements might be nested differently
    // Actually, getBoundingClientRect returns viewport coords, so that works for everything.
    checkTrashProximity(clientX, clientY);
};

// Touch/Mouse End
const onDragEnd = (e) => {
    if (!isDragging) return;
    isDragging = false;
    dragHeart.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    dragHeart.style.cursor = 'grab';
    dragHeart.style.animation = 'heartbeat 1.5s infinite'; // Resume heartbeat

    // Collision Check
    const heartRect = dragHeart.getBoundingClientRect();
    const trashRect = trashZone.getBoundingClientRect();
    const loveRect = loveZone.getBoundingClientRect();

    const heartCenter = {
        x: heartRect.left + heartRect.width / 2,
        y: heartRect.top + heartRect.height / 2
    };

    // Check overlaps
    if (isColliding(heartCenter, loveRect)) {
        handleLoveDrop();
    } else if (isColliding(heartCenter, trashRect)) {
        handleTrashDrop();
    } else {
        resetHeart();
    }

    // Reset internal state if needed
};

function isColliding(point, rect) {
    // Simple point-in-rect check
    // Give a little buffer for better UX
    return point.x >= rect.left && point.x <= rect.right &&
        point.y >= rect.top && point.y <= rect.bottom;
}

function resetHeart() {
    // Return to default CSS position: left 50%, top 30%
    // We clear inline styles so CSS takes over
    dragHeart.style.left = '50%';
    dragHeart.style.top = '30%';
    dragHeart.style.transform = 'translate(-50%, -50%)';
}

// Cooldown state
let isTrashMoving = false;

function checkTrashProximity(x, y) {
    if (isTrashMoving) return; // Don't check if already moving

    const trashRect = trashZone.getBoundingClientRect();
    const trashCenter = {
        x: trashRect.left + trashRect.width / 2,
        y: trashRect.top + trashRect.height / 2
    };

    const dist = Math.hypot(x - trashCenter.x, y - trashCenter.y);

    // Trigger distance
    if (dist < 120) {
        moveTrashCan();
    }
}

function moveTrashCan() {
    isTrashMoving = true;

    // 1. Fade out or quick scale down
    trashZone.style.opacity = '0.5';
    trashZone.style.transform = `scale(0.8) translate(${trashOffset.x}px, ${trashOffset.y}px)`; // Keep current pos but shrink

    // 2. Calculate new position
    // Move it significantly away to prevent immediate re-trigger
    // We'll jump to a random spot within limit
    const rx = (Math.random() - 0.5) * 200;
    const ry = (Math.random() - 0.5) * 100 - 50; // Bias upwards slightly

    trashOffset = { x: rx, y: ry };

    // 3. Apply new position after small delay for effect
    setTimeout(() => {
        trashZone.style.opacity = '1';
        trashZone.style.transform = `scale(1) translate(${rx}px, ${ry}px)`;

        // Feedback
        const phrase = trashPhrases[Math.floor(Math.random() * trashPhrases.length)];
        setFeedback(phrase, 'shake');

        // Cooldown reset
        setTimeout(() => {
            isTrashMoving = false;
        }, 500); // 500ms cooldown before it can move again
    }, 100);
}

function handleLoveDrop() {
    if (yesAttempts < yesPhrases.length) {
        setFeedback(yesPhrases[yesAttempts], 'pulse');
        yesAttempts++;
        resetHeart();

        // Reset trash for next attempt
        trashZone.style.transform = 'translate(0,0)';
    } else {
        triggerSuccess();
    }
}

function handleTrashDrop() {
    setFeedback("I said NO! 😠", 'shake');
    resetHeart();
    moveTrashCan();
}

function setFeedback(text, animType) {
    feedbackText.innerText = text;
    feedbackText.style.animation = 'none';
    feedbackText.offsetHeight; // reflow

    if (animType === 'shake') {
        feedbackText.style.animation = 'shake 0.4s ease-in-out';
    } else {
        feedbackText.style.animation = 'pulse 0.4s ease-in-out';
    }
}

function triggerSuccess() {
    confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.6 }
    });

    // Swap cards
    mainCard.style.display = 'none';
    mainCard.classList.add('hidden');

    successCard.style.display = 'flex';
    successCard.classList.remove('hidden');

    feedbackText.innerText = "YAY! I KNEW IT! 🥰";

    // Continuous fireworks
    setInterval(() => {
        confetti({
            particleCount: 20,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
        });
        confetti({
            particleCount: 20,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
        });
    }, 1000);
}

// Event Listeners
dragHeart.addEventListener('mousedown', onDragStart);
document.addEventListener('mousemove', onDragMove);
document.addEventListener('mouseup', onDragEnd);

dragHeart.addEventListener('touchstart', onDragStart, { passive: false });
document.addEventListener('touchmove', onDragMove, { passive: false });
document.addEventListener('touchend', onDragEnd, { passive: false });

// Background floating hearts
const bg = document.querySelector('.dynamic-background');
for (let i = 0; i < 20; i++) {
    const el = document.createElement('div');
    el.classList.add('bg-heart');
    el.innerHTML = Math.random() > 0.5 ? '❤️' : '💖';
    el.style.left = Math.random() * 100 + '%';
    el.style.animationDuration = (10 + Math.random() * 15) + 's';
    el.style.animationDelay = Math.random() * 5 + 's';
    bg.appendChild(el);
}
