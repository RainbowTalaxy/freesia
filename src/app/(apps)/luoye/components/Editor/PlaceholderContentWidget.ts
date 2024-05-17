'use client';
import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

/**
 * 来源：https://github.com/microsoft/monaco-editor/issues/568#issuecomment-1499966160
 */
class PlaceholderContentWidget implements monaco.editor.IContentWidget {
    private static readonly ID = 'editor.widget.placeholderHint';

    private domNode: HTMLElement | undefined;

    constructor(
        private readonly placeholder: string,
        private readonly editor: monaco.editor.ICodeEditor,
    ) {
        // register a listener for editor code changes
        editor.onDidChangeModelContent(() => this.onDidChangeModelContent());
        // ensure that on initial load the placeholder is shown
        this.onDidChangeModelContent();
    }

    private onDidChangeModelContent(): void {
        if (this.editor.getValue() === '') {
            this.editor.addContentWidget(this);
        } else {
            this.editor.removeContentWidget(this);
        }
    }

    getId(): string {
        return PlaceholderContentWidget.ID;
    }

    getDomNode(): HTMLElement {
        if (!this.domNode) {
            this.domNode = document.createElement('div');
            this.domNode.style.width = 'max-content';
            this.domNode.style.pointerEvents = 'none';
            this.domNode.textContent = this.placeholder;
            this.domNode.style.color = 'var(--ly-primary)';
            this.domNode.style.opacity = '0.5';
            this.editor.applyFontInfo(this.domNode);
        }

        return this.domNode;
    }

    getPosition(): monaco.editor.IContentWidgetPosition | null {
        return {
            position: { lineNumber: 1, column: 1 },
            // monaco.editor.ContentWidgetPositionPreference.EXACT
            preference: [0],
        };
    }

    dispose(): void {
        this.editor.removeContentWidget(this);
    }
}

export default PlaceholderContentWidget;
