const dragHeart = document.getElementById('drag-heart');
const trashZone = document.getElementById('trash-zone');
const loveZone = document.getElementById('love-zone');
const feedbackText = document.getElementById('feedback-text');
const mainCard = document.getElementById('mainCard');
const successCard = document.getElementById('successCard');

// Game State
let yesAttempts = 0;
let isDragging = false;
let startX, startY, initialLeft, initialTop;

// Phrases
const trashPhrases = [
    "I'm not trash! 🗑️",
    "How dare you! 😤",
    "Try the other one! 👉",
    "Nope, not here! 🚫",
    "Don't even think about it! 🤨",
    "I will run away! 🏃‍♂️",
    "Am I a joke to you? 🤡",
    "Wrong choice! ❌",
    "Heart goes in Heart! ❤️",
    "Stay away! 😱"
];

const yesPhrases = [
    "Are you sure? 🥺",
    "Really really sure? 🧐",
    "Lock your answer? 🔒",
    "Final answer? 📝",
    "Promise you won't regret it? 💍",
    "Okay, one last check... ✅"
];

// Touch/Mouse Start
const onDragStart = (e) => {
    e.preventDefault();
    isDragging = true;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Get current position (relative to parent)
    const style = window.getComputedStyle(dragHeart);
    // Note: This relies on the element being absolutely positioned
    initialLeft = parseFloat(style.left);
    initialTop = parseFloat(style.top);

    startX = clientX;
    startY = clientY;

    dragHeart.style.transition = 'none'; // Disable transition for direct follow
    dragHeart.style.cursor = 'grabbing';
};

// Touch/Mouse Move
const onDragMove = (e) => {
    if (!isDragging) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - startX;
    const dy = clientY - startY;

    // Move the heart
    dragHeart.style.left = `${initialLeft + dx}px`;
    dragHeart.style.top = `${initialTop + dy}px`;

    // Check Proximity to Trash Logic
    checkTrashProximity(clientX, clientY);
};

// Touch/Mouse End
const onDragEnd = (e) => {
    if (!isDragging) return;
    isDragging = false;
    dragHeart.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; // Add springy transition back
    dragHeart.style.cursor = 'grab';

    // Check Drop Targets (using elementFromPoint because touches[0] is gone)
    // For touchend/mouseup, we need the last known position or changedTouches
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

    // We can't use elementFromPoint easily because the dragHeart is covering the cursor
    // So we check simple collision rects
    const heartRect = dragHeart.getBoundingClientRect();
    const trashRect = trashZone.getBoundingClientRect();
    const loveRect = loveZone.getBoundingClientRect();

    const heartCenter = {
        x: heartRect.left + heartRect.width / 2,
        y: heartRect.top + heartRect.height / 2
    };

    // Check Love Zone
    if (isColliding(heartCenter, loveRect)) {
        handleLoveDrop();
    }
    // Check Trash Zone
    else if (isColliding(heartCenter, trashRect)) {
        handleTrashDrop();
    } else {
        resetHeart();
    }
};

function isColliding(point, rect) {
    return point.x >= rect.left && point.x <= rect.right &&
        point.y >= rect.top && point.y <= rect.bottom;
}

function resetHeart() {
    // Return to center (50%, 30% as defined in CSS)
    dragHeart.style.left = '50%';
    dragHeart.style.top = '30%';
    dragHeart.style.transform = 'translate(-50%, -50%)';
}

function checkTrashProximity(x, y) {
    const trashRect = trashZone.getBoundingClientRect();
    const trashCenter = {
        x: trashRect.left + trashRect.width / 2,
        y: trashRect.top + trashRect.height / 2
    };

    const dist = Math.hypot(x - trashCenter.x, y - trashCenter.y);

    // If getting close (e.g., 100px), MOVE TRASH!
    if (dist < 120) {
        moveTrashCan();
    }
}

function moveTrashCan() {
    // Generate random offset but keep it somewhat within the bottom area if possible
    // Actually, just move it randomly around the game area relative to current position
    const randomX = (Math.random() - 0.5) * 300; // -150 to 150
    const randomY = (Math.random() - 0.5) * 300;

    // We update feedback text when it moves
    setFeedback(trashPhrases[Math.floor(Math.random() * trashPhrases.length)], 'shake-text');

    // Apply transform to move it away visually (simpler than changing left/top flow)
    // But we need to update its actual position for collision detection to work right if we used that.
    // CSS Transform translate is purely visual for some hit tests, but getBoundingClientRect respects it.

    // Let's use simple translation relative to its flow position
    const currentTransform = new WebKitCSSMatrix(window.getComputedStyle(trashZone).transform);

    trashZone.style.transform = `translate(${currentTransform.m41 + randomX}px, ${currentTransform.m42 + randomY}px)`;

    // Reset after a bit so it's not permanently gone? No, let it stay away.
}

function handleLoveDrop() {
    // Multi-stage confirmation
    if (yesAttempts < 3) {
        // Playful rejection
        setFeedback(yesPhrases[yesAttempts], 'pulse-text');
        yesAttempts++;
        resetHeart();
    } else {
        // Success!
        triggerSuccess();
    }
}

function handleTrashDrop() {
    // Should be impossible due to evasion, but if they manage it:
    setFeedback("Hey! I said NO! 😡", 'shake-text');
    resetHeart();
    moveTrashCan();
}

function setFeedback(text, animClass) {
    feedbackText.innerText = text;
    feedbackText.style.animation = 'none';
    feedbackText.offsetHeight; /* trigger reflow */
    if (animClass === 'shake-text') {
        feedbackText.style.animation = 'shake 0.5s';
    } else {
        feedbackText.style.animation = 'pulse 0.5s';
    }
}

function triggerSuccess() {
    // Confetti
    confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 }
    });

    mainCard.style.display = 'none';
    successCard.classList.remove('hidden');
    successCard.style.display = 'block';
    feedbackText.innerText = "YAY! I LOVE YOU! ❤️";
}

// Add Events
dragHeart.addEventListener('mousedown', onDragStart);
document.addEventListener('mousemove', onDragMove);
document.addEventListener('mouseup', onDragEnd);

dragHeart.addEventListener('touchstart', onDragStart, { passive: false });
document.addEventListener('touchmove', onDragMove, { passive: false });
document.addEventListener('touchend', onDragEnd, { passive: false });

// Background hearts
function initFloatingHearts() {
    const bg = document.querySelector('.dynamic-background');
    for (let i = 0; i < 15; i++) {
        const heart = document.createElement('div');
        heart.classList.add('bg-heart');
        heart.innerHTML = Math.random() > 0.5 ? '❤️' : '💖';
        heart.style.left = `${Math.random() * 100}%`;
        heart.style.animationDuration = `${10 + Math.random() * 10}s`;
        heart.style.animationDelay = `${Math.random() * 5}s`;
        bg.appendChild(heart);
    }
}
initFloatingHearts();
