export class SelectableData
{
    id: string;
    name: string;
    isBlocked: boolean;

    constructor(id: string, name: string, isBlocked: boolean= false)
    {
        this.id= id;
        this.name= name;
        this.isBlocked= isBlocked
    };

}