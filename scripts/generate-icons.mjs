import sharp from "sharp";
import fs from "fs";
import path from "path";

const svgPath = path.join(process.cwd(), "public", "favicon.svg");
const publicDir = path.join(process.cwd(), "public");

const sizes = [192, 512];

async function generateIcons() {
  try {
    const svgContent = fs.readFileSync(svgPath, "utf-8");

    for (const size of sizes) {
      // Regular icons
      await sharp(Buffer.from(svgContent))
        .resize(size, size, {
          fit: "contain",
          background: { r: 17, g: 17, b: 17 },
        })
        .png()
        .toFile(path.join(publicDir, `icon-${size}.png`));

      console.log(`✓ Generated icon-${size}.png`);

      // Maskable icons (with padding for better display)
      await sharp(Buffer.from(svgContent))
        .resize(size - 40, size - 40, {
          fit: "contain",
          background: { r: 17, g: 17, b: 17 },
        })
        .extend({
          top: 20,
          bottom: 20,
          left: 20,
          right: 20,
          background: { r: 17, g: 17, b: 17 },
        })
        .png()
        .toFile(path.join(publicDir, `icon-${size}-maskable.png`));

      console.log(`✓ Generated icon-${size}-maskable.png`);
    }

    console.log("\n✅ All icons generated successfully!");
  } catch (error) {
    console.error("Error generating icons:", error);
    process.exit(1);
  }
}

generateIcons();
