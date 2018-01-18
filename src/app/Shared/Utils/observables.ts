
export function hashMapFactory(list) {
    return hashMapFactoryHelper(list, element => element._id)
}

export function hashMapFactoryForAnnotated(list) {
    return hashMapFactoryHelper(list, element => element.data._id)
}

export function hashMapFactoryHelper(list, fnIdSelector) {
    return list.reduce((map, element) => {
        map.set(fnIdSelector(element), element)
        return map
    }, new Map())
}

export function hashMapFactoryCurry(fnIdSelector) {
    return function (list) {
        return list.reduce((map, element) => {
            map.set(fnIdSelector(element), element)
            return map
        }, new Map())
    }
}    

export function hashMapToArrayFactoryHelper(list, fnIdSelector) {
    return list.reduce((map: Map<string, any>, element) => {
        var id= fnIdSelector(element)
        if (!map.has(id)) map.set(id, [])
        map.get(id).push(element)
        return map
    }, new Map())
}

