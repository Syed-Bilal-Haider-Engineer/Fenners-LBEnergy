import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ALLOWED = new Set(["financial", "sustainability"]);

export async function POST(request: Request) {
  let body: { report?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const report = body.report;
  if (typeof report !== "string" || !ALLOWED.has(report)) {
    return Response.json(
      { error: `report must be one of: ${[...ALLOWED].join(", ")}` },
      { status: 400 },
    );
  }

  // next dev runs from <repo>/client, so repo root is one level up.
  const repoRoot = path.resolve(process.cwd(), "..");

  return new Promise<Response>((resolve) => {
    const child = spawn("python3", ["scripts/generate_report.py", report], {
      cwd: repoRoot,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk) => (stderr += chunk.toString()));

    child.on("error", (err) => {
      resolve(
        Response.json(
          { error: `Failed to launch python3: ${err.message}` },
          { status: 500 },
        ),
      );
    });

    child.on("close", async (code) => {
      if (code !== 0) {
        resolve(
          Response.json(
            { ok: false, exitCode: code, stdout, stderr },
            { status: 500 },
          ),
        );
        return;
      }

      // Script prints one `Wrote <abs-path>.pdf` line per PDF emitted.
      // Pick the last one matching the requested report type.
      const lines = [...stdout.matchAll(/^Wrote (.+\.pdf)\s*$/gm)].map((m) => m[1].trim());
      const pdfPath = [...lines].reverse().find((p) =>
        path.basename(p).startsWith(`${report}_`),
      );
      if (!pdfPath) {
        resolve(
          Response.json(
            { ok: false, error: "Script produced no PDF.", stdout, stderr },
            { status: 500 },
          ),
        );
        return;
      }

      try {
        const bytes = await readFile(pdfPath);
        const filename = path.basename(pdfPath);
        resolve(
          new Response(new Uint8Array(bytes), {
            status: 200,
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="${filename}"`,
              "Content-Length": String(bytes.length),
            },
          }),
        );
      } catch (e) {
        resolve(
          Response.json(
            {
              ok: false,
              error: `Could not read generated PDF: ${(e as Error).message}`,
              pdfPath,
            },
            { status: 500 },
          ),
        );
      }
    });
  });
}
