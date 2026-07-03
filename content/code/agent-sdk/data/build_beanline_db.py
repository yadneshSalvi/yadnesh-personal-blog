"""Build beanline.db from the Beanline CSVs in this folder, deterministically.

Same seeded rows as the CSVs (including the planted duplicate March row),
with real types, primary keys, foreign keys, and indexes. Usage:

    python3 build_beanline_db.py [output_path]

The per-part copy of this script (part-06 onward, backend/data/) reads the
part's own sample_data/ CSVs; this one reads the CSVs next to it.
"""

import csv
import sqlite3
import sys
from pathlib import Path

HERE = Path(__file__).parent

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


def main(out_path: str) -> None:
    db_path = Path(out_path)
    db_path.unlink(missing_ok=True)
    con = sqlite3.connect(db_path)
    con.executescript(DDL)
    for table, columns in [("stores", 4), ("products", 4), ("sales", 5)]:
        with open(HERE / f"{table}.csv", newline="") as f:
            rows = list(csv.reader(f))[1:]
        placeholders = ",".join("?" * columns)
        con.executemany(f"INSERT INTO {table} VALUES ({placeholders})", rows)
    con.commit()
    counts = {
        table: con.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        for table in ("stores", "products", "sales")
    }
    con.close()
    print(f"wrote {db_path} {counts}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else str(HERE / "beanline.db"))
