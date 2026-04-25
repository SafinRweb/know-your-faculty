import { execFile } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

interface ParsedSection {
  course_code: string;
  section_no: string;
  faculty_initial: string;
  day_pattern: string;
  time_slot: string | null;
  room: string | null;
}

interface ParseResult {
  semester: string;
  sections: ParsedSection[];
  faculty_initials: string[];
  unique_course_count: number;
  total_sections: number;
}

export async function parseSchedulePDF(buffer: Buffer): Promise<ParseResult> {
  // Write buffer to a temp file
  const tmpPath = join(tmpdir(), `ewu_schedule_${Date.now()}.pdf`);

  try {
    await writeFile(tmpPath, buffer);

    // Path to our Python script
    const scriptPath = join(process.cwd(), "pipeline", "parse_schedule.py");

    // Run Python parser
    const { stdout, stderr } = await execFileAsync("python", [scriptPath, tmpPath], {
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    if (stderr && !stdout) {
      throw new Error(`Python error: ${stderr}`);
    }

    const result = JSON.parse(stdout.trim());

    if (result.error) {
      throw new Error(result.error);
    }

    return result as ParseResult;
  } finally {
    // Clean up temp file
    await unlink(tmpPath).catch(() => {});
  }
}
