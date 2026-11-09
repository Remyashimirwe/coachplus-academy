export type BackgroundOption = {
  id: string;
  name: string;
  color: string;
  previewClass: string;
};

export const WEBSITE_BACKGROUND_COLORS: BackgroundOption[] = [
  { id: "dark-navy", name: "Website Dark Theme (#0f172a)", color: "#0f172a", previewClass: "bg-[#0f172a]" },
  { id: "dark-plum", name: "Website Plum Theme (#21121f)", color: "#21121f", previewClass: "bg-[#21121f]" },
  { id: "brand-pink", name: "Brand Pink (#E91E63)", color: "#E91E63", previewClass: "bg-[#E91E63]" },
  { id: "light-slate", name: "Light Studio (#F8FAFC)", color: "#F8FAFC", previewClass: "bg-[#F8FAFC]" },
  { id: "white", name: "Pure White (#FFFFFF)", color: "#FFFFFF", previewClass: "bg-white" },
  { id: "transparent", name: "Transparent PNG", color: "transparent", previewClass: "bg-transparent border border-dashed border-slate-300" },
];

/**
 * Removes image background using canvas edge & color distance segmentation,
 * then composites the foreground over the selected website background color.
 */
export async function removeAndReplaceBackground(
  file: File,
  targetColor: string = "#0f172a",
  tolerance: number = 28
): Promise<{ file: File; url: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context is not available"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;

          // Sample perimeter background colors (top-left, top-right, bottom-left, bottom-right, and border points)
          const samplePoints: [number, number][] = [
            [0, 0],
            [width - 1, 0],
            [0, height - 1],
            [width - 1, height - 1],
            [Math.floor(width / 2), 0],
            [0, Math.floor(height / 2)],
            [width - 1, Math.floor(height / 2)],
          ];

          const bgSamples: [number, number, number][] = [];
          for (const [x, y] of samplePoints) {
            const idx = (y * width + x) * 4;
            bgSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
          }

          // Compute color distance
          const colorDistance = (
            r1: number,
            g1: number,
            b1: number,
            r2: number,
            g2: number,
            b2: number
          ) => {
            return Math.sqrt(
              Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
            );
          };

          // Generate alpha mask
          const mask = new Uint8Array(width * height);
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];

              // Check distance to any background sample
              let minBgDist = Infinity;
              for (const [sR, sG, sB] of bgSamples) {
                const dist = colorDistance(r, g, b, sR, sG, sB);
                if (dist < minBgDist) minBgDist = dist;
              }

              // Soft alpha transition
              if (minBgDist < tolerance) {
                mask[y * width + x] = 0;
              } else if (minBgDist < tolerance + 22) {
                const alphaFactor = (minBgDist - tolerance) / 22;
                mask[y * width + x] = Math.round(alphaFactor * 255);
              } else {
                mask[y * width + x] = 255;
              }
            }
          }

          // Apply mask to image data
          for (let i = 0; i < mask.length; i++) {
            const pixelIdx = i * 4;
            data[pixelIdx + 3] = mask[i];
          }

          // Clear canvas and fill target background
          ctx.clearRect(0, 0, width, height);

          if (targetColor !== "transparent") {
            ctx.fillStyle = targetColor;
            ctx.fillRect(0, 0, width, height);
          }

          // Put segmented foreground on top
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext("2d");
          if (tempCtx) {
            tempCtx.putImageData(imageData, 0, 0);
            ctx.drawImage(tempCanvas, 0, 0);
          }

          // Convert to File
          const mimeType = targetColor === "transparent" ? "image/png" : "image/jpeg";
          const ext = targetColor === "transparent" ? ".png" : ".jpg";
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const newFileName = `${baseName}_bg_processed${ext}`;

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const processedFile = new File([blob], newFileName, {
                  type: mimeType,
                  lastModified: Date.now(),
                });
                const url = URL.createObjectURL(processedFile);
                resolve({ file: processedFile, url });
              } else {
                reject(new Error("Failed to generate image blob"));
              }
            },
            mimeType,
            0.92
          );
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
