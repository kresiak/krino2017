

export function softCopy(target, source) {   // returns true if he copies it; otherwise he says: copy it yourself (because it is primitive type)
    if (JSON.stringify(target) === JSON.stringify(source)) return true;

    if (target instanceof Array) {
        if (source instanceof Array) {
            if (target.length === source.length) {
                for (var i = 0; i < target.length; i++) {
                    if (!this.softCopy(target[i], source[i])) {
                        target[i] = clone(source[i])  //if array items  are primitive, I will copy myself
                    }
                }
            }
            else {
                return false // if you are setting the value of an object or array it is Pass by Value 
            }
        }
        else {
            console.log('strange softCopy source not array: ' + JSON.stringify(source))
            return false
        }
        return true
    }
    else if (target instanceof Object) {
        if (source instanceof Object) {
            Object.keys(source).filter(sourcekey => !Object.keys(target).includes(sourcekey)).forEach(key => target[key] = undefined)
            Object.keys(target).filter(sourcekey => !Object.keys(source).includes(sourcekey)).forEach(key => delete target[key])

            Object.keys(target).forEach(propName => {
                if (!this.softCopy(target[propName], source[propName])) {
                    target[propName] = clone(source[propName])  //if properties are primitive, I will copy myself
                }
            })
        }
        else {
            console.log('strange softCopy source not object: ' + JSON.stringify(source))
            return false
        }
        return true
    }
    else {  // primitive type: sorry cannot copy it copy for you because passed by value
        if (target && (source instanceof Object || source instanceof Array)) {   // if target is null or undefined, it is ok that source is of different type
            console.log('strange softCopy source not primitive but is array or object: ' + JSON.stringify(source))
        }
        return false
    }
}

export function clone(source) {
    if (!(source instanceof Array) && !(source instanceof Object)) return source
    return JSON.parse(JSON.stringify(source))
}

export function stripDbInfo(source, otherProperties = []): any {
    var x = clone(source)
    delete x._id
    delete x.createDate
    otherProperties.forEach(prop => delete x[prop])
    return x
}

export function compare(source, target) {
    return JSON.stringify(target) === JSON.stringify(source)
}

// search tools
// ============

export function searchTextIntoOrList(searchString: string): any[] {
    var txt = searchString.toUpperCase()
    var orList = txt.split(' OR ').map(terme => terme.split(' AND ').map(e => e.trim()).filter(e => e != '')).filter(andList => andList && andList.length > 0)
    return orList
}

export function getExplainedOrList(orList, searchText, fn = x => x, fn2 = x => x): string {
    var explainedComplexQuery = orList.reduce((acc, andList) => {
        var andText = andList.reduce((acc2, tokenTxt: string) => {
            var isNot = tokenTxt.startsWith('NOT ')
            var tokenTxtChanged = isNot ? (fn('[ ') + fn('NOT ') + tokenTxt.substr(4) + fn(' ]')) : tokenTxt
            return acc2 + (acc2 ? fn2('AND') : '') + tokenTxtChanged
        }, '')
        var andTextChanged = (andList && andList.length > 1) ? (fn('[ ') + andText + fn(' ]')) : andText
        return acc + (acc ? fn2('OR') : '') + andTextChanged
    }, '')
    if (explainedComplexQuery.trim().toUpperCase() === searchText.trim().toUpperCase()) explainedComplexQuery = ''      // hide it if it doesn't bring any extra info
    return explainedComplexQuery
}

export function testObjectWithOrList(object, orList, fnFilterObjects) {
    if (!orList || orList.length === 0) return fnFilterObjects(object, '')
    return orList.reduce((isOrListOkSoFar, andList: any[]) => {
        if (isOrListOkSoFar) return true
        var isThisOk: boolean = andList.reduce((isAndListOkSoFar, tokenTxt: string) => {
            if (!isAndListOkSoFar) return false
            var isNot = tokenTxt.startsWith('NOT ')
            var txtToSearch = isNot ? tokenTxt.substring(4).trim() : tokenTxt
            var result = fnFilterObjects(object, txtToSearch)
            return isNot ? !result : result
        }, true)
        return isThisOk
    }, false)
}

