import { Pipe, PipeTransform } from '@angular/core';
import * as moment from "moment"

@Pipe({name: 'fullDate'})
export class FullDatePipe implements PipeTransform {
  transform(date, param) {
    if (!moment(date, 'DD/MM/YYYY HH:mm:ss').isValid()) return date
    return moment(date, 'DD/MM/YYYY HH:mm:ss').format('LLLL');    
  }
}