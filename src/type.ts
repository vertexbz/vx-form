export type DisposerSig = () => void;
export type FormDataType = {
    [key: string]: any
};

type ValidationMapType = {
    [key: string]: string
};

export type FormHelpersType = {
    getValue: (field: string) => any,
    getValues: () => {},
    getErrors: (field: string) => string[],
    getWarnings: (field: string) => string[]
};

export type ValidationResultType = {
    error?: ValidationMapType,
    warning?: ValidationMapType
};

export type ValidatorSig = (value: any, field: string, helpers: FormHelpersType) => ValidationResultType | void;
export type AsyncValidatorSig = (value: any, field: string, helpers: FormHelpersType) => Promise<ValidationResultType | void>;

export type ErrorType = 'error' | 'warning';

export type FieldDataType = {
    value: any,
    errors: string[],
    warnings: string[],
    isAsyncValidating: boolean
};

export type FieldModelListenerSig = (listener: FieldDataType) => void;
export type FormModelListenerSig = (listener: FormDataType) => void;

export type FormConfigType = {
    includeInitial: boolean,
    touchOn: 'focus' | 'change' | 'blur',
    syncValidateOn: 'change' | 'blur',
    asyncValidateOn: 'change' | 'blur',
    treatWarningsLikeErrors: boolean
};
