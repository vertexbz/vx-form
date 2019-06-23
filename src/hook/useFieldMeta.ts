import { useState } from 'react';
import { useFieldContext } from '../context';

export default (field: string | number) => {
    const { model, useModelEffect, path } = useFieldContext(field);

    const [errors, setErrors] = useState(() => model.getErrors(path));
    const [warnings, setWarnings] = useState(() => model.getWarnings(path));
    const [isAsyncValidating, setIsAsyncValidating] = useState(() => model.isAsyncValidating(path));

    useModelEffect(path, ({ errors, warnings, isAsyncValidating }) => {
        setErrors(errors);
        setWarnings(warnings);
        setIsAsyncValidating(isAsyncValidating);
    }, []);

    return {
        errors,
        warnings,
        isAsyncValidating,
        hasWarnings: warnings.length > 0,
        hasErrors: errors.length > 0
    };
};
