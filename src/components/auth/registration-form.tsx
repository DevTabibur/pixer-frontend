import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Routes } from '@/config/routes';
import { useTranslation } from 'next-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from '@/components/ui/link';
import {
  allowedRoles,
  hasAccess,
  setAuthCredentials,
} from '@/utils/auth-utils';
import { Permission } from '@/types';
import { useRegisterMutation } from '@/data/user';
import { toast } from 'react-toastify';

type FormValues = {
  name: string;
  email: string;
  password: string;
  permission: Permission;
  role: "user"
};

const registrationFormSchema = yup.object().shape({
  name: yup.string().required('form:error-name-required'),
  email: yup
    .string()
    .email('form:error-email-format')
    .required('form:error-email-required'),
  password: yup.string().required('form:error-password-required'),
  permission: yup.string().required(), // No need for oneOf, since it's always "user"
  role: yup.string().required(), // Hardcoded, so only need required validation
});

//!====================================================================================>>>
const RegistrationForm = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutate: registerUser, isLoading: loading } = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: yupResolver(registrationFormSchema),
    defaultValues: {
      permission: "user",
      role: "user",
    },
  });
  const router = useRouter();
  const { t } = useTranslation();

  async function onSubmit({ name, email, password }: FormValues) {
    registerUser(
      {
        name,
        email,
        password,
        //@ts-ignore
        permission: "user", // Hardcoded
        role: "user", // Hardcoded
      },
      {
        onSuccess: (data) => {
          // Ensure data exists and there is an accessToken
          if (data?.data && data?.data?.accessToken) {
            toast.success("Registered Successfully!");

            if (hasAccess(allowedRoles, data?.data?.data.role)) {
              setAuthCredentials(
                data?.data?.accessToken,
                data?.data?.data.role,
                data?.data?.data.role
              );

              setTimeout(() => {
                router.push(Routes.dashboard);
              }, 500);

              return;
            } else {
              setErrorMessage('form:error-enough-permission');
            }
          } else {
            setErrorMessage('form:error-credential-wrong');
          }
        },
        onError: (error: any) => {
          console.log('error', error);
          if (error?.response?.data) {
            toast.error(error.response.data.message);
          }

          Object.keys(error?.response?.data).forEach((field: any) => {
            setError(field, {
              type: 'manual',
              message: error?.response?.data[field],
            });
          });
        },
      }
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit(
          //@ts-ignore
          onSubmit,
        )}
        noValidate
      >
        <Input
          label={t('form:input-label-name')}
          {...register('name')}
          variant="outline"
          className="mb-4"
          error={t(errors?.name?.message!)}
        />
        <Input
          label={t('form:input-label-email')}
          {...register('email')}
          type="email"
          variant="outline"
          className="mb-4"
          error={t(errors?.email?.message!)}
        />
        <PasswordInput
          label={t('form:input-label-password')}
          {...register('password')}
          error={t(errors?.password?.message!)}
          variant="outline"
          className="mb-4"
        />
        <Button className="w-full" loading={loading} disabled={loading}>
          {t('form:text-register')}
        </Button>

        {errorMessage ? (
          <Alert
            message={t(errorMessage)}
            variant="error"
            closeable={true}
            className="mt-5"
            onClose={() => setErrorMessage(null)}
          />
        ) : null}
      </form>
      <div className="relative flex flex-col items-center justify-center mt-8 mb-6 text-sm text-heading sm:mt-11 sm:mb-8">
        <hr className="w-full" />
        <span className="start-2/4 -ms-4 absolute -top-2.5 bg-light px-2">
          {t('common:text-or')}
        </span>
      </div>
      <div className="text-sm text-center text-body sm:text-base">
        {t('form:text-already-account')}{' '}
        <Link
          href={Routes.login}
          className="font-semibold underline transition-colors duration-200 ms-1 text-accent hover:text-accent-hover hover:no-underline focus:text-accent-700 focus:no-underline focus:outline-none"
        >
          {t('form:button-label-login')}
        </Link>
      </div>
    </>
  );
};

export default RegistrationForm;
