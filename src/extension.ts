import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "import-formatter.format",
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        return;
      }

      const document = editor.document;
      const text = document.getText();
      const lines = text.split("\n");

      const importRegex = /^\s*import\s/;
      const imports: string[] = [];

      let firstImportLine = -1;
      let lastImportLine = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (importRegex.test(line)) {
          if (firstImportLine === -1) firstImportLine = i;
          lastImportLine = i;
        }
      }

      if (firstImportLine === -1 || lastImportLine === -1) {
        vscode.window.showWarningMessage("Nenhum import encontrado.");
        return;
      }

      for (let i = firstImportLine; i <= lastImportLine; i++) {
        imports.push(lines[i]);
      }

      const flattenedImports = flattenImports(imports);

      const { externalImports, internalImports } =
        separateImports(flattenedImports);

      const sortedExternal = externalImports.sort(
        (a, b) => a.length - b.length
      );
      const sortedInternal = internalImports.sort(
        (a, b) => a.length - b.length
      );

      const formattedExternal = formatLongImports(sortedExternal);
      const formattedInternal = formatLongImports(sortedInternal);

      const finalImports = [...formattedExternal, "", ...formattedInternal];

      const start = new vscode.Position(firstImportLine, 0);
      const end = new vscode.Position(lastImportLine + 1, 0);

      await editor.edit((editBuilder) => {
        editBuilder.replace(
          new vscode.Range(start, end),
          finalImports.join("\n") + "\n"
        );
      });

      const message =
        vscode.env.language === "pt-br"
          ? "imports formatados pelo import-formatter! 🥳"
          : "Imports formatted by import-formatter! 🥳";

      vscode.window.showInformationMessage(message);
    }
  );

  context.subscriptions.push(disposable);
}

function flattenImports(lines: string[]): string[] {
  const result: string[] = [];
  let currentImport = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("import") && trimmed.endsWith(";")) {
      result.push(trimmed);
    } else {
      currentImport += " " + trimmed;
      if (trimmed.endsWith(";")) {
        result.push(currentImport.trim());
        currentImport = "";
      }
    }
  }

  return result;
}

function separateImports(imports: string[]) {
  const externalImports: string[] = [];
  const internalImports: string[] = [];

  for (const imp of imports) {
    const match = imp.match(/from\s+['"](.*)['"]/);
    if (match) {
      const importPath = match[1];
      if (importPath.startsWith(".") || importPath.startsWith("src")) {
        internalImports.push(imp);
      } else {
        externalImports.push(imp);
      }
    }
  }

  return { externalImports, internalImports };
}

function formatLongImports(
  imports: string[],
  maxLength: number = 100
): string[] {
  return imports.map((imp) => {
    if (imp.length <= maxLength) {
      return imp;
    }

    const match = imp.match(/import\s+{([^}]*)}\s+from\s+['"](.*)['"]/);
    if (!match) {
      return imp;
    }

    const importsInside = match[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const fromPath = match[2];

    const newImport = `import {\n  ${importsInside.join(
      ",\n  "
    )}\n} from "${fromPath}";`;
    return newImport;
  });
}

export function deactivate() {}
