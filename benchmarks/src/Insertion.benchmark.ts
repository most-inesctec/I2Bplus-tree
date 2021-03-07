import { IBplusTree, Interval, FlatInterval } from '../../src';
import { addBenchmarkLogsAndRun } from "./Helpers";
import { getOrders, getAlphas } from './Settings';
import { Benchmark, Test } from 'kruonis';

const createTree = (intervals: Array<Interval<FlatInterval>>, order: number, alpha: number):
    [IBplusTree<FlatInterval>, Array<Interval<FlatInterval>>] => {
    let tree = new IBplusTree(order, alpha);
    let insInts: Array<Interval<FlatInterval>> = [];
    let divider: number = Math.floor(intervals.length / 100);

    for (let i = 0; i < intervals.length; ++i) {
        if (!(i % divider))
            insInts.push(intervals[i]);
        else
            tree.insert(intervals[i]);
    }

    return [tree, insInts];
};

const insertionTest = (dataset: Array<Interval<FlatInterval>>, alpha: number) => {
    let tree: IBplusTree<FlatInterval>;
    let insInts: Array<Interval<FlatInterval>>;

    let benchmark = new Benchmark();

    for (const order of getOrders()) {
        benchmark.add(
            new Test(`I_o${order}_a${alpha}#test`, () => {
                for (let int of insInts)
                    tree.insert(int);
            }).on('onBegin', () => {
                [tree, insInts] = createTree(dataset, order, alpha);
            }).on('onCycleEnd', () => {
                for (let int of insInts)
                    tree.delete(int);
            })
        );
    }

    addBenchmarkLogsAndRun(benchmark);
};

export const run = (dataset: Array<Interval<FlatInterval>>) => {
    for (const alpha of getAlphas())
        insertionTest(dataset, alpha);
};