import { appendFileSync } from "fs";
import { getOutputPath } from './Settings';
import { Benchmark, Test } from 'kruonis';

const prettyStats = (test: Test) => {
    console.log(`${test.name} (${test.getStats().count} cycles):\n` +
        ` * Mean: ${test.getStats().mean}ms\n` +
        ` * Standard Deviation: ${test.getStats().std}ms\n`);
}

const logToFile = (test: Test) => {
    appendFileSync(getOutputPath(),
        `${test.name} ${test.getStats().mean}\n`);
}

export const addBenchmarkLogsAndRun = (benchmark: Benchmark) => {
    // add listeners
    benchmark
        .on('onTestEnd', (benchmark: Benchmark, result: Test) => {
            prettyStats(result);
            logToFile(result);
        }).run();
}