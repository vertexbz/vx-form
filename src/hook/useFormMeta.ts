import * as React from 'react';
import { useFormContext } from '../context';

const usedProps = [
    'hasWarnings',
    'hasErrors',
    'warnings',
    'errors',
    'isAsyncValidating',
    'isSubmitting',
    'isDirty',
    'isValid'
];

type CopiedData<T, U> = {
    [K in keyof T & keyof U]: T[K] | U[K];
};

const copyData = <T, U>(data: T, baseResult: U): CopiedData<T, U> => {
    let result;

    for (const key of usedProps) {
        // @ts-ignore
        if (baseResult[key] !== data[key]) {
            if (!result) {
                result = { ...baseResult };
            }

            // @ts-ignore
            result[key] = data[key];
        }
    }

    return result || baseResult;
};

export default () => {
    const { model, helper, useModelEffect } = useFormContext();

    const [data, setData] = React.useState(() => model.getFormData());

    useModelEffect((newData) => {
        const result = copyData(newData, data);
        if (result !== data) {
            // @ts-ignore
            setData(result);
        }
    });

    return copyData(data, {
        submit: helper.submit,
        reset: helper.reset
    });
};
