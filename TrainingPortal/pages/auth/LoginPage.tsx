
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, firestore, doc, setDoc, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../../services/firebaseService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../contexts/LanguageContext';

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (e: React.FormEvent) => void;
    isLoading: boolean;
    confirmPassword: string;
    setConfirmPassword: (pw: string) => void;
    error: string;
}> = ({ isOpen, onClose, onConfirm, isLoading, confirmPassword, setConfirmPassword, error }) => {
    const { t } = useLanguage();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <form onSubmit={onConfirm} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('login.confirmRegistration.title')}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('login.confirmRegistration.message')}</p>
                <div className="mt-4">
                     <label htmlFor="confirm-dob" className="sr-only">{t('login.dobLabel')}</label>
                     <input
                        id="confirm-dob"
                        name="confirm-dob"
                        type="date"
                        required
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder={t('login.dobLabel')}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
                {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50">
                        {t('login.confirmRegistration.cancelButton')}
                    </button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-primary-400 flex items-center">
                        {isLoading && <LoadingSpinner size={16} className="mr-2" />}
                        {t('login.confirmRegistration.confirmButton')}
                    </button>
                </div>
            </form>
        </div>
    );
};

const isValidNationalId = (id: string): boolean => {
  if (!id || id.length !== 13 || !/^\d{13}$/.test(id)) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(id.charAt(i), 10) * (13 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(id.charAt(12), 10);
};


const LoginPage: React.FC = () => {
  const [nationalId, setNationalId] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [nationalIdError, setNationalIdError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmDob, setConfirmDob] = useState('');
  const [confirmError, setConfirmError] = useState('');
  
  const validateNationalId = (): boolean => {
    if (!nationalId) {
        setNationalIdError(''); 
        return true; 
    }
    if (nationalId.length !== 13) {
        setNationalIdError(t('login.error.invalidNationalIdFormat'));
        return false;
    }
    if (!isValidNationalId(nationalId)) {
        setNationalIdError(t('login.error.invalidNationalIdChecksum'));
        return false;
    }
    setNationalIdError('');
    return true;
  };

  const handleNationalIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Allow only digits
    if (value.length > 13) return; // Prevent typing more than 13 digits
    setNationalId(value);
    if (nationalIdError) {
        setNationalIdError(''); // Clear error while typing
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate National ID first
    if (!validateNationalId()) {
      return;
    }

    if (!nationalId || !dob) {
      setError(t('login.error.bothRequired'));
      return;
    }
    
    setIsLoading(true);
    setError('');

    const email = `${nationalId}@training-portal.app`;
    const password = dob.replace(/-/g, '');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (signInError: any) {
      if (signInError.code === 'auth/invalid-credential' || signInError.code === 'auth/user-not-found') {
        setIsConfirming(true); // Open confirmation modal for new user
      } else {
        setError(t('login.error.loginError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setConfirmError('');

    if (confirmDob !== dob) {
        setConfirmError(t('login.confirmRegistration.error.mismatch'));
        setIsLoading(false);
        return;
    }

    const email = `${nationalId}@training-portal.app`;
    const password = dob.replace(/-/g, '');

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        
        const userProfile = {
            uid: newUser.uid,
            email: newUser.email,
            role: 'user',
            prefix: '',
            name: '',
            surname: '',
            position: '',
            organization: '',
            address: '',
            district: '',
            amphoe: '',
            province: '',
            education: '',
            phone: '',
            contactEmail: '',
            dob: dob,
        };
        
        await setDoc(doc(firestore, `users/${newUser.uid}`), userProfile);
        setIsConfirming(false);
    } catch (signUpError: any) {
        if (signUpError.code === 'auth/email-already-in-use') {
            setConfirmError(t('login.error.invalidCredentials'));
        } else {
            setConfirmError(t('login.error.signupError'));
        }
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <>
      <ConfirmationModal
        isOpen={isConfirming}
        onClose={() => setIsConfirming(false)}
        onConfirm={handleRegistrationConfirm}
        isLoading={isLoading}
        confirmPassword={confirmDob}
        setConfirmPassword={setConfirmDob}
        error={confirmError}
      />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          <div>
            <img
                className="mx-auto h-12 w-auto"
                src="/img/logo.png"
                alt={t('header.title')}
            />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              {t('login.title')}
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="national-id" className="sr-only">National ID</label>
                <input
                  id="national-id"
                  name="national-id"
                  type="text"
                  required
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:z-10 sm:text-sm ${nationalIdError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'}`}
                  placeholder={t('login.nationalIdPlaceholder')}
                  value={nationalId}
                  onChange={handleNationalIdChange}
                  onBlur={validateNationalId}
                />
              </div>
              <div>
                <label htmlFor="dob" className="sr-only">{t('login.dobLabel')}</label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder={t('login.dobLabel')}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
            </div>
            
            {nationalIdError && <p className="text-red-500 text-sm text-left">{nationalIdError}</p>}
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
              >
                {isLoading ? (
                  <LoadingSpinner size={20} className="text-white" />
                ) : (
                  t('login.button')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default LoginPage;