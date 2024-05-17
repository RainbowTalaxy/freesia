import * as monaco from 'monaco-editor';

// 请于 src/css/custom.css 中的颜色同步
const Colors = {
    primary: '#785617',
    secondary: '#d09d3e',
    background: '#fff8ed',
    inactiveBackground: '#c8bba4',
    activeBackground: '#ffedcc',
    pageBackground: '#fffcf6',
};

export const MONACO_TOKEN_CONFIG: monaco.editor.ITokenThemeRule[] = [
    {
        token: 'keyword.md',
        foreground: Colors.primary,
        fontStyle: 'bold',
    },
    {
        token: 'string.link.md', // 链接
        foreground: Colors.secondary,
    },
    {
        token: 'variable.md',
        foreground: Colors.secondary,
    },
    {
        token: 'comment.md',
        foreground: Colors.secondary,
    },
    {
        token: 'strong.md',
        foreground: Colors.primary,
    },
    {
        token: 'string.md',
        foreground: Colors.primary,
    },
    {
        token: 'keyword.table.header.md',
        foreground: Colors.primary,
    },
    {
        token: 'keyword.table.left.md',
        foreground: Colors.secondary,
    },
    {
        token: 'keyword.table.middle.md',
        foreground: Colors.secondary,
    },
    {
        token: 'keyword.table.right.md',
        foreground: Colors.secondary,
    },
];

// 颜色配置：https://microsoft.github.io/monaco-editor/playground.html?source=v0.41.0#example-customizing-the-appearence-exposed-colors
export const MONACO_COLOR_CONFIG: monaco.editor.IColors = {
    foreground: Colors.primary, // Overall foreground color. This color is only used if not overridden by a component.
    errorForeground: Colors.primary, // Overall foreground color for error messages. This color is only used if not overridden by a component.
    descriptionForeground: Colors.primary, // Foreground color for description text providing additional information, for example for a label.
    focusBorder: Colors.primary, // Overall border color for focused elements. This color is only used if not overridden by a component.
    contrastBorder: Colors.primary, // An extra border around elements to separate them from others for greater contrast.
    contrastActiveBorder: Colors.primary, // An extra border around active elements to separate them from others for greater contrast.
    'selection.background': Colors.background, // The background color of text selections in the workbench (e.g. for input fields or text areas). Note that this does not apply to selections within the editor.
    'textSeparator.foreground': Colors.primary, // Color for text separators.
    'textLink.foreground': Colors.primary, // Foreground color for links in text.
    'textLink.activeForeground': Colors.primary, // Foreground color for active links in text.
    'textPreformat.foreground': Colors.primary, // Foreground color for preformatted text segments.
    'textBlockQuote.background': Colors.background, // Background color for block quotes in text.
    'textBlockQuote.border': Colors.primary, // Border color for block quotes in text.
    'textCodeBlock.background': Colors.background, // Background color for code blocks in text.
    'widget.shadow': Colors.pageBackground, // Shadow color of widgets such as find/replace inside the editor.
    'input.background': Colors.background, // Input box background.
    'input.foreground': Colors.primary, // Input box foreground.
    'input.border': Colors.primary, // Input box border.
    'inputOption.activeBorder': Colors.primary, // Border color of activated options in input fields.
    'input.placeholderForeground': Colors.primary, // Input box foreground color for placeholder text.
    'inputValidation.infoBackground': Colors.background, // Input validation background color for information severity.
    'inputValidation.infoBorder': Colors.primary, // Input validation border color for information severity.
    'inputValidation.warningBackground': Colors.background, // Input validation background color for information warning.
    'inputValidation.warningBorder': Colors.primary, // Input validation border color for warning severity.
    'inputValidation.errorBackground': Colors.background, // Input validation background color for error severity.
    'inputValidation.errorBorder': Colors.primary, // Input validation border color for error severity.
    'dropdown.background': Colors.background, // Dropdown background.
    'dropdown.foreground': Colors.primary, // Dropdown foreground.
    'dropdown.border': Colors.primary, // Dropdown border.
    'list.focusBackground': Colors.background, // List/Tree background color for the focused item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not.
    'list.focusForeground': Colors.primary, // List/Tree foreground color for the focused item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not.
    'list.activeSelectionBackground': Colors.background, // List/Tree background color for the selected item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not.
    'list.activeSelectionForeground': Colors.primary, // List/Tree foreground color for the selected item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not.
    'list.inactiveSelectionBackground': Colors.background, // List/Tree background color for the selected item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not.
    'list.inactiveSelectionForeground': Colors.primary, // List/Tree foreground color for the selected item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not.
    'list.hoverBackground': Colors.primary, // List/Tree background when hovering over items using the mouse.
    'list.hoverForeground': Colors.primary, // List/Tree foreground when hovering over items using the mouse.
    'list.dropBackground': Colors.primary, // List/Tree drag and drop background when moving items around using the mouse.
    'list.highlightForeground': Colors.primary, // List/Tree foreground color of the match highlights when searching inside the list/tree.
    'pickerGroup.foreground': Colors.primary, // Quick picker color for grouping labels.
    'pickerGroup.border': Colors.primary, // Quick picker color for grouping borders.
    'button.foreground': Colors.primary, // Button foreground color.
    'button.background': Colors.background, // Button background color.
    'button.hoverBackground': Colors.background, // Button background color when hovering.
    'badge.background': Colors.background, // Badge background color. Badges are small information labels, e.g. for search results count.
    'badge.foreground': Colors.primary, // Badge foreground color. Badges are small information labels, e.g. for search results count.
    'scrollbar.shadow': Colors.pageBackground, // Scrollbar shadow to indicate that the view is scrolled.
    'scrollbarSlider.background': Colors.inactiveBackground, // Slider background color.
    'scrollbarSlider.hoverBackground': Colors.primary, // Slider background color when hovering.
    'scrollbarSlider.activeBackground': Colors.primary, // Slider background color when active.
    'progressBar.background': Colors.primary, // Background color of the progress bar that can show for long running operations.
    'editor.background': Colors.pageBackground, // Editor background color.
    'editor.foreground': Colors.primary, // Editor default foreground color.
    'editorWidget.background': Colors.background, // Background color of editor widgets, such as find/replace.
    'editorWidget.border': Colors.primary, // Border color of editor widgets. The color is only used if the widget chooses to have a border and if the color is not overridden by a widget.
    'editor.selectionBackground': Colors.primary + '20', // Color of the editor selection.
    'editor.selectionForeground': Colors.primary, // Color of the selected text for high contrast.
    'editor.inactiveSelectionBackground': Colors.background, // Color of the selection in an inactive editor.
    'editor.selectionHighlightBackground': Colors.background, // Color for regions with the same content as the selection.
    'editor.findMatchBackground': Colors.primary, // Color of the current search match.
    'editor.findMatchHighlightBackground': Colors.background, // Color of the other search matches.
    'editor.findRangeHighlightBackground': Colors.background, // Color the range limiting the search.
    'editor.hoverHighlightBackground': Colors.background, // Highlight below the word for which a hover is shown.
    'editorHoverWidget.background': Colors.background, // Background color of the editor hover.
    'editorHoverWidget.border': Colors.primary, // Border color of the editor hover.
    'editorLink.activeForeground': Colors.primary, // Color of active links.
    'diffEditor.insertedTextBackground': Colors.background, // Background color for text that got inserted.
    'diffEditor.removedTextBackground': Colors.background, // Background color for text that got removed.
    'diffEditor.insertedTextBorder': Colors.primary, // Outline color for the text that got inserted.
    'diffEditor.removedTextBorder': Colors.primary, // Outline color for text that got removed.
    'editorOverviewRuler.currentContentForeground': Colors.primary, // Current overview ruler foreground for inline merge-conflicts.
    'editorOverviewRuler.incomingContentForeground': Colors.primary, // Incoming overview ruler foreground for inline merge-conflicts.
    'editorOverviewRuler.commonContentForeground': Colors.primary, // Common ancestor overview ruler foreground for inline merge-conflicts.
    'editor.lineHighlightBackground': Colors.background, // Background color for the highlight of line at the cursor position.
    'editor.lineHighlightBorder': Colors.primary, // Background color for the border around the line at the cursor position.
    'editor.rangeHighlightBackground': Colors.background, // Background color of highlighted ranges, like by quick open and find features.
    'editorCursor.foreground': Colors.primary, // Color of the editor cursor.
    'editorWhitespace.foreground': Colors.primary, // Color of whitespace characters in the editor.
    'editorIndentGuide.background': Colors.background, // Color of the editor indentation guides.
    'editorLineNumber.foreground': Colors.secondary, // Color of editor line numbers.
    'editorLineNumber.activeForeground': Colors.primary, // Color of editor active line number.
    'editorRuler.foreground': Colors.primary, // Color of the editor rulers.
    'editorCodeLens.foreground': Colors.primary, // Foreground color of editor code lenses
    'editorInlayHint.foreground': Colors.primary, // Foreground color of editor inlay hints
    'editorInlayHint.background': Colors.background, // Background color of editor inlay hints
    'editorBracketMatch.background': Colors.background, // Background color behind matching brackets
    'editorBracketMatch.border': Colors.primary, // Color for matching brackets boxes
    'editorOverviewRuler.border': Colors.primary, // Color of the overview ruler border.
    'editorGutter.background': Colors.pageBackground, // Background color of the editor gutter. The gutter contains the glyph margins and the line numbers.
    'editorError.foreground': Colors.primary, // Foreground color of error squigglies in the editor.
    'editorError.border': Colors.primary, // Border color of error squigglies in the editor.
    'editorWarning.foreground': Colors.primary, // Foreground color of warning squigglies in the editor.
    'editorWarning.border': Colors.primary, // Border color of warning squigglies in the editor.
    'editorMarkerNavigationError.background': Colors.background, // Editor marker navigation widget error color.
    'editorMarkerNavigationWarning.background': Colors.background, // Editor marker navigation widget warning color.
    'editorMarkerNavigation.background': Colors.background, // Editor marker navigation widget background.
    'editorSuggestWidget.background': Colors.background, // Background color of the suggest widget.
    'editorSuggestWidget.border': Colors.primary, // Border color of the suggest widget.
    'editorSuggestWidget.foreground': Colors.primary, // Foreground color of the suggest widget.
    'editorSuggestWidget.selectedBackground': Colors.background, // Background color of the selected entry in the suggest widget.
    'editorSuggestWidget.highlightForeground': Colors.primary, // Color of the match highlights in the suggest widget.
    'editor.wordHighlightBackground': Colors.background, // Background color of a symbol during read-access, like reading a variable.
    'editor.wordHighlightStrongBackground': Colors.background, // Background color of a symbol during write-access, like writing to a variable.
    'peekViewTitle.background': Colors.background, // Background color of the peek view title area.
    'peekViewTitleLabel.foreground': Colors.primary, // Color of the peek view title.
    'peekViewTitleDescription.foreground': Colors.primary, // Color of the peek view title info.
    'peekView.border': Colors.primary, // Color of the peek view borders and arrow.
    'peekViewResult.background': Colors.primary, // Background color of the peek view result list.
    'peekViewResult.lineForeground': Colors.primary, // Foreground color for line nodes in the peek view result list.
    'peekViewResult.fileForeground': Colors.primary, // Foreground color for file nodes in the peek view result list.
    'peekViewResult.selectionBackground': Colors.primary, // Background color of the selected entry in the peek view result list.
    'peekViewResult.selectionForeground': Colors.primary, // Foreground color of the selected entry in the peek view result list.
    'peekViewEditor.background': Colors.primary, // Background color of the peek view editor.
    'peekViewEditorGutter.background': Colors.primary, // Background color of the gutter in the peek view editor.
    'peekViewResult.matchHighlightBackground': Colors.primary, // Match highlight color in the peek view result list.
    'peekViewEditor.matchHighlightBackground': Colors.primary, // Match highlight color in the peek view editor.
};
