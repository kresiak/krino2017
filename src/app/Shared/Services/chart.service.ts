import { Injectable } from '@angular/core'

@Injectable()
export class ChartService {
    getSpentPieData(spentPercentage: number) {
        var ret = {
            type: 'Pie',
            data: {
                labels: ["available", "spent"]
            }
        }

        if (spentPercentage === 0) {
            ret.data.labels = ["all available"];
            ret.data['series'] = [100];
        }
        else if (spentPercentage === 100) {
            ret.data.labels = ["all spent"];
            ret.data['series'] = [0];
        }
        else {
            ret.data['series'] = [100 - spentPercentage, spentPercentage];
        }

        return ret;
    }
}
