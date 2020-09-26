import { IBplusTree, FlatInterval } from './../src';
import { expect } from 'chai';
import { readFileSync } from "fs";
import 'mocha';

describe('Bulk testing', () => {

    const dataset: Array<FlatInterval> =
        readFileSync('tests/test_files/test_dataset.csv')
            .toString()
            .split("\n")
            .filter((line: string) => line.length > 0)
            .map((line: string) => line.split(" "))
            .map((vals: string[]) =>
                new FlatInterval(parseInt(vals[0]), parseInt(vals[1]))
            );

    it('Tree traversing', () => {
        const tree: IBplusTree<FlatInterval> = new IBplusTree<FlatInterval>(10, 0);
        for (const entry of dataset)
            tree.insert(entry);
        let rsResult = Array.from(tree.allRangeSearch(-1, 300));

        for (let i = 1; i < rsResult.length; i++)
            expect(rsResult[i - 1].getLowerBound() <= rsResult[i].getLowerBound()).to.be.true;
    });

    it('Bulk Insertion and RangeSearch', () => {
        const tree: IBplusTree<FlatInterval> = new IBplusTree<FlatInterval>(10, 0);
        for (const entry of dataset)
            tree.insert(entry);

        expect(tree.allRangeSearch(-1, 300).size).to.equal(2000);
        for (const int of Array.from(tree.allRangeSearch(30, 80)))
            expect(int.intersect(new FlatInterval(30, 80)));
    });

    it('Bulk Insertion and RangeSearch with TimeSplits', () => {
        const tree: IBplusTree<FlatInterval> = new IBplusTree<FlatInterval>(10, 0.2);
        for (const entry of dataset)
            tree.insert(entry);

        expect(tree.allRangeSearch(-1, 1000).size).to.equal(2000);
        for (const int of Array.from(tree.allRangeSearch(30, 80)))
            expect(int.intersect(new FlatInterval(30, 80)));
    });

    it('Bulk Range Removal', () => {
        const tree: IBplusTree<FlatInterval> = new IBplusTree<FlatInterval>(10, 0);
        for (const entry of dataset)
            tree.insert(entry);

        const deletedIntervals = tree.containedRangeSearch(50, 150);
        tree.rangeDelete(50, 150);
        expect(tree.containedRangeSearch(50, 150).size).to.equal(0);

        for (let int of Array.from(deletedIntervals))
            tree.insert(int);
        expect(tree.containedRangeSearch(50, 150).size).to.equal(deletedIntervals.size);

        tree.rangeDelete(-1, 300);
        expect(tree.allRangeSearch(-1, 300).size).to.equal(0);
    });

    it('Bulk Range Removal with TimeSplits', () => {
        const tree: IBplusTree<FlatInterval> = new IBplusTree<FlatInterval>(10, 0.2);
        for (const entry of dataset)
            tree.insert(entry);

        // Interval [181, 188] was divided into [181, 184] and [185, 188]
        expect(tree.search(181, 188).size).to.be.equal(4);
        // Making sure the compound interval has to be removed
        tree.delete(new FlatInterval(181, 188));
        expect(tree.search(181, 188).size).to.be.equal(3);
        tree.delete(new FlatInterval(181, 188));
        tree.delete(new FlatInterval(181, 188));
        tree.delete(new FlatInterval(181, 188));
        expect(tree.search(181, 188).size).to.be.equal(0);
        const iterator = tree.containedRangeSearch(181, 188).values();
        for (let next = iterator.next(); next.done !== true; next = iterator.next())
            expect(next.value.equals(new FlatInterval(181, 188))).to.be.false;

        const deletedIntervals = tree.containedRangeSearch(50, 150);
        tree.rangeDelete(50, 150);
        expect(tree.containedRangeSearch(50, 150).size).to.equal(0);

        for (let int of Array.from(deletedIntervals))
            tree.insert(int);
        expect(tree.containedRangeSearch(50, 150).size).to.equal(deletedIntervals.size);

        tree.rangeDelete(-1, 300);
        expect(tree.allRangeSearch(-1, 300).size).to.equal(0);
    });
});
