import { IBplusTree, Interval, FlatInterval } from '../../src';
import { addBenchmarkLogsAndRun } from "./Helpers";
import { getOrders, getAlphas } from './Settings';
import { Suite } from "benchmark";


let iterator: number = 0;
let tree: IBplusTree<FlatInterval>;
let searchInts: Array<Interval<FlatInterval>>;

const createTree = (intervals: Array<Interval<FlatInterval>>, order: number, alpha: number):
    [IBplusTree<FlatInterval>, Array<Interval<FlatInterval>>] => {
    const newTree = new IBplusTree(order, alpha);
    const newSearchInts: Array<Interval<FlatInterval>> = [];

    for (let i = 0; i < intervals.length; ++i)
        newTree.insert(intervals[i]);

    for (let i = 2; i < 102; ++i)
        newSearchInts.push(intervals[Math.floor(intervals.length / i)]);

    return [newTree, newSearchInts];
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
            [tree, searchInts] = createTree(dataset, getOrders()[iterator], alpha);
            iterator += 1;
        }
    });
}

const existTest = (dataset: Array<Interval<FlatInterval>>, alpha: number) => {
    iterator = 0;
    let suite = createSuite(dataset, alpha);

    for (const order of getOrders())
        suite = suite.add(`E_o${order}_a${alpha}#test`, () => {
            for (let int of searchInts)
                tree.exists(int);
        });

    addBenchmarkLogsAndRun(suite);
}

const rangeSearchTest = (dataset: Array<Interval<FlatInterval>>, alpha: number) => {
    iterator = 0;
    let suite = createSuite(dataset, alpha);

    for (const order of getOrders())
        suite = suite.add(`RS_o${order}_a${alpha}#test`, () => {
            for (let int of searchInts)
                tree.allRangeSearch(int.getLowerBound(), int.getUpperBound());
        });

    addBenchmarkLogsAndRun(suite);
}

const containedRangeSearchTest = (dataset: Array<Interval<FlatInterval>>, alpha: number) => {
    iterator = 0;
    let suite = createSuite(dataset, alpha);

    for (const order of getOrders())
        suite = suite.add(`CRS_o${order}_a${alpha}#test`, () => {
            for (let int of searchInts)
                tree.containedRangeSearch(int.getLowerBound(), int.getUpperBound());
        });

    addBenchmarkLogsAndRun(suite);
}

export const run = (dataset: Array<Interval<FlatInterval>>) => {
    for (let alpha of getAlphas()) {
        existTest(dataset, alpha);
        rangeSearchTest(dataset, alpha);
        containedRangeSearchTest(dataset, alpha);
    }
};
