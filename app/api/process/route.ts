import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

const profilePath = join(process.cwd(), "pq_profile.icc");

function ensureProfile() {
  if (existsSync(profilePath)) return;
  const script = join(process.cwd(), "scripts", "pq-profile.swift");
  execSync(`swift "${script}" "${profilePath}"`, { stdio: "pipe" });
}

export async function POST(req: NextRequest) {
  let tmpPath = "";

  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    if (!imageFile) {
      return new NextResponse("No image provided", { status: 400 });
    }

    const upscale = formData.get("upscale") === "true";
    const targetSize = parseInt(formData.get("targetSize") as string) || 800;
    const threshold = parseInt(formData.get("threshold") as string) || 240;

    const buffer = Buffer.from(await imageFile.arrayBuffer());

    let pipeline = sharp(buffer);
    const meta = await pipeline.metadata();

    if (meta.space === "grey" || meta.space === "b-w") {
      pipeline = pipeline.toColourspace("srgb");
    }

    const width = meta.width || 0;
    const height = meta.height || 0;

    if (upscale && width < targetSize && height < targetSize) {
      pipeline = pipeline.resize(targetSize, targetSize, {
        kernel: "lanczos3",
        fit: "inside",
      });
    }

    const { data, info } = await pipeline
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channels = info.channels;
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > threshold && g > threshold && b > threshold) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
      }
    }

    const jpegBuffer = await sharp(data, {
      raw: { width: info.width, height: info.height, channels: info.channels },
    })
      .jpeg({ quality: 100, chromaSubsampling: "4:4:4" })
      .toBuffer();

    tmpPath = join(tmpdir(), `${randomUUID()}.jpg`);
    writeFileSync(tmpPath, jpegBuffer);

    ensureProfile();
    execSync(`sips --embedProfile "${profilePath}" "${tmpPath}"`, {
      stdio: "pipe",
    });

    const result = readFileSync(tmpPath);

    const originalName =
      imageFile.name?.replace(/\.[^.]+$/, "") || "output";

    return new NextResponse(result, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${originalName}_hdr.jpg"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Processing failed";
    console.error("Process error:", message);
    return new NextResponse(message, { status: 500 });
  } finally {
    if (tmpPath) {
      try {
        unlinkSync(tmpPath);
      } catch {}
    }
  }
}
