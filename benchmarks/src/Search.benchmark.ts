import { IBplusTree, Interval, FlatInterval } from '../../src';
import { addBenchmarkLogsAndRun } from "./Helpers";
import { getOrders, getAlphas } from './Settings';
import { Benchmark, Test } from "kruonis";

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

const existTest = (dataset: Array<Interval<FlatInterval>>, alpha: number) => {
    const benchmark = new Benchmark();

    for (const order of getOrders())
        benchmark.add(
            new Test(`E_o${order}_a${alpha}#test`, () => {
                for (let int of searchInts)
                    tree.exists(int);
            }).on('onBegin', () => {
                [tree, searchInts] = createTree(dataset, order, alpha);
            })
        );

    addBenchmarkLogsAndRun(benchmark);
}

const rangeSearchTest = (dataset: Array<Interval<FlatInterval>>, alpha: number) => {
    const benchmark = new Benchmark();

    for (const order of getOrders())
        benchmark.add(
            new Test(`RS_o${order}_a${alpha}#test`, () => {
                for (let int of searchInts)
                    tree.allRangeSearch(int.getLowerBound(), int.getUpperBound());
            }).on('onBegin', () => {
                [tree, searchInts] = createTree(dataset, order, alpha);
            })
        );

    addBenchmarkLogsAndRun(benchmark);
}

const containedRangeSearchTest = (dataset: Array<Interval<FlatInterval>>, alpha: number) => {
    const benchmark = new Benchmark();

    for (const order of getOrders())
        benchmark.add(
            new Test(`CRS_o${order}_a${alpha}#test`, () => {
                for (let int of searchInts)
                    tree.containedRangeSearch(int.getLowerBound(), int.getUpperBound());
            }).on('onBegin', () => {
                [tree, searchInts] = createTree(dataset, order, alpha);
            })
        );

    addBenchmarkLogsAndRun(benchmark);
}

export const run = (dataset: Array<Interval<FlatInterval>>) => {
    for (let alpha of getAlphas()) {
        existTest(dataset, alpha);
        rangeSearchTest(dataset, alpha);
        containedRangeSearchTest(dataset, alpha);
    }
};
