import { Interval, FlatInterval } from './internal'

/**
 * Interval that stores other Intervals.
 * Used to store the original Intervals when data splits occur.
 */
export class CompoundInterval extends Interval {

    private originalInterval: Interval;

    constructor(val1: number, val2: number, originalInterval: Interval) {
        super(val1, val2);
        this.originalInterval = originalInterval;
    }

    /**
     * Get the data that the Interval stored by this Interval stores.
     */
    getData(): any {
        return this.originalInterval.getData();
    }

    /**
     * Set the data that the Interval stored by this Interval stores.
     * @param data the new data value
     */
    setData(data: any) {
        this.originalInterval.setData(data)
    }

    equals(int: Interval): boolean {
        return this.upperBound == int.getUpperBound() &&
            this.lowerBound == int.getLowerBound() &&
            this.originalInterval.getData() == int.getData();
    }

    getOriginalInterval(): FlatInterval {
        return this.originalInterval.getOriginalInterval();
    }

}