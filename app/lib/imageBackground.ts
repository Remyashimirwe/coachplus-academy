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
 * Removes image background using connected border flood-fill segmentation & color distance,
 * with edge feathering, then composites the foreground over the selected website background color.
 */
export async function removeAndReplaceBackground(
  file: File,
  targetColor: string = "#0f172a",
  tolerance: number = 32
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
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) {
            reject(new Error("Canvas context is not available"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          const totalPixels = width * height;

          // Collect perimeter background color samples from border grid
          const bgSamples: [number, number, number][] = [];
          const stepX = Math.max(1, Math.floor(width / 20));
          const stepY = Math.max(1, Math.floor(height / 20));

          // Top and bottom borders
          for (let x = 0; x < width; x += stepX) {
            const topIdx = x * 4;
            bgSamples.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
            const botIdx = ((height - 1) * width + x) * 4;
            bgSamples.push([data[botIdx], data[botIdx + 1], data[botIdx + 2]]);
          }
          // Left and right borders
          for (let y = 0; y < height; y += stepY) {
            const leftIdx = (y * width) * 4;
            bgSamples.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);
            const rightIdx = (y * width + (width - 1)) * 4;
            bgSamples.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
          }

          // Perceptually weighted color distance
          const colorDist = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
            const dr = r1 - r2;
            const dg = g1 - g2;
            const db = b1 - b2;
            // Weighted Euclidean distance for human perception
            return Math.sqrt(0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db);
          };

          const isBgPixel = (r: number, g: number, b: number) => {
            for (let i = 0; i < bgSamples.length; i++) {
              const s = bgSamples[i];
              if (colorDist(r, g, b, s[0], s[1], s[2]) <= tolerance) {
                return true;
              }
            }
            return false;
          };

          // Region Growing / BFS from border pixels to find connected background
          const isBackground = new Uint8Array(totalPixels);
          const queue = new Int32Array(totalPixels);
          let head = 0;
          let tail = 0;

          // Initialize queue with border pixels
          const markBorder = (x: number, y: number) => {
            const idx = y * width + x;
            if (isBackground[idx] === 0) {
              const pIdx = idx * 4;
              if (isBgPixel(data[pIdx], data[pIdx + 1], data[pIdx + 2])) {
                isBackground[idx] = 1;
                queue[tail++] = idx;
              }
            }
          };

          for (let x = 0; x < width; x++) {
            markBorder(x, 0);
            markBorder(x, height - 1);
          }
          for (let y = 0; y < height; y++) {
            markBorder(0, y);
            markBorder(width - 1, y);
          }

          // BFS traversal across connected background
          while (head < tail) {
            const curr = queue[head++];
            const cx = curr % width;
            const cy = Math.floor(curr / width);

            // 4-neighborhood
            const neighbors = [
              [cx + 1, cy],
              [cx - 1, cy],
              [cx, cy + 1],
              [cx, cy - 1],
            ];

            for (let i = 0; i < 4; i++) {
              const nx = neighbors[i][0];
              const ny = neighbors[i][1];
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = ny * width + nx;
                if (isBackground[nIdx] === 0) {
                  const pIdx = nIdx * 4;
                  if (isBgPixel(data[pIdx], data[pIdx + 1], data[pIdx + 2])) {
                    isBackground[nIdx] = 1;
                    queue[tail++] = nIdx;
                  }
                }
              }
            }
          }

          // Build alpha mask with edge smoothing / feathering
          const alphaMask = new Uint8Array(totalPixels);
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = y * width + x;
              if (isBackground[idx] === 1) {
                alphaMask[idx] = 0;
              } else {
                // Check if adjacent to background to feather edge
                let bgNeighborCount = 0;
                for (let dy = -1; dy <= 1; dy++) {
                  for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                      if (isBackground[ny * width + nx] === 1) {
                        bgNeighborCount++;
                      }
                    }
                  }
                }
                if (bgNeighborCount > 0) {
                  // Feather edge proportional to neighbor count
                  const factor = Math.max(0.2, 1 - (bgNeighborCount / 9));
                  alphaMask[idx] = Math.round(255 * factor);
                } else {
                  alphaMask[idx] = 255;
                }
              }
            }
          }

          // Apply alpha mask to image data
          for (let i = 0; i < totalPixels; i++) {
            data[i * 4 + 3] = alphaMask[i];
          }

          // Clear canvas and fill target background
          ctx.clearRect(0, 0, width, height);

          if (targetColor !== "transparent") {
            ctx.fillStyle = targetColor;
            ctx.fillRect(0, 0, width, height);
          }

          // Draw segmented foreground
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
