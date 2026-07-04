"""Build Beanline's "live" database from the sample CSVs, deterministically.

Same seeded rows as the CSVs (including the planted duplicate March row),
now with real types, primary keys, foreign keys, and indexes. Run from
backend/:

    uv run python data/build_beanline_db.py
"""

import csv
import sqlite3
from pathlib import Path

HERE = Path(__file__).parent
SAMPLE_DATA = HERE.parent / "sample_data"
DB_PATH = HERE / "beanline.db"

DDL = """
CREATE TABLE stores (
    store_id TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    city     TEXT NOT NULL,
    opened   TEXT NOT NULL
);
CREATE TABLE products (
    product_id TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    category   TEXT NOT NULL,
    unit_price REAL NOT NULL
);
CREATE TABLE sales (
    date       TEXT NOT NULL,
    store_id   TEXT NOT NULL REFERENCES stores(store_id),
    product_id TEXT NOT NULL REFERENCES products(product_id),
    units      INTEGER NOT NULL,
    revenue    REAL NOT NULL
);
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_sales_store ON sales(store_id);
"""


def main() -> None:
    DB_PATH.unlink(missing_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.executescript(DDL)
    for table, columns in [("stores", 4), ("products", 4), ("sales", 5)]:
        with open(SAMPLE_DATA / f"{table}.csv", newline="") as f:
            rows = list(csv.reader(f))[1:]
        placeholders = ",".join("?" * columns)
        con.executemany(f"INSERT INTO {table} VALUES ({placeholders})", rows)
    con.commit()
    counts = {
        table: con.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        for table in ("stores", "products", "sales")
    }
    con.close()
    print(f"wrote {DB_PATH} {counts}")


if __name__ == "__main__":
    main()
