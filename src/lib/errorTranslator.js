const GCSE_ERROR_MAP = {
  SyntaxError:
    "Hint: Your Python sentence is malformed. Check colons, brackets, and quote pairs.",
  IndexError:
    "Hint: You tried to access a list position that does not exist.",
  IndentationError:
    "Hint: Python uses indentation as structure. Check spaces/tabs alignment.",
  NameError:
    "Hint: A variable name is being used before it is created.",
  TypeError:
    "Hint: Two values are incompatible for this operation.",
  ZeroDivisionError: "Hint: Division by zero is undefined. Check your denominator.",
  ModuleNotFoundError:
    "Hint: Python cannot find that library. Check the import spelling and make sure the library is supported here.",
  ImportError:
    "Hint: Python could not finish that import. Check the module and item names carefully.",
  AttributeError:
    "Hint: You tried to use something that does not exist on that value or module.",
  ValueError:
    "Hint: The value is the right type, but it is not valid for this operation.",
  KeyError:
    "Hint: That dictionary key does not exist yet.",
};

const MIGRATION_FILE = "supabase_migrations.sql";

export function isMissingSupabaseTableError(error, tableName) {
  const message = String(error?.message || "").toLowerCase();
  if (!message) return false;
  if (!message.includes("schema cache")) return false;
  if (!message.includes("could not find the table")) return false;
  if (!tableName) return true;
  return message.includes(`public.${String(tableName).toLowerCase()}`);
}

export function translateSupabaseError(error, fallback = "Something went wrong.") {
  if (!error) return fallback;
  const message = String(error?.message || "").trim();
  if (!message) return fallback;

  if (isMissingSupabaseTableError(error)) {
    return `This feature is not set up in Supabase yet. Run the SQL in ${MIGRATION_FILE} and refresh the app.`;
  }

  if (message.toLowerCase().includes("could not find the") && message.toLowerCase().includes("column")) {
    return `This feature needs the latest Supabase SQL update. Run ${MIGRATION_FILE} and refresh the app.`;
  }

  return message;
}

export function translatePythonError(rawError) {
  const cleaned = String(rawError || "")
    .replace(/^PythonError:\s*/i, "")
    .trim();
  const match = Object.keys(GCSE_ERROR_MAP).find((type) => cleaned.includes(type));
  if (!match) return cleaned;
  return `${cleaned}\n\n${GCSE_ERROR_MAP[match]}`;
}
