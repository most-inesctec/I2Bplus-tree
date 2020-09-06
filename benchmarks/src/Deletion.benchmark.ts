import { IBplusTree, Interval, FlatInterval } from '../../src';
import { addBenchmarkLogsAndRun } from "./Helpers";
import { getOrders, getAlphas } from './Settings';
import { Suite } from "benchmark";


let iterator: number = 0;
let tree: IBplusTree<FlatInterval>;
let delInts: Array<Interval<FlatInterval>>;


const createTree = (intervals: Array<Interval<FlatInterval>>, order: number, alpha: number):
    [IBplusTree<FlatInterval>, Array<Interval<FlatInterval>>] => {
    const newTree = new IBplusTree(order, alpha);
    const newDelInts: Array<Interval<FlatInterval>> = [];
    let divider: number = Math.floor(intervals.length / 100);

    for (let i = 0; i < intervals.length; ++i) {
        newTree.insert(intervals[i]);

        if (!(i % divider))
            newDelInts.push(intervals[i]);
    }

    return [newTree, newDelInts];
};

/**
 * Create the test suite for a generic test
 * 
 * @param dataset The dataset used in the suite
 * @returns the created suite
 */
const createSuite = (dataset: Array<Interval<FlatInterval>>, alpha: number): Suite => {
    return (new Suite).on('start cycle', function (event) {
        if (getOrders()[iterator]) {
            [tree, delInts] = createTree(dataset, getOrders()[iterator], alpha);
            iterator += 1;
        }
    });
}

const deletionTest = (dataset: Array<Interval<FlatInterval>>, alpha: number) => {
    iterator = 0;
    let suite = createSuite(dataset, alpha);

    for (const order of getOrders())
        suite = suite.add(`D_o${order}_a${alpha}#test`, () => {
            for (let int of delInts)
                tree.delete(int);

            for (let int of delInts)
                tree.insert(int);
        });

    addBenchmarkLogsAndRun(suite);
}

const rangeDeletionTest = (dataset: Array<Interval<FlatInterval>>, alpha: number) => {
    iterator = 0;
    let suite = createSuite(dataset, alpha);
    let rangedIntervals = delInts.map(int => tree.containedRangeSearch(int.getLowerBound(), int.getUpperBound()));

    for (const order of getOrders())
        suite = suite.add(`RD_o${order}_a${alpha}#test`, () => {
            for (let int of delInts)
                tree.rangeDelete(int.getLowerBound(), int.getUpperBound());

            for (let intervals of rangedIntervals)
                for (let it = intervals.values(), int = null; int = it.next().value;)
                    tree.insert(int);
        });

    addBenchmarkLogsAndRun(suite);
}

const deleteHalfTree = (dataset: Array<Interval<FlatInterval>>, alpha: number) => {
    iterator = 0;
    let suite = createSuite(dataset, alpha);
    const ub = dataset.map(int => int.getUpperBound()).reduce((max, el) => max > el ? max : el, 0);
    const lb = dataset.map(int => int.getLowerBound()).reduce((max, el) => max > el ? max : el, 0) / 2;
    let rangedIntervals = tree.containedRangeSearch(lb, ub);

    for (const order of getOrders())
        suite = suite.add(`DH_o${order}_a${alpha}#test`, () => {
            tree.rangeDelete(lb, ub);

            for (let it = rangedIntervals.values(), int = null; int = it.next().value;)
                tree.insert(int);
        });

    addBenchmarkLogsAndRun(suite);
}

export const run = (dataset: Array<Interval<FlatInterval>>) => {
    for (let alpha of getAlphas()) {
        deletionTest(dataset, alpha);
        rangeDeletionTest(dataset, alpha);
        deleteHalfTree(dataset, alpha);
    }
};
