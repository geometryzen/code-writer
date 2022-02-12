declare class MutablePosition {
    line: number;
    column: number;
    constructor(line: number, column: number);
    offset(rows: number, cols: number): void;
    toString(): string;
}

declare class MutableRange {
    readonly begin: MutablePosition;
    readonly end: MutablePosition;
    /**
     *
     */
    constructor(begin: MutablePosition, end: MutablePosition);
    offset(rows: number, cols: number): void;
    toString(): string;
}

declare class Position {
    /**
     * 1-based line number.
     */
    readonly line: number;
    /**
     * 0-based column index.
     */
    readonly column: number;
    /**
     *
     */
    constructor(line: number, column: number);
    toString(): string;
}
declare function positionComparator(a: Position, b: Position): -1 | 1 | 0;

declare class Range {
    /**
     * begin is always defined.
     */
    readonly begin: Position;
    /**
     * end is always defined.
     */
    readonly end: Position;
    /**
     *
     */
    constructor(begin: Position, end: Position);
    toString(): string;
}

/**
 * A tree that enables ranges in the source document to be mapped to ranges in the target document.
 * The ordering of child nodes is not defined.
 * In many cases the children will be in target order owing to the writing process.
 * TODO: For more efficient searching, children should be sorted in source order.
 */
declare class MappingTree {
    readonly children: MappingTree[];
    /**
     * source is always defined.
     */
    readonly source: Range;
    /**
     * target is always defined.
     */
    readonly target: MutableRange;
    /**
     *
     * @param source
     * @param target
     * @param children
     */
    constructor(source: Range, target: MutableRange, children: MappingTree[]);
    offset(rows: number, cols: number): void;
    mappings(): {
        source: Range;
        target: MutableRange;
    }[];
}

declare enum IndentStyle {
    None = 0,
    Block = 1,
    Smart = 2
}
interface EditorOptions {
    baseIndentSize?: number;
    indentSize?: number;
    tabSize?: number;
    newLineCharacter?: string;
    convertTabsToSpaces?: boolean;
    indentStyle?: IndentStyle;
}
interface FormatCodeOptions extends EditorOptions {
    insertSpaceAfterCommaDelimiter?: boolean;
    insertSpaceAfterSemicolonInForStatements?: boolean;
    insertSpaceBeforeAndAfterBinaryOperators?: boolean;
    insertSpaceAfterConstructor?: boolean;
    insertSpaceAfterKeywordsInControlFlowStatements?: boolean;
    insertSpaceAfterFunctionKeywordForAnonymousFunctions?: boolean;
    insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis?: boolean;
    insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets?: boolean;
    insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces?: boolean;
    insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces?: boolean;
    insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces?: boolean;
    insertSpaceAfterTypeAssertion?: boolean;
    insertSpaceBeforeFunctionParenthesis?: boolean;
    placeOpenBraceOnNewLineForFunctions?: boolean;
    placeOpenBraceOnNewLineForControlBlocks?: boolean;
}
interface TextAndMappings {
    text: string;
    tree: MappingTree;
}
/**
 * A smart buffer for writing TypeScript code.
 */
declare class CodeWriter {
    private options;
    private readonly stack;
    /**
     * Determines the indentation.
     */
    /**
     * Constructs a CodeWriter instance using the specified options.
     */
    constructor(beginLine: number, beginColumn: number, options?: FormatCodeOptions);
    assign(text: '=', source: Range): void;
    /**
     * Writes a name (identifier).
     * @param id The identifier string to be written.
     * @param begin The position of the beginning of the name in the original source.
     * @param end The position of the end of the name in the original source.
     */
    name(id: string, source: Range): void;
    num(text: string, source: Range): void;
    /**
     * Currently defined to be for string literals in unparsed form.
     */
    str(text: string, source: Range): void;
    write(text: string, tree: MappingTree): void;
    snapshot(): TextAndMappings;
    binOp(binOp: '+' | '-' | '*' | '/' | '|' | '^' | '&' | '<<' | '>>' | '%' | '//' | '**', source: Range): void;
    unaryOp(unaryOp: '+' | '-' | '~' | '!', source: Range): void;
    comma(begin: Position | null, end: Position | null): void;
    space(): void;
    beginBlock(): void;
    endBlock(): void;
    beginBracket(): void;
    endBracket(): void;
    beginObject(): void;
    endObject(): void;
    openParen(): void;
    closeParen(): void;
    beginQuote(): void;
    endQuote(): void;
    beginStatement(): void;
    endStatement(): void;
    private prolog;
    private epilog;
}

export { CodeWriter, EditorOptions, FormatCodeOptions, IndentStyle, MappingTree, MutablePosition, MutableRange, Position, Range, TextAndMappings, positionComparator };
