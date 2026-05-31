
const defaults = {
    particleCount: 100,
    spread: 120,
    // ticks: 200,
    gravity: 0.5,
    decay: 0.94,
    startVelocity: 60,
    scalar: 2.6,
    zIndex: 99999,
}

const hcIconDefault = {
    particleCount: 40,
    scalar: 3,
    zIndex: 99999,
    // startVelocity: 50,
}

// TODO
// Australian meme
async function isUserSouthern() {
    const res = await fetch("https://ip.hackclub.com/ip")
    console.log(res.json)
}


const logoSources = [
  "logos/(ch)airtable.png",
  "logos/3d print finished ig change it if you have a feedback.png",
  "logos/Ad Astra.png",
  "logos/Anchor.png",
  "logos/arcade 2.png",
  "logos/ascend (DoS).png",
  "logos/assemble.png",
  "logos/athena.png",
  "logos/Bakebuild.png",
  "logos/balatro.png",
  "logos/black box.png",
  "logos/blot.png",
  "logos/blueprint.png",
  "logos/boba.png",
  "logos/cadence.png",
  "logos/cartoon.png",
  "logos/cascade.png",
  "logos/cat club.png",
  "logos/caution!-3.png",
  "logos/Cider.png",
  "logos/coolify.png",
  "logos/Counterspell.png",
  "logos/Create Mod-1.png",
  "logos/deno-1.png",
  "logos/Department of Hacker Culture.png",
  "logos/epoch.png",
  "logos/figma.png",
  "logos/FIRST.png",
  "logos/fun artsy.png",
  "logos/fun doodle.png",
  "logos/Furry Tail + blåhaj + socks (feel free to remove if controversy happens again _3).png",
  "logos/glow.png",
  "logos/google.png",
  "logos/h.com, the everything app.png",
  "logos/h++.png",
  "logos/hackapet.png",
  "logos/Hackbrew.png",
  "logos/hackclub_.png",
  "logos/hackcraft.png",
  "logos/hack-life 2.png",
  "logos/HackMii.png",
  "logos/hackpad (alt).png",
  "logos/hackpad.png",
  "logos/harc.png",
  "logos/HCB.png",
  "logos/high seas.png",
  "logos/image 1.png",
  "logos/Incident.io.png",
  "logos/intellij.png",
  "logos/js.png",
  "logos/lighting.png",
  "logos/m_a_s_h.png",
  "logos/mask-1.png",
  "logos/microsoft teams.png",
  "logos/microsoft word.png",
  "logos/miiverse.png",
  "logos/minus twelve.png",
  "logos/Modrinth.png",
  "logos/neon sign.png",
  "logos/neon.png",
  "logos/new reimbursements.png",
  "logos/NixOS.png",
  "logos/offical logo progress.png",
  "logos/onboard.png",
  "logos/Outernet.png",
  "logos/pedropedropedro.png",
  "logos/Pokemon.png",
  "logos/Portal.png",
  "logos/puppy club - without spots.png",
  "logos/raspberry_pi.png",
  "logos/raycast.png",
  "logos/Retrospect-1.png",
  "logos/ruby.png",
  "logos/rust 2.png",
  "logos/rust.png",
  "logos/say cheese-1.png",
  "logos/scrapyard.png",
  "logos/Scratch.png",
  "logos/Shopify.png",
  "logos/Splitflap.png",
  "logos/sprig.png",
  "logos/template.png",
  "logos/Terminal-1.png",
  "logos/Testflight.png",
  "logos/the bin.png",
  "logos/tiktok.png",
  "logos/ts.png",
  "logos/tv.png",
  "logos/Ubiquiti.png",
  "logos/Ubuntu - Hack Club.png",
  "logos/uiua.png",
  "logos/unixclub.png",
  "logos/unreal_engine.png",
  "logos/yubico.png",
  "logos/zach latta .png"
];

const logoImages = logoSources.map((src) => ({
    src: encodeURI(src),
    width: 32,
    height: 32,
}));

// Preload logo images on page load to avoid lag spike when confetti triggers
function preloadLogoImages() {
    logoSources.forEach(src => {
        const img = new Image();
        img.src = encodeURI(src);
    });
}

window.addEventListener('load', preloadLogoImages);
function doConfetti(){
    // Left
    confetti({
        ...defaults,
        angle: 45,
        origin: { y: 1, x: 0}
    });

    // Right
    confetti({
        ...defaults,
        angle: 135,
        origin: { y: 1, x: 1}
    });
}