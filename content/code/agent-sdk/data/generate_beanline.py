#!/usr/bin/env python3
"""Generate the Beanline sample dataset: stores.csv, products.csv, sales.csv.

Beanline is a fictional specialty-coffee chain. The generator is fully
deterministic (seeded RNG, fixed float formatting): every run produces
byte-identical CSVs, so tutorial answers and eval cases stay stable.

Usage:
    python3 generate_beanline.py [output_dir]

Note: sales.csv intentionally contains ONE duplicated March row (an exact
copy of an existing row, inserted right after the original). It is a planted
data-quality flaw that later parts of the series use as a test case.
"""

import csv
import random
import sys
from datetime import date, timedelta
from pathlib import Path

SEED = 42
START = date(2026, 1, 1)
END = date(2026, 6, 30)

STORES = [
    ("S01", "Downtown", "Portland", "2021-03-12"),
    ("S02", "Airport", "Portland", "2022-07-01"),
    ("S03", "University", "Eugene", "2023-01-15"),
    ("S04", "Riverside", "Bend", "2023-09-30"),
    ("S05", "Harborview", "Seattle", "2024-05-20"),
    ("S06", "Old Town", "Portland", "2025-02-14"),
]

# product_id, name, category, unit_price, base daily units at traffic 1.0, sell probability
PRODUCTS = [
    ("P01", "Espresso", "drinks", 3.20, 28, 1.00),
    ("P02", "Latte", "drinks", 4.60, 46, 1.00),
    ("P03", "Cappuccino", "drinks", 4.40, 30, 1.00),
    ("P04", "Cold Brew", "drinks", 4.80, 18, 1.00),
    ("P05", "Mocha", "drinks", 5.10, 16, 1.00),
    ("P06", "Drip Coffee", "drinks", 2.80, 38, 1.00),
    ("P07", "Croissant", "food", 3.50, 20, 1.00),
    ("P08", "Banana Bread", "food", 3.90, 12, 0.90),
    ("P09", "Blueberry Muffin", "food", 3.60, 14, 0.90),
    ("P10", "House Blend Beans 250g", "beans", 12.50, 5, 0.65),
    ("P11", "Single Origin Beans 250g", "beans", 16.00, 3, 0.50),
    ("P12", "Beanline Mug", "merch", 14.00, 1, 0.25),
]

# Per-store character: base traffic + a monthly trend (Jan..Jun multipliers).
# Riverside (S04) is the growth story; Harborview (S05) drifts down slowly.
STORE_TRAFFIC = {
    "S01": (1.60, [1.00, 1.01, 1.04, 1.05, 1.06, 1.08]),
    "S02": (1.35, [1.00, 0.98, 1.03, 1.00, 1.02, 0.99]),
    "S03": (1.00, [1.02, 1.00, 0.86, 1.01, 1.04, 0.80]),
    "S04": (0.75, [0.85, 0.95, 1.06, 1.18, 1.32, 1.45]),
    "S05": (1.10, [1.02, 1.00, 0.98, 0.96, 0.94, 0.92]),
    "S06": (0.90, [0.88, 0.94, 1.00, 1.05, 1.08, 1.12]),
}

# Cold Brew sells better as the weather warms; drip a little worse.
SEASONAL = {
    "P04": [0.55, 0.60, 0.85, 1.10, 1.35, 1.60],
    "P06": [1.15, 1.10, 1.05, 1.00, 0.95, 0.90],
}


def daterange(start, end):
    d = start
    while d <= end:
        yield d
        d += timedelta(days=1)


def main(out_dir="."):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    rng = random.Random(SEED)

    with open(out / "stores.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["store_id", "name", "city", "opened"])
        w.writerows(STORES)

    with open(out / "products.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["product_id", "name", "category", "unit_price"])
        for pid, name, cat, price, _, _ in PRODUCTS:
            w.writerow([pid, name, cat, f"{price:.2f}"])

    rows = []
    for day in daterange(START, END):
        month_ix = day.month - 1
        weekend = day.weekday() >= 5
        for store_id, _, _, _ in STORES:
            base_traffic, trend = STORE_TRAFFIC[store_id]
            traffic = base_traffic * trend[month_ix]
            for pid, _, cat, price, base_units, prob in PRODUCTS:
                if rng.random() > prob:
                    continue
                season = SEASONAL.get(pid, [1.0] * 6)[month_ix]
                bump = 1.25 if weekend and cat in ("drinks", "food") else 1.0
                expected = base_units * traffic * season * bump
                units = max(0, int(round(expected * rng.uniform(0.75, 1.25))))
                if units == 0:
                    continue
                rows.append([day.isoformat(), store_id, pid, units, f"{units * price:.2f}"])

    # THE PLANTED FLAW: duplicate one March row (the first March bean-bag sale
    # at the Airport store), inserted right after the original. Every
    # downstream sum over raw March data double-counts it.
    for i, r in enumerate(rows):
        if r[0].startswith("2026-03") and r[1] == "S02" and r[2] == "P10":
            rows.insert(i + 1, list(r))
            break

    with open(out / "sales.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["date", "store_id", "product_id", "units", "revenue"])
        w.writerows(rows)

    print(f"wrote {out/'stores.csv'} ({len(STORES)} stores)")
    print(f"wrote {out/'products.csv'} ({len(PRODUCTS)} products)")
    print(f"wrote {out/'sales.csv'} ({len(rows)} rows)")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
