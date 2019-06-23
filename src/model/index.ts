import Multimap from 'multimap';
import { objectmap, array, object, predicate } from 'vx-std';
import { FORM_FEEDBACK, FORM_LISTENER } from '../constant';
import ValidationCache from './cache/validation';

import {
    ValidationResultType,
    FieldDataType,
    FormModelListenerSig,
    DisposerSig,
    FormConfigType,
    ValidatorSig,
    AsyncValidatorSig, FormDataType, FieldModelListenerSig
} from '../type';

const SIDE_EFFECT_FIELDS = [
    'touch',
    'setValue',
    'setInitial',
    'validateSync',
    'validateAsync',
    'removeValidator',
    'setSubmissionFeedback',
    'reset',
    'setSubmitting'
];

export default class FormModel {
    _config: FormConfigType = {
        includeInitial: false,
        touchOn: 'focus', // focus | change | blur
        syncValidateOn: 'change', // change | blur
        asyncValidateOn: 'blur', // change | blur
        treatWarningsLikeErrors: false
    };

    _touched = new Set<string>();
    _current = new Map<string, any>();
    _initial = new Map<string, any>();

    _warning = new Multimap<string | Symbol, string>();
    _error = new Multimap<string | Symbol, string>();
    _submissionWarning = new Multimap<string | Symbol, string>();
    _submissionError = new Multimap<string | Symbol, string>();

    _listeners = new Multimap<string | Symbol, FormModelListenerSig | FieldModelListenerSig>();
    _pendingNotifications = new Set<string | Symbol>();

    _validator = {
        sync: new Multimap<string, ValidatorSig>(),
        async: new Multimap<string, AsyncValidatorSig>()
    };

    _asyncValidation: Array<string> = [];

    _cache = {
        values: {
            valid: false,
            data: undefined
        },
        validator: {
            sync: new ValidationCache(),
            async: new ValidationCache()
        }
    };
    _validationHelpers = {
        getValue: (field: string) => this.getValue(field),
        getValues: () => this.getValues(),
        getErrors: (field: string) => this.getErrors(field),
        getWarnings: (field: string) => this.getWarnings(field)
    };

    _isSubmitting = false;

    constructor() {
        this._addValidationEntry = this._addValidationEntry.bind(this);
        this._deleteValidationEntry = this._deleteValidationEntry.bind(this);

        return new Proxy(this, {
            get<T extends FormModel>(self: T, prop: keyof T) {
                if (typeof self[prop] === 'function') {
                    if (SIDE_EFFECT_FIELDS.includes(prop as string)) {
                        return (...args: any[]) => {
                            // @ts-ignore
                            const result = self[prop].apply(self, args);
                            self._notify();
                            return result;
                        };
                    }

                    // @ts-ignore
                    return self[prop].bind(self);
                }

                return self[prop];
            },
            set() {
                return false;
            }
        }) as FormModel;
    }

    on(field: string | Symbol, listener: FormModelListenerSig | FieldModelListenerSig): DisposerSig {
        this._listeners.set(field, listener);

        return () => {
            this._listeners.delete(field, listener);
        };
    }

    setSubmitting(submitting: boolean) {
        if (this._isSubmitting !== submitting) {
            this._isSubmitting = submitting;
            this._pendingNotifications.add(FORM_FEEDBACK);
        }
    }

    touch(field: string) {
        if (!this._touched.has(field)) {
            this._touched.add(field);

            this._pendingNotifications.add(field);
        }
    }

    setValue(field: string, value: any) {
        if (value !== this._current.get(field)) {
            if (value !== this._initial.get(field)) {
                this._current.set(field, value);
            } else {
                this._current.delete(field);
            }

            this._cache.values.valid = false;
            this._pendingNotifications.add(field);
        }
    }

    setInitial(data: {}, saveOld: boolean = false) {
        const initial = objectmap.fromObject(data);

        for (const [field, value] of this._initial.entries()) {
            if (saveOld && !this._current.has(field) && !(field in initial)) {
                this._cache.values.valid = false;
                this._current.set(field, value);
            } else {
                this._pendingNotifications.add(field);
            }
        }
        this._initial.clear();

        for (const [field, value] of Object.entries(initial)) {
            if (this._current.get(field) === value) {
                this._cache.values.valid = false;
                this._current.delete(field);
            } else {
                this._pendingNotifications.add(field);
            }

            this._initial.set(field, value);
        }
    }

    setConfig(config: FormConfigType) {
        Object.entries(config)
            .filter(([option, value]) => option in this._config && value !== undefined)
            .reduce<FormConfigType>(<C, K extends keyof C>(config: C, data: any) => {
                const [option, value] = data as [K, C[K]];
                config[option] = value;
                return config;
        }, this._config);
    }

    validateSync(field?: string) {
        if (!field) {
            for (const field of this._validator.sync.keys()) {
                this.validateSync(field);
            }
        } else if (this._validator.sync.has(field)) {
            const value = this.getValue(field);
            const cache = this._cache.validator.sync;

            for (const validator of this._validator.sync.get(field) as Array<ValidatorSig>) {
                const result = validator(value, field, this._validationHelpers);

                this._setValidationResult(cache, field, validator, result);
            }
        }
    }

    async validateAsync(field?: string) {
        if (!field) {
            await Promise.all(Array.from(this._validator.async.keys()).map((field) => this.validateAsync(field)));
        } else if (this._validator.async.has(field)) {
            const value = this.getValue(field);
            const cache = this._cache.validator.async;

            this._asyncValidation.push(field);
            await Promise.all(Array.from(this._validator.async.get(field) || [])
                .map((validator: AsyncValidatorSig) => validator(value, field, this._validationHelpers).then((result) => {
                    this._setValidationResult(cache, field, validator, result);
                }))
            );
            array.remove(this._asyncValidation, field);
        }
    }

    getValue(field: string) {
        if (this._current.has(field)) {
            return this._current.get(field);
        }

        return this._initial.get(field);
    }

    getErrors(field: string): string[] {
        if (!this._touched.has(field)) {
            return [];
        }

        return array.uniq(array.copyMerge(this._error.get(field), this._submissionError.get(field)));
    }

    getWarnings(field: string): string[] {
        if (!this._touched.has((field))) {
            return [];
        }

        return array.uniq(array.copyMerge(this._warning.get(field), this._submissionWarning.get(field)));
    }

    getFormErrors(): string[] {
        return array.uniq(array.copyMerge(this._error.get(FORM_FEEDBACK), this._submissionError.get(FORM_FEEDBACK)));
    }

    getFormWarnings(): string[] {
        return array.uniq(array.copyMerge(this._warning.get(FORM_FEEDBACK), this._submissionWarning.get(FORM_FEEDBACK)));
    }

    isAsyncValidating(field?: string) {
        return field ? this._asyncValidation.includes(field) : this._asyncValidation.length > 0;
    }

    getValues(): FormDataType {
        if (this._cache.values.valid) {
            return this._cache.values.data as any;
        }

        const result = {};

        if (this._config.includeInitial) {
            for (const [field, value] of this._initial.entries()) {
                object.setIn(result, field, value);
            }
        }

        for (const [field, value] of this._current.entries()) {
            object.setIn(result, field, value);
        }

        this._cache.values.valid = true;
        this._cache.values.data = result as any;
        return result;
    }

    reset() {
        this._current.clear();
        this.validateSync();
        this._validator.async.forEach((validator, field) => {
            const result = this._cache.validator.async.get(field, validator);
            if (result) {
                this._deleteValidationResult(result);
                this._cache.validator.async.delete(field, validator);
            }
        });
    }

    getFieldData(field: string): FieldDataType {
        return {
            value: this.getValue(field),
            errors: this.getErrors(field),
            warnings: this.getWarnings(field),
            isAsyncValidating: this.isAsyncValidating(field)
        };
    }

    setSubmissionFeedback(result?: ValidationResultType) {
        if (result) {
            const cb = (acc: Multimap<string | Symbol, string>, [field, feedback]: [string | Symbol, string | string[]]) => {
                this._pendingNotifications.add(field);
                ([] as string[]).concat(feedback).forEach((feedback: string) => acc.set(field, feedback));
                return acc;
            };

            if (result.error) {
                // @ts-ignore
                if (result.error[FORM_FEEDBACK]) {
                    // @ts-ignore
                    cb(this._submissionError, [FORM_FEEDBACK, result.error[FORM_FEEDBACK]]);
                }
                Object.entries(result.error).reduce(cb, this._submissionError);
            }
            if (result.warning) {
                // @ts-ignore
                if (result.warning[FORM_FEEDBACK]) {
                    // @ts-ignore
                    cb(this._submissionWarning, [FORM_FEEDBACK, result.warning[FORM_FEEDBACK]]);
                }
                Object.entries(result.warning).reduce(cb, this._submissionWarning);
            }

        } else {
            this._submissionError.clear();
            this._submissionWarning.clear();
        }

        this._pendingNotifications.add(FORM_FEEDBACK);
    }

    _setValidator(field: string, validator: ValidatorSig | AsyncValidatorSig | ValidatorSig[] | AsyncValidatorSig[], cache: ValidationCache, store: Multimap<string | Symbol, ValidatorSig | AsyncValidatorSig>) {
        const validators = ([] as any[]).concat(validator);

        const value = this.getValue(field);
        validators.forEach((validator) => {
            const result = validator(value, field, this._validationHelpers);
            result && this._addValidationResult(result);
            cache.set(field, validator, result);

            store.set(field, validator);
        });

        return () => {
            validators.forEach((validator) => {
                if (cache.has(field, validator)) {
                    this._deleteValidationResult(cache.get(field, validator) as ValidationResultType);
                }
                store.delete(field, validator);
            });
        };
    }

    setValidator(field: string, validator: ValidatorSig | ValidatorSig[]) {
        return this._setValidator(field, validator, this._cache.validator.sync, this._validator.sync);
    }

    setAsyncValidator(field: string, validator: AsyncValidatorSig | AsyncValidatorSig[]) {
        return this._setValidator(field, validator, this._cache.validator.async, this._validator.async);
    }

    isDirty() {
        return this._current.size > 0;
    }

    isValid() {
        if (this._config.treatWarningsLikeErrors) {
            // @ts-ignore
            if (Array.from(this._warning.keys()).some((key) => predicate.isString(key) && this._warning.get(key).length > 0)) {
                return false;
            }
        }
        // @ts-ignore
        return !Array.from(this._error.keys()).some((key) => predicate.isString(key) && this._error.get(key).length > 0);
    }

    getFormData() {
        const errors = this.getFormErrors();
        const warnings = this.getFormWarnings();
        return {
            isSubmitting: this._isSubmitting,
            isDirty: this.isDirty(),
            isValid: this.isValid(),
            hasWarnings: warnings.length > 0,
            hasErrors: errors.length > 0,
            warnings,
            errors,
            isAsyncValidating: this.isAsyncValidating()
        };
    }

    _notify() {
        if (this._pendingNotifications.size > 0) {
            // form
            const listeners = this._listeners.get(FORM_LISTENER) as Iterable<FormModelListenerSig>;

            if (listeners) {
                const data = this.getFormData();
                for (const listener of listeners) {
                    listener(data);
                }
            }
            this._pendingNotifications.delete(FORM_FEEDBACK);
            this._pendingNotifications.delete(FORM_LISTENER);

            // fields
            for (const field of this._pendingNotifications as Set<string>) {
                const listeners = this._listeners.get(field);
                if (listeners) {
                    const data = this.getFieldData(field);
                    for (const listener of listeners) {
                        listener(data);
                    }
                }
            }

            this._pendingNotifications.clear();
        }
    }

    _setValidationResult(cache: ValidationCache, field: string, validator: ValidatorSig | AsyncValidatorSig, result?: ValidationResultType | void) {
        if (cache.has(field, validator)) {
            this._deleteValidationResult(cache.get(field, validator) as ValidationResultType);
        }

        result && this._addValidationResult(result);
        cache.set(field, validator, result);
    }

    _addValidationEntry(acc: Multimap<string | Symbol, string>, [field, value]: [string | Symbol, string | string[]]) {
        ([] as string[]).concat(value).forEach((feedback: string) => acc.set(field, feedback));
        this._pendingNotifications.add(field);
        return acc;
    }

    _addValidationResult({ error, warning }: ValidationResultType) {
        Object.entries(error || {}).reduce(this._addValidationEntry, this._error);
        Object.entries(warning || {}).reduce(this._addValidationEntry, this._warning);
    }

    _deleteValidationEntry(acc: Multimap<string | Symbol, string>, [field, value]: [string | Symbol, string | string[]]) {
        ([] as string[]).concat(value).forEach((feedback: string) => acc.delete(field, feedback));
        this._pendingNotifications.add(field);
        return acc;
    }

    _deleteValidationResult({ error, warning }: ValidationResultType) {
        Object.entries(error || {}).reduce(this._deleteValidationEntry, this._error);
        Object.entries(warning || {}).reduce(this._deleteValidationEntry, this._warning);
    }
}
