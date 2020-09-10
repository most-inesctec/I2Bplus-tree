import argparse
import re
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd
import os

'''Script to plot the benchmarks data'''

SAVING_DIR = ''
args = None


def parse_args():
    '''Parse the command line arguments'''
    ap = argparse.ArgumentParser(description='Plot the benchmarks data')

    ap.add_argument('-i', '--input', type=str,
                    default='../results/logs.csv', help='Input file containing the logs')
    ap.add_argument('-o', '--output', type=str,
                    default='../plots', help='Output directory for the plots')
    ap.add_argument('-tt', '--test_types', nargs='+',
                    default=['I', 'T', 'E', 'RS', 'CRS', 'D', 'RD', 'DH'])
    ap.add_argument('-tg', '--test_groups', nargs='+',
                    default=[])
    # Check if alpha tests are run
    ap.add_argument('--at', dest='at', action='store_true',
                    help='Flag indicating that the alpha tests run')
    ap.add_argument('--no-at', dest='at', action='store_false',
                    help='Flag indicating that the alpha tests do not run')
    ap.set_defaults(at=True)
    # Check if order tests are run
    ap.add_argument('--ot', dest='ot', action='store_true',
                    help='Flag indicating that the order tests run')
    ap.add_argument('--no-ot', dest='ot', action='store_false',
                    help='Flag indicating that the order tests do not run')
    ap.set_defaults(ot=True)
    # Check if the big-O alpha tests run
    ap.add_argument('--bat', dest='bat', action='store_true',
                    help='Flag indicating that the big-O alpha tests run')
    ap.add_argument('--no-bat', dest='bat', action='store_false',
                    help='Flag indicating that the big-O alpha tests do not run')
    ap.set_defaults(bat=True)
    # Check if the big-O alpha tests run
    ap.add_argument('--bot', dest='bot', action='store_true',
                    help='Flag indicating that the big-O order tests run')
    ap.add_argument('--no-bot', dest='bot', action='store_false',
                    help='Flag indicating that the big-O order tests do not run')
    ap.set_defaults(bot=True)
    # Moving average period for ratios
    ap.add_argument('-ma', '--moving_avg', type=int,
                    default=3, help='The moving average period for plotting the ratios trend.')
    return ap.parse_args()


def print_datasets(datasets: dict) -> None:
    for size, dataset in datasets.items():
        print(size)
        for name, time in dataset.items():
            print('\t' + name + ': ' + str(time))


def getParameterDomain(parameter: str, dataset: dict) -> dict:
    """Get the possible values for a given parameter ('o' or 'a')"""
    results = re.findall(
        re.compile(
            parameter + r"(.[\d.]*)"
        ), str(dataset)
    )

    # Dictionary first to avoid duplicates
    return sorted(list({match for match in results}))


def extract(regex: str, data: dict) -> (list, list):
    """Extracts data from one dataset according to the given regex.
    Returns a pair (domain, values).
    The 1st capturing group of the regex must be the varying parameter
    and the second the value."""
    results = re.findall(re.compile(regex), str(data))
    domain = []
    values = []

    for match in results:
        domain.append(float(match[0]))
        values.append(float(match[1]))

    return (domain, values)


def extract_all(regex: str, data: dict) -> (list, list):
    """Extracts data from all the datasets according to the given regex.
    Returns a pair (domain, values), where domain will be the dataset's size.
    Assumes regex only gets one element per dataset.
    The 1st caputring group of the regex must be the value."""
    domain = []
    values = []

    for length, dataset in data.items():
        domain.append(length)
        values.append(
            float(re.findall(
                re.compile(regex), str(dataset)
            )[0])
        )

    return (domain, values)


def get_lists_moving_avg(lists: list, period: int) -> list:
    """Get the moving average from the given lists.
    Notice that all lists must have the same size."""
    num_lists = len(lists)
    avgs = [sum(vals)/num_lists for vals in zip(*lists)]

    if period > len(avgs):
        raise Exception(
            "Period can not be bigger than moving average list size.")

    return [sum(avgs[i-period:i]) / period
            for i in range(period, len(avgs) + 1)]


def create_plot(title: str, xlabel: str, ylabel: str, domain: list, *data):
    """Creates and Saves a 'Spagetti plot' with the given title, horizontal
    label, vertical label, domain and functions (name and values) presented
    in the data array. Plot saved to constant SAVING_DIR/plot_name"""
    agg_data = {'x': domain}
    agg_data.update({fn[0]: fn[1]
                     for fn
                     in data})
    df = pd.DataFrame(agg_data)

    plt.clf()

    # Hardcoded to print ratios
    col_name = df.columns[1]
    if col_name[0:5] == "I2B_T" or col_name[0:6] == "I2B_DH":
        new_title = "Ratio " + title
        sns.set_palette(["#0D4F91", "#187F0D", "#421474"])
        is_o_plot = "dataset o" in title

        # Reference line
        plt.axhline(y=1, linewidth=1, color='red', alpha=1)

        # First ratio
        n1 = "Ratio " + col_name[4:]
        df[n1] = df.iloc[:, 1] / df.iloc[:, 2]
        plt.plot(df['x'], df[n1], marker='.',
                 linewidth=1, alpha=0.3 if is_o_plot else 1, label=n1)

        # Second ratio
        n2 = "Ratio " + df.columns[3][4:]
        df[n2] = df.iloc[:, 3] / df.iloc[:, 4]
        plt.plot(df['x'], df[n2], marker='.',
                 linewidth=1, alpha=0.3 if is_o_plot else 1, label=n2)

        # Third ratio
        if not is_o_plot:
            n3 = "Ratio " + df.columns[5][4:]
            df[n3] = df.iloc[:, 5] / df.iloc[:, 6]
            plt.plot(df['x'], df[n3], marker='.',
                     linewidth=1, alpha=1, label=n3)

        # Trend line
        if is_o_plot:
            trend = get_lists_moving_avg(
                [df[n1].values, df[n2].values], args.moving_avg)
            plt.plot(df['x'][args.moving_avg-1:], trend, marker='', linewidth=1,
                     alpha=1, color='black', label="Ratios trend line")
        df = df.drop(n1, axis=1)
        df = df.drop(n2, axis=1)
        if not is_o_plot:
            df = df.drop(n3, axis=1)

        plt.legend(loc=4, ncol=2)
        plt.title(new_title, loc='left',
                  fontsize=12, fontweight=0, color='black')
        plt.xlabel(xlabel)
        plt.ylabel(ylabel)

        if not os.path.exists(SAVING_DIR):
            os.makedirs(SAVING_DIR)

        plt.savefig(SAVING_DIR + '/' + new_title + '.png')
        plt.clf()

    # sns.set_palette("RdYlBu", len(data))
    sns.set_palette(["#0D4F91", "#8EAFC9", "#187F0D",
                     "#91C763", "#421474", "#AA8CB8"])

    # multiple line plot
    for column in df.drop('x', axis=1):
        if str(column[0:2]) == "I2":
            plt.plot(df['x'], df[column], marker='.',
                     linewidth=1, alpha=1, label=column)
        else:
            plt.plot(df['x'], df[column], marker='p',
                     linewidth=1, alpha=1, label=column)

    plt.legend(loc=4, ncol=2)
    plt.title(title, loc='left',
              fontsize=12, fontweight=0, color='black')
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)
    plt.gca().set_ylim(bottom=0)

    if not os.path.exists(SAVING_DIR):
        os.makedirs(SAVING_DIR)
    plt.savefig(SAVING_DIR + '/' + title + '.png')


def create_plot_parameter(title: str,
                          xlabel: str,
                          ylabel: str,
                          regexes: (str, str),
                          name: str,
                          parameter_domain: list,
                          dataset: dict,
                          test_groups: [str],
                          ext_all=False):
    """Creates all possible functions according to a given
    parameter and the plot domain. Then it calls the create_plot
    with the adequate parameters."""
    functions = []
    var_domain = None

    if len(test_groups) > 0:
        for val in parameter_domain:
            for group in test_groups:  # For testing different type of datasets
                regex = group + regexes[0] + val + regexes[1]

                # 1st iteration
                if var_domain == None:
                    var_domain = extract_all(regex, dataset)[0]\
                        if ext_all else extract(regex, dataset)[0]

                functions.append((
                    group + name + val,
                    extract_all(regex, dataset)[1]
                    if ext_all else extract(regex, dataset)[1]
                ))
    else:
        for val in parameter_domain:
            regex = regexes[0] + val + regexes[1]

            # 1st iteration
            if var_domain == None:
                var_domain = extract_all(regex, dataset)[0]\
                    if ext_all else extract(regex, dataset)[0]

            functions.append((
                name + val,
                extract_all(regex, dataset)[1]
                if ext_all else extract(regex, dataset)[1]
            ))

    create_plot(title, xlabel, ylabel, var_domain, *functions)


def extract_datasets(input_file: str):
    """extract datasets from the given input files"""
    datasets = {}
    with open(input_file, 'r') as file:
        curr_dataset = {}
        curr_name = 0

        for line in file:
            data = line.strip().split(' ')

            if len(data) == 2:
                curr_dataset[data[0]] = float(data[1])

            elif len(data) == 1:
                if not curr_name == 0:
                    datasets[curr_name] = curr_dataset

                curr_name = int(data[0])
                curr_dataset = {}

            else:
                raise Exception('Tryng to parse unexpected data.')

        # Adding dataset that was processed when file ended
        datasets[curr_name] = curr_dataset
    return datasets


if __name__ == "__main__":
    args = parse_args()
    sns.set()
    SAVING_DIR = args.output

    datasets = extract_datasets(args.input)

    first_key = next(iter(datasets))
    orders = getParameterDomain('o', datasets[first_key])
    alphas = getParameterDomain('a', datasets[first_key])

    for test in args.test_types:
        if args.at:
            for name, dataset in datasets.items():
                create_plot_parameter("%s %s var alpha" % (str(name), test),
                                      "alpha",
                                      "time (ms)",
                                      ("%s_o" % test,
                                       r"_a(.[\d.]*)#test': (.[\d.]*)"),
                                      '%s o' % test,
                                      orders,
                                      dataset,
                                      args.test_groups)

        if args.ot:
            for name, dataset in datasets.items():
                create_plot_parameter("%s %s var order" % (str(name), test),
                                      "order",
                                      "time (ms)",
                                      (test + r"_o(.\d*)_a",
                                       r"#test': (.[\d.]*)"),
                                      '%s a' % test,
                                      alphas,
                                      dataset,
                                      args.test_groups)

        if args.bat:
            for alpha in alphas:
                create_plot_parameter("%s var dataset a%s" % (test, alpha),
                                      "dataset size",
                                      "time (ms)",
                                      ("%s_o" % test, "_a%s" % alpha +
                                       r"#test': (.[\d.]*)"),
                                      '%s a%so' % (test, alpha),
                                      orders,
                                      datasets,
                                      args.test_groups,
                                      True)

        if args.bot:
            for order in orders:
                create_plot_parameter("%s var dataset o%s" % (test, order),
                                      "dataset size",
                                      "time (ms)",
                                      ("%s_o%s_a" % (test, order),
                                       r"#test': (.[\d.]*)"),
                                      '%s o%s a' % (test, order),
                                      alphas,
                                      datasets,
                                      args.test_groups,
                                      True)

# Example usage:
# python plotter.py -i ../reunion-results/bi-both.csv -o ../bi-plots -tt I T D RD DH -tg 'I2B_' 'IB_' --no-at --no-ot
