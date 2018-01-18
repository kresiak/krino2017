import * as utilsDate from './dates'

/*export function getOtpBudget(otp) {
    let currentBudget: number
    if (otp.budgetPeriods) {
        var x = otp.budgetPeriods.filter(budget => utilsDate.isDateIntervalCompatibleWithNow(budget.datStart, budget.datEnd))[0]
        currentBudget = x ? x.budget : 0
    }
    else {
        currentBudget = 0
    }

    return currentBudget
}*/

function retnum(str) {
    var num = (str.match(/\d+/) || [])[0];
    return num;
}

export function getNumberInString(txt: string): number {
    if (txt.toUpperCase() === 'pc') return 1
    return retnum(txt) || 1
}

