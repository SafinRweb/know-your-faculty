#!/usr/bin/env python3
import sys
import json
import re
import pdfplumber

def parse_schedule(pdf_path: str) -> dict:
    rows = []  # Every single row from PDF, no merging

    with pdfplumber.open(pdf_path) as pdf:
        semester = "Unknown Semester"
        first_text = pdf.pages[0].extract_text() or ""
        sem_match = re.search(r'Offered Courses\s*\(([^)]+)\)', first_text)
        if sem_match:
            semester = sem_match.group(1).strip()

        row_pattern = re.compile(
            r'^([A-Z]{2,4}\d{3}[A-Z]?)\s+(\d+)\s+([A-Z0-9]+)\s+(\d+/\d+)\s+'
            r'([SMTWR]{1,3}\s+\d{1,2}:\d{2}\s+[AP]M\s+-\s+\d{1,2}:\d{2}\s+[AP]M)\s+(.*)'
        )

        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue
            for line in text.split('\n'):
                line = line.strip()
                if not line:
                    continue
                match = row_pattern.match(line)
                if not match:
                    continue

                course = match.group(1)
                sec = match.group(2)
                faculty = match.group(3)
                timing = match.group(5).strip()
                room = match.group(6).strip()

                # Parse day and time from timing
                tm = re.match(r'^([SMTWR]{1,3})\s+(.*)', timing)
                day_pattern = tm.group(1) if tm else ""
                time_slot = tm.group(2).strip() if tm else timing

                rows.append({
                    "course_code": course,
                    "section_no": sec,
                    "faculty_initial": faculty,
                    "day_pattern": day_pattern,
                    "time_slot": time_slot,
                    "room": room,
                })

    faculty_initials = sorted(set(r["faculty_initial"] for r in rows))

    return {
        "semester": semester,
        "total_sections": len(rows),
        "faculty_initials": faculty_initials,
        "unique_course_count": len(set(r["course_code"] for r in rows)),
        "sections": rows,
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No PDF path provided"}))
        sys.exit(1)
    result = parse_schedule(sys.argv[1])
    print(json.dumps(result))
