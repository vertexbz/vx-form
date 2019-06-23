import * as React from 'react';
import { useFieldContext } from '../context';
import { AsyncValidatorSig, ValidatorSig } from '../type';

export default (field: string | number) => {
    const { model, path } = useFieldContext(field);

    return {
        setValidator: (validator: ValidatorSig | ValidatorSig[]) => {
            React.useEffect(() => validator && model.setValidator(path, validator), Array.isArray(validator) ? validator : [validator]);
        },
        setAsyncValidator: (validator: AsyncValidatorSig | AsyncValidatorSig[]) => {
            React.useEffect(() => validator && model.setAsyncValidator(path, validator), Array.isArray(validator) ? validator : [validator]);
        },
        validate: () => model.validateSync(path),
        validateAsync: () => model.validateAsync(path)
    };
};
