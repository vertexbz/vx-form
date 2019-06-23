import { path } from 'vx-std';
import FormModel from '../model';
import { useContext } from './context';

import { UseModelEffectSig, FieldHelperType } from './make';

type FieldContextType = {
    model: FormModel,
    useModelEffect: UseModelEffectSig,
    helper: FieldHelperType,
    path: string
};

export default (field: string | number): FieldContextType => {
    const context = useContext();

    return {
        model: context.model,
        useModelEffect: context.helper.useModelEffect,
        helper: context.helper.field,
        path: path.concat(context.name, path.stringifyItem(field))
    };
};
