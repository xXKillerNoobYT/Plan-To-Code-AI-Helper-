/**
 * Plans Panel (Frontend)
 * Displays plan.json content in a webview panel
 */

import * as vscode from 'vscode';

export class PlansPanel {
    private panel: vscode.WebviewPanel | undefined;

    /**
     * Show the plans panel
     */
    show(context: vscode.ExtensionContext): void {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'coePlans',
            'COE Plans',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = this.getWebviewContent();

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
    }

    /**
     * Update panel content
     */
    updatePlanContent(planData: any): void {
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'updatePlan',
                data: planData
            });
        }
    }

    /**
     * Generate HTML content for the webview
     */
    private getWebviewContent(): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>COE Plans</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 20px;
                    }
                    h1 { color: var(--vscode-textLink-foreground); }
                    .plan-section {
                        margin: 20px 0;
                        padding: 15px;
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 4px;
                    }
                    .task-item {
                        padding: 8px;
                        margin: 5px 0;
                        background: var(--vscode-editor-inactiveSelectionBackground);
                    }
                </style>
            </head>
            <body>
                <h1>📋 Project Plan</h1>
                <div id="plan-content">
                    <p>Loading plan data...</p>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.command === 'updatePlan') {
                            document.getElementById('plan-content').innerHTML = 
                                '<pre>' + JSON.stringify(message.data, null, 2) + '</pre>';
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
}
