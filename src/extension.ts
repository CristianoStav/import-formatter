import * as _ from  'lodash';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('import-formatter.format', async () => {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return;
		}
	
		const document = editor.document;

		const searchText = 'import';

        const text = editor.document.getText();
        const lines = text.split('\n');

        let firstLine = -1;
        let lastLine = -1;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].indexOf(searchText) !== -1) {
                firstLine = firstLine === -1 ? i : firstLine;
                lastLine = i;
            } else if (firstLine !== -1 && lines[i + 1] && lines[i + 1].indexOf(searchText) !== -1) {
                // Handle multi-line imports
                lastLine = i + 1;
            }
        }
				const imports: string[] = [];
				
				for (let i = firstLine; i <= lastLine; i++) {
					imports.push(document.lineAt(i).text);
				}  
				
				const concatedImports = concatImportLine(imports);
				console.log("🚀 ~ file: extension.ts:39 ~ disposable ~ concatedImports:", concatedImports)

				const sortedImports = concatedImports.sort((a,b) => a.length - b.length);
				let arrayCounter = 0;

				for (let i = firstLine; i <= lastLine; i++) {
					const range = document.lineAt(i).range;

					await editor.edit(editBuilder => {
						editBuilder.replace(range, sortedImports[arrayCounter]);
					});
					arrayCounter += 1
				}

		vscode.window.showInformationMessage('imports formatados pelo import-formatter! 🥳');
	});

	context.subscriptions.push(disposable);
}

interface Lines {
	line: string;
	linesCount: number;
}

const concatImportLine = (lines: string[]): string[] => {
	const returnedImports: string[] = [];
	let auxString = '';
	
	lines.forEach((lin: string) => {
		if(lin.startsWith('import') && lin.endsWith(';')){
			returnedImports.push(lin);
		} else if (lin.endsWith('{') || lin.endsWith(',')){
			auxString += lin.trim();
		} else if (lin.endsWith(';')) {
			auxString += lin.trim();
			returnedImports.push(auxString);
		}
	})

	return returnedImports;
}

export function deactivate() {}