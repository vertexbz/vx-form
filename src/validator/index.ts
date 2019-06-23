import { TemplateString } from 'vx-std';
import { ErrorType, ValidatorSig } from '../type';

export const required = (type: ErrorType = 'error'): ValidatorSig => {
    return (value: any, field: string) => {
        if (!value) {
            return { [type]: { [field]: 'Field cannot be empty!' } };
        }
    };
};

export const differentThan = (values: Array<any>, message?: string, type: ErrorType = 'error'): ValidatorSig => {
    return (value: any, field: string) => {
        if (values.includes(value)) {
            return {
                [type]: {
                    [field]: new TemplateString(message || 'Field must be different from {{values}}!', { values: values.join(', ') })
                }
            };
        }
    };
};

export const oneOf = (values: Array<any>, message?: string, type: ErrorType = 'error'): ValidatorSig => {
    return (value: any, field: string) => {
        if (!values.includes(value)) {
            return {
                [type]: {
                    [field]: new TemplateString(message || 'Field must be one of {{values}}!', { values: values.join(', ') })
                }
            };
        }
    };
};

export const sameAs = (secondField: string, fieldName?: string, type: ErrorType = 'error'): ValidatorSig => {
    return (value: any, field: string, { getValue }) => {
        if (value !== getValue(secondField)) {
            const message = new TemplateString('Field must match value of {{field}}!', { field: fieldName || secondField });

            return {
                [type]: {
                    [field]: message
                }
            };
        }
    };
};
