
const defaults = {
    particleCount: 400,
    spread: 120,
    scalar: 1.7,
    startVelocity: 70,
    gravity: 10,
}
function doConfetti(){
    // // Left
    // confetti({
    // ...defaults,
    // angle: 45,
    // origin: { y: 1, x:0}
    // });

    // // Right
    // confetti({
    // ...defaults,
    // angle: 135,
    // // spread: 0,
    // origin: { y: 1, x:1}
    // });


    confetti({
  spread: 360,
  ticks: 200,
  gravity: 1,
  decay: .94,
  startVelocity: 30,
  particleCount: 100,
  scalar: 3,
  shapes: ["image"],
  shapeOptions: {
    image: [{
        src: "https://particles.js.org/images/fruits/apple.png",
        width: 32,
        height: 32
      },
      
    ]
  }
});
}

// onmousemove = function(e){doConfettiAtCursor(e.x, e.y)}