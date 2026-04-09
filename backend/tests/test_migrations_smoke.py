from pathlib import Path


MIGRATIONS_DIR = Path(__file__).resolve().parents[2] / "supabase" / "migrations"


def test_migrations_exist_and_are_sql_files():
    files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    assert files, "Expected at least one SQL migration file"
    assert all(f.suffix == ".sql" for f in files)


def test_migrations_follow_timestamp_prefix_ordering():
    files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    names = [f.name for f in files]
    timestamps = [name.split("_")[0] for name in names]

    assert all(ts.isdigit() for ts in timestamps)
    assert timestamps == sorted(timestamps)


def test_core_schema_migrations_present():
    sql = "\n".join(f.read_text(encoding="utf-8") for f in sorted(MIGRATIONS_DIR.glob("*.sql")))

    for expected in [
        "create table",
        "listings",
        "reviews",
        "conversations",
        "messages",
        "users",
    ]:
        assert expected in sql.lower()


def test_migration_prefixes_are_unique():
    files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    prefixes = [f.name.split("_")[0] for f in files]
    assert len(prefixes) == len(set(prefixes))
