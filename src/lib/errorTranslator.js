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

export function translatePythonError(rawError) {
  const cleaned = String(rawError || "")
    .replace(/^PythonError:\s*/i, "")
    .trim();
  const match = Object.keys(GCSE_ERROR_MAP).find((type) => cleaned.includes(type));
  if (!match) return cleaned;
  return `${cleaned}\n\n${GCSE_ERROR_MAP[match]}`;
}
