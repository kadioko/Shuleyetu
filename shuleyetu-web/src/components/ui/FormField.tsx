'use client';

import React, { useState, useEffect } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  min?: number;
  max?: number;
  custom?: (value: string) => string | null;
}

interface ValidationMessage {
  type: 'error' | 'warning' | 'success';
  message: string;
}

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'textarea';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
  validation?: ValidationRule;
  showValidationIcon?: boolean;
  className?: string;
  helperText?: string;
  autoComplete?: string;
}

export function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  value = '',
  onChange,
  onBlur,
  validation,
  showValidationIcon = true,
  className = '',
  helperText,
  autoComplete,
}: FormFieldProps) {
  const [fieldValue, setFieldValue] = useState(value);
  const [validationMessage, setValidationMessage] = useState<ValidationMessage | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    setFieldValue(value);
  }, [value]);

  const validateField = (val: string): ValidationMessage | null => {
    if (!validation) return null;

    // Required validation
    if (validation.required && (!val || val.trim() === '')) {
      return { type: 'error', message: `${label} is required` };
    }

    // Skip other validations if field is empty and not required
    if (!val || val.trim() === '') return null;

    // Email validation
    if (validation.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        return { type: 'error', message: 'Please enter a valid email address' };
      }
    }

    // Phone validation (Tanzanian format)
    if (validation.phone) {
      const phoneRegex = /^\+?\d{10,15}$/;
      if (!phoneRegex.test(val.replace(/\s/g, ''))) {
        return { type: 'error', message: 'Please enter a valid phone number' };
      }
    }

    // Pattern validation
    if (validation.pattern && !validation.pattern.test(val)) {
      return { type: 'error', message: `Invalid format` };
    }

    // Length validation
    if (validation.minLength && val.length < validation.minLength) {
      return { 
        type: 'error', 
        message: `Must be at least ${validation.minLength} characters` 
      };
    }

    if (validation.maxLength && val.length > validation.maxLength) {
      return { 
        type: 'error', 
        message: `Must be no more than ${validation.maxLength} characters` 
      };
    }

    // Number validation
    if (type === 'number') {
      const num = parseFloat(val);
      if (isNaN(num)) {
        return { type: 'error', message: 'Please enter a valid number' };
      }
      
      if (validation.min !== undefined && num < validation.min) {
        return { type: 'error', message: `Must be at least ${validation.min}` };
      }
      
      if (validation.max !== undefined && num > validation.max) {
        return { type: 'error', message: `Must be no more than ${validation.max}` };
      }
    }

    // Custom validation
    if (validation.custom) {
      const customResult = validation.custom(val);
      if (customResult) {
        return { type: 'error', message: customResult };
      }
    }

    return { type: 'success', message: 'Looks good!' };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setFieldValue(newValue);
    
    if (onChange) {
      onChange(newValue);
    }

    // Real-time validation
    if (validation) {
      setIsValidating(true);
      const result = validateField(newValue);
      setValidationMessage(result);
      setIsValidating(false);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    if (onBlur) {
      onBlur(newValue);
    }

    // Validate on blur
    if (validation) {
      const result = validateField(newValue);
      setValidationMessage(result);
    }
  };

  const getValidationIcon = () => {
    if (!showValidationIcon || !validationMessage) return null;
    
    if (validationMessage.type === 'error') {
      return (
        <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    if (validationMessage.type === 'success') {
      return (
        <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    return null;
  };

  const getFieldClasses = () => {
    const baseClasses = 'w-full rounded-lg border bg-slate-950 px-4 py-3 text-sm text-slate-50 placeholder-slate-500 outline-none transition-colors focus:ring-1';
    
    let borderClasses = 'border-slate-700 focus:border-sky-500 focus:ring-sky-500/20';
    
    if (validationMessage) {
      if (validationMessage.type === 'error') {
        borderClasses = 'border-red-500 focus:border-red-500 focus:ring-red-500/20';
      } else if (validationMessage.type === 'success') {
        borderClasses = 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20';
      }
    }
    
    return `${baseClasses} ${borderClasses} ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`;
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {type === 'textarea' ? (
          <textarea
            name={name}
            value={fieldValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={getFieldClasses()}
            rows={4}
            autoComplete={autoComplete}
          />
        ) : (
          <input
            name={name}
            type={type}
            value={fieldValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={getFieldClasses()}
            autoComplete={autoComplete}
          />
        )}
        
        {showValidationIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValidating ? (
              <svg className="h-4 w-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              getValidationIcon()
            )}
          </div>
        )}
      </div>
      
      {/* Validation message */}
      {validationMessage && (
        <p className={`text-xs ${
          validationMessage.type === 'error' 
            ? 'text-red-400' 
            : validationMessage.type === 'success'
            ? 'text-emerald-400'
            : 'text-amber-400'
        }`}>
          {validationMessage.message}
        </p>
      )}
      
      {/* Helper text */}
      {helperText && !validationMessage && (
        <p className="text-xs text-slate-400">{helperText}</p>
      )}
    </div>
  );
}

// Pre-configured validation rules
export const ValidationRules = {
  required: { required: true },
  email: { required: true, email: true },
  phone: { required: true, phone: true },
  name: { required: true, minLength: 2, maxLength: 50 },
  password: { required: true, minLength: 8 },
  optionalEmail: { email: true },
  optionalPhone: { phone: true },
  tanzanianPhone: { 
    required: true, 
    phone: true,
    custom: (value: string) => {
      const cleanPhone = value.replace(/\s/g, '');
      if (!cleanPhone.startsWith('+255') && !cleanPhone.startsWith('0')) {
        return 'Phone number must start with +255 or 0';
      }
      return null;
    }
  },
};
