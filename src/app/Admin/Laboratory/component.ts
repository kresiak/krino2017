import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap'
import { SelectableData } from 'gg-basic-code'
import { DataStore } from 'gg-basic-data-services'
import { AuthenticationStatusInfo, AuthService } from '../../Shared/Services/auth.service'
import { AdminService } from '../../Shared/Services/admin.service'
import { EquipeService } from '../../Shared/Services/equipe.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'

@Component(
    {
        selector: 'gg-admin-labo',
        templateUrl: './component.html'
    }
)

export class AdminLabo {
    public currentLaboName: string
    constructor(private dataStore: DataStore, private authService: AuthService, private adminService: AdminService, private EquipeService: EquipeService,
        private formBuilder: FormBuilder) {
    }

    public selectableUsers: Observable<SelectableData[]>;
    public labo
    public selectedAdminsIdsObservable: Observable<any>;
    public selectedSecrExecIdsObservable: Observable<any>;
    public equipeListObservable
    public deliveryAdresses: any[]
    public sapFirstIdList
    public addAddressForm: FormGroup
    public addFirstIdsForm: FormGroup
    public supplierListObservable
    public categoryListObservable
    public isPageRunning: boolean = true

    ngOnInit(): void {
        this.selectableUsers = this.authService.getSelectableUsers(true);

        this.adminService.getLabo().subscribe(labo => {
            this.labo = labo
            this.selectedAdminsIdsObservable = Observable.from([this.labo.data.adminIds]);
            this.selectedSecrExecIdsObservable = Observable.from([this.labo.data.secrExecIds]);
        })

        this.dataStore.getDataObservable('delivery.address').subscribe(deliveryAdresses => {
            this.deliveryAdresses= deliveryAdresses
        })

        this.equipeListObservable = this.EquipeService.getEquipesForAutocomplete()

        this.dataStore.getLaboObservable().map(theLabo => (theLabo || {}).name).takeWhile(() => this.isPageRunning).subscribe(name => {
            this.currentLaboName= name
        })

        this.supplierListObservable = this.dataStore.getDataObservable('suppliers').takeWhile(() => this.isPageRunning).map(suppliers => suppliers.map(supplier => {
                return {
                    id: supplier._id,
                    name: supplier.name
                }
            }))

        this.categoryListObservable = this.dataStore.getDataObservable('categories').takeWhile(() => this.isPageRunning).map(categories => categories.map(category => {
                return {
                    id: category._id,
                    name: category.name
                }
            }))

        this.addAddressForm = this.formBuilder.group({
            nomAddAddress: ['', [Validators.required]],
            descriptionAddAddress1: ['', [Validators.required]],
            descriptionAddAddress2: ['', [Validators.required]],
            descriptionAddAddress3: [''],
            descriptionAddAddress4: ['']
        });

        this.addFirstIdsForm = this.formBuilder.group({
            nbOfCharacters: ['', [Validators.required]],
            startingWith: ['', [Validators.required]],
            firstId: ['', [Validators.required]]
        });

    }

    saveFirstIds(formValue, isValid) {
        if (!this.labo.data.sapFirstIdList) this.labo.data.sapFirstIdList = []
        this.labo.data.sapFirstIdList.push({
            nbOfCharacters: formValue.nbOfCharacters,
            startingWith: formValue.startingWith,
            firstId: formValue.firstId
        })
        this.saveLabo();
        this.resetAddFirstIdsForm();
    }

    resetAddFirstIdsForm() {
        this.addFirstIdsForm.reset();
    }

    save(formValue, isValid) {
       this.dataStore.addData('delivery.address', {
            nom: formValue.nomAddAddress,
            description1: formValue.descriptionAddAddress1,
            description2: formValue.descriptionAddAddress2,
            description3: formValue.descriptionAddAddress3,
            description4: formValue.descriptionAddAddress4
        }).first().subscribe(res => {
            var x = res;
            this.resetAddAddressForm();
        });
    }

    resetAddAddressForm() {
        this.addAddressForm.reset();
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }


    public saveLabo() {
        if (this.labo.data._id) {
            this.dataStore.updateData('labos', this.labo.data._id, this.labo.data);
        }
        else {
            this.dataStore.addData('labos', this.labo.data)
        }
    }

/*    nameUpdated(name: string) {
        this.labo.data.name = name;
        this.saveLabo()
    }
*/
    headSelectionChanged(selectedIds: string[]) {
        this.labo.data.adminIds = selectedIds;
        this.saveLabo()
    }

    secrExecSelectionChanged(selectedIds: string[]) {
        this.labo.data.secrExecIds = selectedIds;
        this.saveLabo()
    }

    groupedPasswordChanged(groupedPassword: string) {
        this.labo.data.passwordGroupOrdersUser = groupedPassword;
        this.saveLabo()
    }

    public findStepByName(stepName) {
        return this.labo.annotation.validationSteps.filter(s => s.name === stepName)[0]
    }

    public saveSteps() {
        var stepsToSave: any[] = this.labo.annotation.validationSteps.filter(s => s.enabled).map(s => s)
        stepsToSave.forEach(step => {
            delete step.enabled
        });
        this.labo.data.validationSteps = stepsToSave
        this.saveLabo()
    }

    selectStep(isChecked, stepName) {
        var step = this.findStepByName(stepName)
        if (step) {
            step.enabled = isChecked
            this.saveSteps()
        }
    }

    public swapElements(list, x, y) {
        var b = list[y];
        list[y] = list[x];
        list[x] = b;
    }

    stepUp(index) {
        if (index < 1) return
        this.swapElements(this.labo.annotation.validationSteps, index - 1, index)
        this.saveSteps()
    }

    stepDown(index) {
        if (index + 1 >= this.labo.data.validationSteps.length) return
        this.swapElements(this.labo.annotation.validationSteps, index, index + 1)
        this.saveSteps()
    }

    equipeChanged(newid, index) {
        if (!newid) {
            this.labo.annotation.validationSteps[index].equipeId = undefined
            if (this.labo.annotation.validationSteps[index].enabled) {
                this.labo.annotation.validationSteps[index].enabled = false
                this.saveSteps()
            }
            return
        }
        this.labo.annotation.validationSteps[index].equipeId = newid
        if (this.labo.annotation.validationSteps[index].enabled) {
            this.saveSteps()
        }
    }
    
    nomDeliveryUpdated(delivery, nomDelivery) {
        if (nomDelivery.trim() === '') return 
        delivery.nom = nomDelivery;
        this.dataStore.updateData('delivery.address', delivery._id, delivery)       
    }

    description1DeliveryUpdated(delivery, desc1) {
        delivery.description1 = desc1
        this.dataStore.updateData('delivery.address', delivery._id, delivery);
    }

    description2DeliveryUpdated(delivery, desc2) {
        delivery.description2 = desc2
        this.dataStore.updateData('delivery.address', delivery._id, delivery);
    }

    description3DeliveryUpdated(delivery, desc3) {
        delivery.description3 = desc3
        this.dataStore.updateData('delivery.address', delivery._id, delivery);
    }

    description4DeliveryUpdated(delivery, desc4) {
        delivery.description4 = desc4
        this.dataStore.updateData('delivery.address', delivery._id, delivery);
    }

    startOfKrino(krinoStartDate) {
        this.labo.data.krinoStartDate = krinoStartDate;
        this.saveLabo()
    }

    maxOrderAmount(amount) {
        this.labo.data.maxOrderAmount = +amount
        this.saveLabo()
    }

    sapIdMaxIdBeforeKrino(maxId) {
        this.labo.data.sapIdMaxIdBeforeKrino = +maxId
        this.saveLabo()
    }

    sapOtherMaxIdsBeforeKrino(otherMaxId) {
        this.labo.data.sapOtherMaxIdsBeforeKrino = otherMaxId
        this.saveLabo()
    }

    sapDeliveryAddressId(sapId) {
        this.labo.data.sapDeliveryAddressId = sapId
        this.saveLabo()        
    }

    supplierUpdated(supplier: string) {
        this.labo.data.platformSellingSupplierId = supplier
        this.saveLabo()
    }

    categoryUpdated(category: string) {
        this.labo.data.platformSellingCategoryId = category
        this.saveLabo()
    }

    nbOfCharactersUpdated(nbOfCharacters, firstIdItem) {
        firstIdItem.nbOfCharacters = +nbOfCharacters
        this.saveLabo()
    }

    startingWithUpdated(startingWith, firstIdItem) {
        firstIdItem.startingWith = +startingWith
        this.saveLabo()
    }

    firstIdUpdated(firstId, firstIdItem) {
        firstIdItem.firstId = +firstId
        this.saveLabo()
    }

    warningNbMonthsToEndUpdated(nbMonths) {
        this.labo.data.warningNbMonthsToEnd = +nbMonths
        this.saveLabo()
    }

    warningNbRepeatsUpdated(nbRepeats) {
        this.labo.data.warningNbRepeats = +nbRepeats
        this.saveLabo()
    }

    warningNbDaysBetweenRepeatsUpdated(nbDays) {
        this.labo.data.warningNbDaysBetweenRepeats = +nbDays
        this.saveLabo()
    }
}