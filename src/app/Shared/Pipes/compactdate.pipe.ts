import { Pipe, PipeTransform } from '@angular/core';
import * as moment from "moment"

@Pipe({name: 'compactDate'})
export class CompactDatePipe implements PipeTransform {
  transform(date, param) {
    if (!moment(date, 'DD/MM/YYYY HH:mm:ss').isValid()) return date
    return moment(date, 'DD/MM/YYYY HH:mm:ss').format('l');    
  }
}