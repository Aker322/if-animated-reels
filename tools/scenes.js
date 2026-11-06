// optional per-reel scenes: SCENES.name = (c, t, lt, bg) => { ...draw in the 1080 core square... }
window.SCENES = {
  night: (c, t, lt, bg) => {           // example: a house at night with one lit window
    fillBG(c, bg);
    const tone = lum(bg) > 0.55 ? mixc(bg, '#000000', 0.2) : mixc(bg, '#FFFFFF', 0.12);
    fillCircle(c, 820, 170, 90, C.cream);
    c.fillStyle = tone; c.fillRect(BGR.x, 980, BGR.w, BGR.h);
    c.beginPath(); c.moveTo(180, 980); c.lineTo(180, 700); c.lineTo(540, 450); c.lineTo(900, 700); c.lineTo(900, 980); c.fill();
    c.fillStyle = '#FFD2B0'; rr(c, 640, 760, 100, 90, 8); c.fill();
  },
};
