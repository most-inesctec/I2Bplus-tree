import { FlatInterval } from "./FlatInterval";

/**
 * Class to implement a numeric interval [a, b].
 * Using an abstract class to implement the Composite design pattern.
 */
export abstract class Interval {

    /**
     * This interval's lower bound
     */
    protected lowerBound: number;

    /**
     * This interval's lower bound
     */
    protected upperBound: number;

    constructor(val1: number, val2: number) {
        if (val1 <= val2) {
            this.lowerBound = val1;
            this.upperBound = val2;
        } else {
            this.upperBound = val2;
            this.lowerBound = val1;
        }
    }

    /**
     * Get this node's lower bound
     */
    getLowerBound(): number {
        return this.lowerBound;
    }

    /**
     * Get this node's upper bound
     */
    getUpperBound(): number {
        return this.upperBound;
    }

    abstract getData(): any;

    abstract setData(data: any);

    /**
     * If this interval is bigger than the one given return positive,
     * if inferior negative and equal return zero.
     * 
     * @param int The interval to compare with
     */
    sort(int: Interval): number {
        return this.upperBound - int.getLowerBound()
    }

    /**
     * Checks if two interval intersect each other and returns true upon intersection, false otherwise.
     * 
     * @param int The interval to check intersection
     */
    intersect(int: Interval): boolean {
        return !(int.getLowerBound() > this.upperBound ||
            int.getUpperBound() < this.lowerBound);
    }

    /**
     * Compares two intervals and returns true upon equality, false otherwise.
     * 
     * @param int the interval to compare with
     */
    abstract equals(int: Interval): boolean;

    /**
     * Returns true if this interval contains the given interval, false otherwise.
     * 
     * @param int the interval that might be contained
     */
    contains(int: Interval): boolean {
        return this.upperBound >= int.getUpperBound() &&
            this.lowerBound <= int.getLowerBound();
    }

    abstract getOriginalInterval(): FlatInterval;
}