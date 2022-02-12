(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.CodeWriter = {}));
})(this, (function (exports) { 'use strict';

    class MutablePosition {
        constructor(line, column) {
            this.line = line;
            this.column = column;
            // TODO
        }
        offset(rows, cols) {
            this.line += rows;
            this.column += cols;
        }
        toString() {
            return `[${this.line}, ${this.column}]`;
        }
    }

    /**
     * We're looking for something that is truthy, not just true.
     */
    function assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    class MutableRange {
        /**
         *
         */
        constructor(begin, end) {
            this.begin = begin;
            this.end = end;
            assert(begin, "begin must be defined");
            assert(end, "end must be defined");
            this.begin = begin;
            this.end = end;
        }
        offset(rows, cols) {
            this.begin.offset(rows, cols);
            this.end.offset(rows, cols);
        }
        toString() {
            return `${this.begin} to ${this.end}`;
        }
    }

    class Position {
        /**
         *
         */
        constructor(line, column) {
            this.line = line;
            this.column = column;
        }
        toString() {
            return `[${this.line}, ${this.column}]`;
        }
    }
    function positionComparator(a, b) {
        if (a.line < b.line) {
            return -1;
        }
        else if (a.line > b.line) {
            return 1;
        }
        else {
            if (a.column < b.column) {
                return -1;
            }
            else if (a.column > b.column) {
                return 1;
            }
            else {
                return 0;
            }
        }
    }

    class Range {
        /**
         *
         */
        constructor(begin, end) {
            assert(begin, "begin must be defined");
            assert(end, "end must be defined");
            this.begin = begin;
            this.end = end;
        }
        toString() {
            return `${this.begin} to ${this.end}`;
        }
    }

    /**
     * A tree that enables ranges in the source document to be mapped to ranges in the target document.
     * The ordering of child nodes is not defined.
     * In many cases the children will be in target order owing to the writing process.
     * TODO: For more efficient searching, children should be sorted in source order.
     */
    class MappingTree {
        /**
         *
         * @param source
         * @param target
         * @param children
         */
        constructor(source, target, children) {
            this.children = children;
            assert(source, "source must be defined");
            assert(target, "target must be defined");
            this.source = source;
            this.target = target;
        }
        offset(rows, cols) {
            if (this.target) {
                this.target.offset(rows, cols);
            }
            if (this.children) {
                for (const child of this.children) {
                    child.offset(rows, cols);
                }
            }
        }
        mappings() {
            if (this.children) {
                const maps = [];
                for (const child of this.children) {
                    for (const map of child.mappings()) {
                        maps.push(map);
                    }
                }
                return maps;
            }
            else {
                return [{ source: this.source, target: this.target }];
            }
        }
    }

    exports.IndentStyle = void 0;
    (function (IndentStyle) {
        IndentStyle[IndentStyle["None"] = 0] = "None";
        IndentStyle[IndentStyle["Block"] = 1] = "Block";
        IndentStyle[IndentStyle["Smart"] = 2] = "Smart";
    })(exports.IndentStyle || (exports.IndentStyle = {}));
    class StackElement {
        constructor(bMark, eMark, targetBeginLine, targetBeginColumn) {
            this.bMark = bMark;
            this.eMark = eMark;
            this.texts = [];
            this.trees = [];
            this.cursor = new MutablePosition(targetBeginLine, targetBeginColumn);
        }
        /**
         *
         */
        write(text, tree) {
            assert(typeof text === 'string', "text must be a string");
            this.texts.push(text);
            this.trees.push(tree);
            const cursor = this.cursor;
            const beginLine = cursor.line;
            const beginColumn = cursor.column;
            const endLine = cursor.line;
            const endColumn = beginColumn + text.length;
            if (tree) {
                tree.target.begin.line = beginLine;
                tree.target.begin.column = beginColumn;
                tree.target.end.line = endLine;
                tree.target.end.column = endColumn;
            }
            cursor.line = endLine;
            cursor.column = endColumn;
        }
        snapshot() {
            const texts = this.texts;
            const trees = this.trees;
            const N = texts.length;
            if (N === 0) {
                return this.package('', null);
            }
            else {
                let sBL = Number.MAX_SAFE_INTEGER;
                let sBC = Number.MAX_SAFE_INTEGER;
                let sEL = Number.MIN_SAFE_INTEGER;
                let sEC = Number.MIN_SAFE_INTEGER;
                let tBL = Number.MAX_SAFE_INTEGER;
                let tBC = Number.MAX_SAFE_INTEGER;
                let tEL = Number.MIN_SAFE_INTEGER;
                let tEC = Number.MIN_SAFE_INTEGER;
                const children = [];
                for (let i = 0; i < N; i++) {
                    const tree = trees[i];
                    if (tree) {
                        sBL = Math.min(sBL, tree.source.begin.line);
                        sBC = Math.min(sBC, tree.source.begin.column);
                        sEL = Math.max(sEL, tree.source.end.line);
                        sEC = Math.max(sEC, tree.source.end.column);
                        tBL = Math.min(tBL, tree.target.begin.line);
                        tBC = Math.min(tBC, tree.target.begin.column);
                        tEL = Math.max(tEL, tree.target.end.line);
                        tEC = Math.max(tEC, tree.target.end.column);
                        children.push(tree);
                    }
                }
                const text = texts.join("");
                if (children.length > 1) {
                    const source = new Range(new Position(sBL, sBC), new Position(sEL, sEC));
                    const target = new MutableRange(new MutablePosition(tBL, tBC), new MutablePosition(tEL, tEC));
                    return this.package(text, new MappingTree(source, target, children));
                }
                else if (children.length === 1) {
                    return this.package(text, children[0]);
                }
                else {
                    return this.package(text, null);
                }
            }
        }
        package(text, tree) {
            return { text, tree, targetEndLine: this.cursor.line, targetEndColumn: this.cursor.column };
        }
        getLine() {
            return this.cursor.line;
        }
        getColumn() {
            return this.cursor.column;
        }
    }
    function IDXLAST(xs) {
        return xs.length - 1;
    }
    /**
     *
     */
    class Stack {
        constructor(begin, end, targetLine, targetColumn) {
            this.elements = [];
            this.elements.push(new StackElement(begin, end, targetLine, targetColumn));
        }
        get length() {
            return this.elements.length;
        }
        push(element) {
            this.elements.push(element);
        }
        pop() {
            return this.elements.pop();
        }
        write(text, tree) {
            this.elements[IDXLAST(this.elements)].write(text, tree);
        }
        dispose() {
            assert(this.elements.length === 1, "stack length should be 1");
            const textAndMappings = this.elements[IDXLAST(this.elements)].snapshot();
            this.pop();
            assert(this.elements.length === 0, "stack length should be 0");
            return textAndMappings;
        }
        getLine() {
            return this.elements[IDXLAST(this.elements)].getLine();
        }
        getColumn() {
            return this.elements[IDXLAST(this.elements)].getColumn();
        }
    }
    /**
     * A smart buffer for writing TypeScript code.
     */
    class CodeWriter {
        /**
         * Determines the indentation.
         */
        // private indentLevel = 0;
        /**
         * Constructs a CodeWriter instance using the specified options.
         */
        constructor(beginLine, beginColumn, options = {}) {
            this.options = options;
            this.stack = new Stack('', '', beginLine, beginColumn);
        }
        assign(text, source) {
            const target = new MutableRange(new MutablePosition(-3, -3), new MutablePosition(-3, -3));
            const tree = new MappingTree(source, target, null);
            this.stack.write(text, tree);
        }
        /**
         * Writes a name (identifier).
         * @param id The identifier string to be written.
         * @param begin The position of the beginning of the name in the original source.
         * @param end The position of the end of the name in the original source.
         */
        name(id, source) {
            if (source) {
                const target = new MutableRange(new MutablePosition(-2, -2), new MutablePosition(-2, -2));
                const tree = new MappingTree(source, target, null);
                this.stack.write(id, tree);
            }
            else {
                this.stack.write(id, null);
            }
        }
        num(text, source) {
            if (source) {
                const target = new MutableRange(new MutablePosition(-3, -3), new MutablePosition(-3, -3));
                const tree = new MappingTree(source, target, null);
                this.stack.write(text, tree);
            }
            else {
                this.stack.write(text, null);
            }
        }
        /**
         * Currently defined to be for string literals in unparsed form.
         */
        str(text, source) {
            if (source) {
                const target = new MutableRange(new MutablePosition(-23, -23), new MutablePosition(-23, -23));
                const tree = new MappingTree(source, target, null);
                this.stack.write(text, tree);
            }
            else {
                this.stack.write(text, null);
            }
        }
        write(text, tree) {
            this.stack.write(text, tree);
        }
        snapshot() {
            assert(this.stack.length === 1, "stack length is not zero");
            return this.stack.dispose();
        }
        binOp(binOp, source) {
            const target = new MutableRange(new MutablePosition(-5, -5), new MutablePosition(-5, -5));
            const tree = new MappingTree(source, target, null);
            if (this.options.insertSpaceBeforeAndAfterBinaryOperators) {
                this.space();
                this.stack.write(binOp, tree);
                this.space();
            }
            else {
                this.stack.write(binOp, tree);
            }
        }
        unaryOp(unaryOp, source) {
            const target = new MutableRange(new MutablePosition(-5, -5), new MutablePosition(-5, -5));
            const tree = new MappingTree(source, target, null);
            this.stack.write(unaryOp, tree);
        }
        comma(begin, end) {
            if (begin && end) {
                const source = new Range(begin, end);
                const target = new MutableRange(new MutablePosition(-4, -4), new MutablePosition(-4, -4));
                const tree = new MappingTree(source, target, null);
                this.stack.write(',', tree);
            }
            else {
                this.stack.write(',', null);
            }
            if (this.options.insertSpaceAfterCommaDelimiter) {
                this.stack.write(' ', null);
            }
        }
        space() {
            this.stack.write(' ', null);
        }
        beginBlock() {
            this.prolog('{', '}');
        }
        endBlock() {
            this.epilog(false);
        }
        beginBracket() {
            this.prolog('[', ']');
        }
        endBracket() {
            this.epilog(this.options.insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets);
        }
        beginObject() {
            this.prolog('{', '}');
        }
        endObject() {
            this.epilog(this.options.insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces);
        }
        openParen() {
            this.prolog('(', ')');
        }
        closeParen() {
            this.epilog(this.options.insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis);
        }
        beginQuote() {
            this.prolog("'", "'");
        }
        endQuote() {
            this.epilog(false);
        }
        beginStatement() {
            this.prolog('', ';');
        }
        endStatement() {
            this.epilog(false);
        }
        prolog(bMark, eMark) {
            const line = this.stack.getLine();
            const column = this.stack.getColumn();
            this.stack.push(new StackElement(bMark, eMark, line, column));
        }
        epilog(insertSpaceAfterOpeningAndBeforeClosingNonempty) {
            const popped = this.stack.pop();
            const textAndMappings = popped.snapshot();
            const text = textAndMappings.text;
            const tree = textAndMappings.tree;
            // This is where we would be
            // const line = textAndMappings.targetEndLine;
            // const column = textAndMappings.targetEndColumn;
            if (text.length > 0 && insertSpaceAfterOpeningAndBeforeClosingNonempty) {
                this.write(popped.bMark, null);
                this.space();
                const rows = 0;
                const cols = popped.bMark.length + 1;
                if (tree) {
                    tree.offset(rows, cols);
                }
                this.write(text, tree);
                this.space();
                this.write(popped.eMark, null);
            }
            else {
                this.write(popped.bMark, null);
                const rows = 0;
                const cols = popped.bMark.length;
                if (tree) {
                    tree.offset(rows, cols);
                }
                this.write(text, tree);
                this.write(popped.eMark, null);
            }
        }
    }

    exports.CodeWriter = CodeWriter;
    exports.MappingTree = MappingTree;
    exports.MutablePosition = MutablePosition;
    exports.MutableRange = MutableRange;
    exports.Position = Position;
    exports.Range = Range;
    exports.positionComparator = positionComparator;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.js.map
