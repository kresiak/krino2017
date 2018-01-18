import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Injectable, Inject } from '@angular/core'

@Pipe({ name: 'ggCurrency' })
export class GigaCurrencyPipe implements PipeTransform {
    constructor() { }

    transform(value, currency: string = 'EUR') {

        return (new CurrencyPipe('fr')).transform(value, currency, "symbol", '1.2-2')    //A5
    }
}