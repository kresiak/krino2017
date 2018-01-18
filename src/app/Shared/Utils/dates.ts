import * as moment from "moment"

export function isDateIntervalCompatibleWithNow(datStart: string, datEnd: string) {
    var now = moment()
    var d1 = moment(datStart, 'DD/MM/YYYY HH:mm:ss').startOf('day')
    var d2 = moment(datEnd, 'DD/MM/YYYY HH:mm:ss').add(1, 'day').startOf('day')
    return d1 && d2 && d1.isSameOrBefore(now) && now.isBefore(d2) 
}

export function isDateAfterNow(datEnd: string) {
    var now = moment()
    var d2 = moment(datEnd, 'DD/MM/YYYY HH:mm:ss').add(1, 'day').startOf('day')
    return d2 && now.isBefore(d2) 
}


export function nowFormated() {
    return moment().format('DD/MM/YYYY HH:mm:ss')
}

export function getMomentDateFromFormated(dat: string) {
    return moment(dat, 'DD/MM/YYYY HH:mm:ss')
}

export function formatLongDate(date) {
    if (!moment(date, 'DD/MM/YYYY HH:mm:ss').isValid()) return date
    return moment(date, 'DD/MM/YYYY HH:mm:ss').format('LLLL');        
}

export function formatShortDate(date) {
    if (!moment(date, 'DD/MM/YYYY HH:mm:ss').isValid()) return date
    return moment(date, 'DD/MM/YYYY HH:mm:ss').format('LL');        
}

export function getSortFn(fn, flgIncreasing: boolean= false) {
    var facteur: number= flgIncreasing ? -1 : 1
    return (a, b)  => {            
        var d1 = moment(fn(a), 'DD/MM/YYYY HH:mm:ss').toDate()
        var d2 = moment(fn(b), 'DD/MM/YYYY HH:mm:ss').toDate()
        return (d1 > d2 ? -1  : 1) * facteur          }  
}
