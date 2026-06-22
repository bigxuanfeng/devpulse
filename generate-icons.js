const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Read SVG file
const svgBuffer = fs.readFileSync(path.join(__dirname, "public", "icons", "icon-192.svg"));

// Generate 192x192 PNG
sharp(svgBuffer)
  .png()
  .toFile(path.join(__dirname, "public", "icons", "icon-192x192.png"))
  .then(() => console.log("✅ icon-192x192.png created"))
  .catch((err) => console.error("Error creating 192x192 icon:", err));

// Generate 512x512 PNG
sharp(svgBuffer)
  .png()
  .toFile(path.join(__dirname, "public", "icons", "icon-512x512.png"))
  .then(() => console.log("✅ icon-512x512.png created"))
  .catch((err) => console.error("Error creating 512x512 icon:", err));
