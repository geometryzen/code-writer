import { assert } from './asserts';
import { Range } from './Range';
import { MutableRange } from './MutableRange';

/**
 * A tree that enables ranges in the source document to be mapped to ranges in the target document.
 * The ordering of child nodes is not defined.
 * In many cases the children will be in target order owing to the writing process.
 * TODO: For more efficient searching, children should be sorted in source order.
 */
export class MappingTree {
    /**
     * source is always defined.
     */
    public readonly source: Range;
    /**
     * target is always defined.
     */
    public readonly target: MutableRange;
    /**
     *
     * @param source
     * @param target
     * @param children
     */
    constructor(source: Range, target: MutableRange, public readonly children: MappingTree[]) {
        assert(source, "source must be defined");
        assert(target, "target must be defined");
        this.source = source;
        this.target = target;
    }
    offset(rows: number, cols: number) {
        if (this.target) {
            this.target.offset(rows, cols);
        }
        if (this.children) {
            for (const child of this.children) {
                child.offset(rows, cols);
            }
        }
    }
    mappings(): { source: Range, target: MutableRange }[] {
        if (this.children) {
            const maps: { source: Range, target: MutableRange }[] = [];
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
