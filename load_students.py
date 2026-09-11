"""Create the students table from data/class_dataset.csv and load every row."""

import csv
import os
from pathlib import Path

import psycopg2
from psycopg2.extras import execute_values

ROOT = Path(__file__).resolve().parent
CSV_PATH = ROOT / "data" / "class_dataset.csv"
ENV_PATH = ROOT / ".env"

COLUMNS = [
    "netid",
    "name",
    "school_year",
    "intro_programming",
    "skill_programming",
    "skill_data_stats",
    "skill_frontend_design",
    "skill_business_pitch",
    "tools",
    "availability",
    "idea_rank_1",
    "idea_rank_2",
    "idea_rank_3",
    "partner_request",
    "working_style",
    "interests",
    "semester_goal",
    "submitted_at",
]

INT_COLUMNS = {
    "skill_programming",
    "skill_data_stats",
    "skill_frontend_design",
    "skill_business_pitch",
    "idea_rank_1",
    "idea_rank_2",
    "idea_rank_3",
}

CREATE_SQL = """
DROP TABLE IF EXISTS students;
CREATE TABLE students (
    netid TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    school_year TEXT NOT NULL,
    intro_programming TEXT NOT NULL,
    skill_programming SMALLINT NOT NULL,
    skill_data_stats SMALLINT NOT NULL,
    skill_frontend_design SMALLINT NOT NULL,
    skill_business_pitch SMALLINT NOT NULL,
    tools TEXT,
    availability TEXT,
    idea_rank_1 SMALLINT,
    idea_rank_2 SMALLINT,
    idea_rank_3 SMALLINT,
    partner_request TEXT,
    working_style TEXT,
    interests TEXT,
    semester_goal TEXT,
    submitted_at TIMESTAMPTZ
);
"""

INSERT_SQL = f"INSERT INTO students ({', '.join(COLUMNS)}) VALUES %s"


def load_env(path):
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ[key.strip()] = value.strip().strip('"').strip("'")


def convert(row):
    out = {}
    for key in COLUMNS:
        value = (row.get(key) or "").strip()
        if value == "":
            out[key] = None
        elif key in INT_COLUMNS:
            out[key] = int(value)
        else:
            out[key] = value
    return out


def main():
    load_env(ENV_PATH)
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise SystemExit("DATABASE_URL is missing from .env")

    with CSV_PATH.open(encoding="utf-8", newline="") as f:
        rows = [convert(row) for row in csv.DictReader(f)]

    values = [tuple(row[col] for col in COLUMNS) for row in rows]

    conn = psycopg2.connect(database_url)
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(CREATE_SQL)
                execute_values(cur, INSERT_SQL, values)
                cur.execute("SELECT COUNT(*) FROM students")
                count = cur.fetchone()[0]
        print(f"students table row count: {count}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
