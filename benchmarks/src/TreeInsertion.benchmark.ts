import { IBplusTree, Interval, FlatInterval } from '../../src';
import { addBenchmarkLogsAndRun } from "./Helpers";
import { getOrders, getAlphas } from './Settings';
import { Benchmark, Test } from '../kruonis';


let tree: IBplusTree<FlatInterval>;

const insertAllInts = (intervals: Array<Interval<FlatInterval>>, order: number, alpha: number) => {
    tree = new IBplusTree(order, alpha);

    for (let int of intervals)
        tree.insert(int);
};

const treeInsertionTest = (dataset: Array<Interval<FlatInterval>>, alpha: number) => {
    let benchmark = new Benchmark();

    for (let order of getOrders())
        benchmark.add(new Test(`T_o${order}_a${alpha}#test`, () => {
            insertAllInts(dataset, order, alpha);
        }));

    addBenchmarkLogsAndRun(benchmark);
};

export const run = (dataset: Array<Interval<FlatInterval>>) => {
    for (let alpha of getAlphas())
        treeInsertionTest(dataset, alpha);
};