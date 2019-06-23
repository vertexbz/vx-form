import * as React from 'react';
import { RefObject, PropsWithChildren, forwardRef, useState, useEffect, useImperativeHandle, useRef, useCallback } from 'react';
import { predicate } from 'vx-std';
import { Provider as ContextProvider } from '../context/context';
import makeContext from '../context/make';
import FormModel from '../model';
import { FormHelpersType, ValidationResultType, FormDataType } from '../type';

type ProviderProps = {
    onSubmit: (data: FormDataType, helpers: FormHelpersType) => void,
    initialValues?: FormDataType,
    onSubmitSuccess?: (response: any, data: FormDataType, helpers: FormHelpersType) => void,
    onSubmitError?: (errorOrValidation: any, data: FormDataType, helpers: FormHelpersType) => void,

    includeInitial?: boolean,
    touchOn?: 'focus' | 'change' | 'blur',
    syncValidateOn?: 'change' | 'blur',
    asyncValidateOn?: 'change' | 'blur',
    treatWarningsLikeErrors?: boolean
};

export type ProviderRefType = {
    submit: () => void,
    reset: () => void,
    checkValidity: () => boolean,
    reportValidity: () => boolean
};

const Provider = ({
    children,
    onSubmit,
    initialValues,
    onSubmitSuccess,
    onSubmitError,
    includeInitial = false,
    touchOn = 'focus',
    syncValidateOn = 'change',
    asyncValidateOn = 'blur',
    treatWarningsLikeErrors = false
}: PropsWithChildren<ProviderProps>, ref: RefObject<ProviderRefType>) => {
    const submitRef = useRef<any>();
    const [context] = useState(() => makeContext(new FormModel(), submitRef));

    const submit = useCallback(() => {
        if (!context.model.isValid()) {
            return Promise.reject();
        }

        context.model.setSubmissionFeedback();
        const helpers = context.model._validationHelpers;
        const values = context.model.getValues();

        context.model.setSubmitting(true);
        return Promise.resolve(onSubmit(values, helpers))
            .then(
                (response) => {
                    onSubmitSuccess && onSubmitSuccess(response, values, helpers);
                    return response;
                },
                (validation: ValidationResultType) => {
                    if (!validation || !predicate.isPlainObject(validation) || !('error' in validation || 'warning' in validation)) {
                        if (process.env.NODE_ENV !== 'production') {
                            // eslint-disable-next-line no-console
                            console.warn('Invalid validation result format!', validation);
                        }
                    } else {
                        context.model.setSubmissionFeedback({
                            warning: validation.warning,
                            error: validation.error
                        });
                    }

                    onSubmitError && onSubmitError(validation, values, helpers);
                    return undefined;
                }
            )
            .then((result) => {
                context.model.setSubmitting(false);
                return result;
            }, (result) => {
                context.model.setSubmitting(false);
                throw result;
            });
    }, []);
    submitRef.current = submit;

    useEffect(() => context.model.setInitial(initialValues || {}), [initialValues]);
    useEffect(() => context.model.setConfig({ includeInitial, touchOn, syncValidateOn, asyncValidateOn, treatWarningsLikeErrors }),
        [includeInitial, touchOn, syncValidateOn, asyncValidateOn, treatWarningsLikeErrors]);

    useImperativeHandle(ref, () => {
        const methods = {
            submit() {
                return submit();
            },
            reset() {
                context.model.reset();
            },
            checkValidity() {
                return context.model.isValid();
            },
            reportValidity() {
                const result = methods.checkValidity();
                // todo touch all present
                return result;
            }
        };
        return (methods);
    });

    return (
        <ContextProvider value={context}>
            {children}
        </ContextProvider>
    );
};

export default forwardRef<ProviderRefType, ProviderProps>(Provider as any);
