import { useEffect, RefObject } from 'react';
import FormModel from '../model';
import { FormModelListenerSig } from '../type';

export type UseModelEffectSig = (field: string | Symbol, listener: FormModelListenerSig, inputs?: any[]) => void;

export type FieldHelperType = {
    focus: (field: string) => void,
    change: (field: string, value: any) => void,
    blur: (field: string) => void
};

export type FormHelperType = {
    submit: () => Promise<any>,
    reset: () => void
};

export type ContextType = {
    model: FormModel,
    helper: {
        useModelEffect: UseModelEffectSig,
        field: FieldHelperType,
        form: FormHelperType
    },
    name: string
};

export default (model: FormModel, submitRef: RefObject<() => Promise<any>>) => ({
    model,
    name: '',
    helper: {
        useModelEffect: (field: string | Symbol, listener: FormModelListenerSig, inputs?: any[]) => {
            useEffect(() => model.on(field, listener), inputs);
        },
        field: {
            focus(field: string) {
                if (model._config.touchOn === 'focus') {
                    model.touch(field);
                }
            },
            change(field: string, value: any) {
                if (model._config.touchOn === 'change') {
                    model.touch(field);
                }
                model.setValue(field, value);
                if (model._config.syncValidateOn === 'change') {
                    model.validateSync(field);
                }
                if (model._config.asyncValidateOn === 'change') {
                    model.validateAsync(field);
                }
            },
            blur(field: string) {
                if (model._config.touchOn === 'blur') {
                    model.touch(field);
                }
                if (model._config.syncValidateOn === 'blur') {
                    model.validateSync(field);
                }
                if (model._config.asyncValidateOn === 'blur') {
                    model.validateAsync(field);
                }
            }
        },
        form: {
            submit: () => submitRef.current ? submitRef.current() : Promise.reject(),
            reset: () => model.reset()
        }
    }
});
