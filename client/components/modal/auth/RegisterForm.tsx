import { InputField } from '@client/components/form/InputField';
import { PasswordStrengthIndicator } from '@client/components/form/PasswordStrengthIndicator';
import { registerSchema } from '@shared/validation/authValidationSchema';
import React, { FormEventHandler } from 'react';
import { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';
import { z } from 'zod';

export type IRegisterForm = z.infer<typeof registerSchema>;

interface IRegisterFormProps {
  onSubmit: FormEventHandler<HTMLFormElement>;
  register: UseFormRegister<IRegisterForm>;
  errors: FieldErrors<IRegisterForm>;
  watch: UseFormWatch<IRegisterForm>;
}

export const RegisterForm: React.FC<IRegisterFormProps> = ({
  onSubmit,
  register,
  errors,
  watch,
}) => {
  const password = watch('password') || '';
  const passwordConfirmation = watch('passwordConfirmation') || '';
  const passwordsMatch =
    password.length > 0 && passwordConfirmation.length > 0 && password === passwordConfirmation;

  return (
    <form onSubmit={onSubmit} className="flex flex-col space-y-5">
      <p className="text-center text-muted-foreground text-sm mb-1">
        Create an account to continue
      </p>
      <InputField
        {...register('email')}
        type="email"
        placeholder="Email address"
        className="w-full"
        error={errors.email?.message}
      />
      <div>
        <InputField
          {...register('password')}
          type="password"
          placeholder="Password"
          className="w-full"
          error={errors.password?.message}
          success={passwordsMatch && !errors.password}
        />
        <PasswordStrengthIndicator password={password} />
      </div>
      <InputField
        {...register('passwordConfirmation')}
        type="password"
        placeholder="Confirm Password"
        className="w-full"
        error={errors.passwordConfirmation?.message}
        success={passwordsMatch && !errors.passwordConfirmation}
      />
      <div className="flex flex-col space-y-2">
        <label className="flex items-start gap-2 cursor-pointer group">
          <input
            {...register('agreeToTerms')}
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border bg-surface text-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 cursor-pointer"
          />
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            I agree to the{' '}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hover underline"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hover underline"
            >
              Privacy Policy
            </a>
          </span>
        </label>
        {errors.agreeToTerms && (
          <span className="text-sm text-error font-medium">{errors.agreeToTerms.message}</span>
        )}
      </div>
      <button
        type="submit"
        className="w-full px-4 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 active:scale-[0.98] mt-2 glow-blue"
      >
        Create Account
      </button>
    </form>
  );
};
