from pathlib import Path
import csv
import sys


def main(in_path=None, out_path=None):
    in_path = Path(in_path) if in_path else Path(__file__).parent / "input" / "sensor_readings.csv"
    out_path = Path(out_path) if out_path else Path(__file__).parent / "output" / "rainfall_nonzero.csv"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    written = 0
    with in_path.open("r", encoding="utf-8") as fin:
        reader = csv.reader(fin)
        header = next(reader)
        header = [h.strip() for h in header]
        # find rainfall column index robustly
        try:
            idx = header.index("rainfall_mm_per_hour")
        except ValueError:
            idx = None
            for i, h in enumerate(header):
                hn = h.lower()
                if "rainfall" in hn and "mm" in hn:
                    idx = i
                    break
            if idx is None:
                raise SystemExit("Could not find rainfall column in header")

        with out_path.open("w", encoding="utf-8", newline="") as fout:
            writer = csv.writer(fout)
            writer.writerow(header)
            for row in reader:
                if len(row) <= idx:
                    continue
                val = row[idx].strip().strip(',')
                try:
                    v = float(val)
                except Exception:
                    try:
                        v = float(val.replace(' ', '').strip(','))
                    except Exception:
                        v = 0.0
                if abs(v) > 1e-9:
                    writer.writerow([c.strip() for c in row])
                    written += 1

    print(f"Wrote {written} rows to {out_path}")


if __name__ == '__main__':
    args = sys.argv[1:]
    main(*args)
