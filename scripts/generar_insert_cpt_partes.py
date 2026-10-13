"""Genera las categorías y partes de Cpt desde Partes.xlsx."""

from pathlib import Path

import openpyxl


SOURCE = Path(r"C:\Users\jacob\Downloads\Partes.xlsx")
OUTPUT = Path(__file__).with_name("insert_cpt_partes.sql")
ROWS_PER_BATCH = 1000


def sql_literal(value):
    if value is None:
        return "NULL"
    return "N'" + str(value).strip().replace("'", "''") + "'"


def values_row(code, description, category, level, parent=None):
    return "({long_description}, {description}, {category}, {level}, {parent}, NULL, 0, 0, NULL, {code}, NULL)".format(
        code=sql_literal(code),
        description=sql_literal(description),
        long_description=sql_literal(description),
        category=sql_literal(category),
        level=level,
        parent=sql_literal(parent),
    )


def insert_statement(rows):
    return "\n".join(
        [
            "INSERT INTO dbo.Cpt (longDescription, description, category, [level], parent, auditNotes, averageCost, expectedCost, rules, code, formId)",
            "VALUES",
            ",\n".join(rows) + ";",
            "",
        ]
    )


def build_inserts(rows):
    # SQL Server permits up to 1,000 row constructors in one INSERT statement.
    return [insert_statement(rows[start:start + ROWS_PER_BATCH]) for start in range(0, len(rows), ROWS_PER_BATCH)]


def main():
    workbook = openpyxl.load_workbook(SOURCE, read_only=True, data_only=True)
    worksheet = workbook.active
    rows = list(worksheet.iter_rows(min_row=2, values_only=True))

    categories = []
    category_set = set()
    parts = []
    for code, description, parent, subtype in rows:
        code = str(code).strip() if code is not None else ""
        description = str(description).strip() if description is not None else ""
        parent = str(parent).strip() if parent is not None else ""
        subtype = str(subtype).strip() if subtype is not None else ""
        if not code or not description or not parent or not subtype:
            raise ValueError("Cada fila debe tener CodigoParte, Descripcion, CategoriaItem y category.")
        if len(subtype) > 10:
            raise ValueError("category supera los 10 caracteres: " + subtype)
        category_key = (parent, subtype)
        if category_key not in category_set:
            categories.append(category_key)
            category_set.add(category_key)
        parts.append((code, description, parent, subtype))

    category_statement = insert_statement([values_row(parent, parent, subtype, 1) for parent, subtype in categories])
    part_statements = build_inserts([values_row(code, description, subtype, 0, parent) for code, description, parent, subtype in parts])
    header = "/* Generado desde C:\\Users\\jacob\\Downloads\\Partes.xlsx */\n"
    OUTPUT.write_text(header + "/* Categorias visibles en la pestana de ordenes de reparacion. */\n" + category_statement + "/* Articulos de nivel cero. */\n" + "\n".join(part_statements), encoding="utf-8-sig")

    print(f"Generado: {OUTPUT} ({len(categories)} categorias, {len(parts)} partes)")


if __name__ == "__main__":
    main()
