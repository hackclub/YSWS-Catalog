
const defaults = {
    particleCount: 200,
    spread: 120,
    scalar: 1.7,
    startVelocity: 80,
}
function doConfetti(){
    // Left
    confetti({
    ...defaults,
    angle: 45,
    origin: { y: 1, x:0}
    });

    // Right
    confetti({
    ...defaults,
    angle: 135,
    // spread: 0,
    origin: { y: 1, x:1}
    });
}

// onmousemove = function(e){doConfettiAtCursor(e.x, e.y)}