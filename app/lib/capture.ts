// lib/capture.ts
export async function captureElementToPNG(el: HTMLElement, fileName = "biramy-capture.png") {
  // Create a canvas the size of the target element
  const rect = el.getBoundingClientRect();
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(rect.width);
  canvas.height = Math.ceil(rect.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Draw visible <video> (if any) and absolutely-positioned overlays inside el
  // Assumes your TryOnCanvas uses a <video> and <canvas>/<img> overlays inside a wrapper.
  const video = el.querySelector("video") as HTMLVideoElement | null;
  if (video && video.videoWidth && video.videoHeight) {
    // Fit video to element bounds
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }

  // Draw any <canvas> overlays
  el.querySelectorAll("canvas").forEach((c) => {
    const overlay = c as HTMLCanvasElement;
    ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);
  });

  // Draw any <img> overlays
  const imgs = Array.from(el.querySelectorAll("img")) as HTMLImageElement[];
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((res) => {
          if (img.complete) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            res();
          } else {
            img.onload = () => {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              res();
            };
          }
        })
    )
  );

  // Download PNG
  const link = document.createElement("a");
  link.download = fileName;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
