import { IBplusTree, Interval, FlatInterval } from '../../src';
import { addBenchmarkLogsAndRun } from "./Helpers";
import { getOrders, getAlphas } from './Settings';
import { Benchmark, Test } from 'kruonis';

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

const deletionTest = (dataset: Array<Interval<FlatInterval>>, alpha: number) => {
    let benchmark = new Benchmark();

    for (const order of getOrders()) {
        benchmark.add(
            new Test(`D_o${order}_a${alpha}#test`, () => {
                for (let int of delInts)
                    tree.delete(int);
            }).on('onBegin', () => {
                [tree, delInts] = createTree(dataset, order, alpha);
            }).on('onCycleEnd', () => {
                for (let int of delInts)
                    tree.insert(int)
            })
        );
    }

    addBenchmarkLogsAndRun(benchmark);
}

const rangeDeletionTest = (dataset: Array<Interval<FlatInterval>>, alpha: number) => {
    let benchmark = new Benchmark();
    let rangedIntervals;

    for (const order of getOrders()) {
        benchmark.add(
            new Test(`RD_o${order}_a${alpha}#test`, () => {
                for (let int of delInts)
                    tree.rangeDelete(int.getLowerBound(), int.getUpperBound());
            }).on('onBegin', () => {
                [tree, delInts] = createTree(dataset, order, alpha);
                rangedIntervals = delInts.map(int => tree.containedRangeSearch(int.getLowerBound(), int.getUpperBound()));
            }).on('onCycleEnd', () => {
                for (let intervals of rangedIntervals)
                    for (let it = intervals.values(), int = null; int = it.next().value;)
                        tree.insert(int);
            })
        );
    }

    addBenchmarkLogsAndRun(benchmark);
}

const deleteHalfTree = (dataset: Array<Interval<FlatInterval>>, alpha: number) => {
    let benchmark = new Benchmark();
    const ub = dataset.map(int => int.getUpperBound()).reduce((max, el) => max > el ? max : el, 0);
    const lb = dataset.map(int => int.getLowerBound()).reduce((max, el) => max > el ? max : el, 0) / 2;
    let rangedIntervals = tree.containedRangeSearch(lb, ub);

    for (const order of getOrders()) {
        benchmark.add(
            new Test(`DH_o${order}_a${alpha}#test`, () => {
                tree.rangeDelete(lb, ub);
            }).on('onBegin', () => {
                [tree, delInts] = createTree(dataset, order, alpha);
            }).on('onCycleEnd', () => {
                for (let it = rangedIntervals.values(), int = null; int = it.next().value;)
                    tree.insert(int);
            })
        );
    }

    addBenchmarkLogsAndRun(benchmark);
}

export const run = (dataset: Array<Interval<FlatInterval>>) => {
    for (let alpha of getAlphas()) {
        deletionTest(dataset, alpha);
        rangeDeletionTest(dataset, alpha);
        deleteHalfTree(dataset, alpha);
    }
};
