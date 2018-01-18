import { Angular5Csv } from 'angular5-csv/Angular5-csv';

export function generateReport(data) {

    var options = {
        fieldSeparator: ';',
        quoteStrings: '"',
        decimalseparator: '.',
        showLabels: true,
        showTitle: false,
        useBom: true
    };

    new Angular5Csv(data, 'Krino report', options);
}