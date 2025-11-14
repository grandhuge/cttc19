
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { firestore, doc, updateDoc } from '../../services/firebaseService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../App';

const prefixOptions = [
    { key: 'mr', value: 'Mr.' },
    { key: 'mrs', value: 'Mrs.' },
    { key: 'ms', value: 'Ms.' },
    { key: 'dr', value: 'Dr.' },
];

const provinceOptions = [
    { key: 'krabi', value: 'Krabi' }, { key: 'chumphon', value: 'Chumphon' }, { key: 'trang', value: 'Trang' }, 
    { key: 'nakhonsithammarat', value: 'Nakhon Si Thammarat' }, { key: 'narathiwat', value: 'Narathiwat' }, { key: 'pattani', value: 'Pattani' },
    { key: 'phangnga', value: 'Phang Nga' }, { key: 'phatthalung', value: 'Phatthalung' }, { key: 'phuket', value: 'Phuket' }, 
    { key: 'yala', value: 'Yala' }, { key: 'ranong', value: 'Ranong' }, { key: 'songkhla', value: 'Songkhla' }, 
    { key: 'satun', value: 'Satun' }, { key: 'suratthani', value: 'Surat Thani' }
];

const educationOptions = [
    { key: 'primary', value: 'Primary School' }, { key: 'secondary', value: 'Secondary School' }, 
    { key: 'vocational', value: 'Vocational Certificate' }, { key: 'higherVocational', value: 'Higher Vocational Certificate' },
    { key: 'bachelors', value: "Bachelor's Degree" }, { key: 'masters', value: "Master's Degree" }
];

const ProfilePage: React.FC = () => {
  const { userProfile, currentUser, setUserProfile: setProfileInContext } = useAuthContext();
  const { t } = useLanguage();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    prefix: '', name: '', surname: '', position: '',
    organization: '', address: '', district: '', amphoe: '', province: '', education: '', phone: '', contactEmail: ''
  });
  
  const [otherPrefix, setOtherPrefix] = useState('');
  const [otherProvince, setOtherProvince] = useState('');
  const [otherEducation, setOtherEducation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (userProfile) {
      const setInitialSelectValue = (
        field: keyof typeof formData, 
        options: { key: string, value: string }[], 
        setOtherState: React.Dispatch<React.SetStateAction<string>>
      ) => {
        const value = userProfile[field as keyof typeof userProfile] || '';
        // Check if the stored value is a custom "Other" value
        if (value && !options.some(opt => opt.key === value || opt.value === value)) {
          setOtherState(value);
          return 'Other';
        }
        setOtherState('');
        return value;
      };

      setFormData({
        prefix: setInitialSelectValue('prefix', prefixOptions, setOtherPrefix),
        name: userProfile.name || '',
        surname: userProfile.surname || '',
        position: userProfile.position || '',
        organization: userProfile.organization || '',
        address: userProfile.address || '',
        district: userProfile.district || '',
        amphoe: userProfile.amphoe || '',
        province: setInitialSelectValue('province', provinceOptions, setOtherProvince),
        education: setInitialSelectValue('education', educationOptions, setOtherEducation),
        phone: userProfile.phone || '',
        contactEmail: userProfile.contactEmail || '',
      });
    }
  }, [userProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (value !== 'Other') {
        if (name === 'prefix') setOtherPrefix('');
        if (name === 'province') setOtherProvince('');
        if (name === 'education') setOtherEducation('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const finalProvince = formData.province === 'Other' ? otherProvince : formData.province;

    if (!formData.position || !formData.name || !formData.surname || !formData.address || !formData.district || !formData.amphoe || !formData.organization || !finalProvince) {
      showNotification(t('profile.error.requiredFields'), 'error');
      return;
    }

    setIsLoading(true);

    const dataToSave = {
        ...formData,
        prefix: formData.prefix === 'Other' ? otherPrefix : formData.prefix,
        province: finalProvince,
        education: formData.education === 'Other' ? otherEducation : formData.education,
    };

    try {
      const userDocRef = doc(firestore, `users/${currentUser.uid}`);
      const updatedProfile = { ...userProfile, ...dataToSave } as any;
      
      await updateDoc(userDocRef, dataToSave);
      setProfileInContext(updatedProfile);
      showNotification(t('profile.success'), 'success');
      navigate('/');

    } catch (error) {
      console.error("Error updating profile: ", error);
      showNotification(t('profile.error.updateFailed'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm";
  const otherInputClass = `${inputClass} mt-2`;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('profile.title')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('profile.updateMessage')}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.prefix')}</label>
              <select name="prefix" value={formData.prefix} onChange={handleChange} className={inputClass}>
                <option value="">{t('profile.select')}</option>
                {prefixOptions.map(opt => <option key={opt.key} value={opt.key}>{t(`prefix.${opt.key}`)}</option>)}
                <option value="Other">{t('profile.other')}</option>
              </select>
              {formData.prefix === 'Other' && (
                <input type="text" value={otherPrefix} onChange={(e) => setOtherPrefix(e.target.value)} className={otherInputClass} placeholder={t('profile.otherPlaceholder')} />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.name')} <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.surname')} <span className="text-red-500">*</span></label>
              <input type="text" name="surname" value={formData.surname} onChange={handleChange} className={inputClass} required />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.position')} <span className="text-red-500">*</span></label>
              <input type="text" name="position" value={formData.position} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.organization')} <span className="text-red-500">*</span></label>
              <input type="text" name="organization" value={formData.organization} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.address')} <span className="text-red-500">*</span></label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.district')} <span className="text-red-500">*</span></label>
              <input type="text" name="district" value={formData.district} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.amphoe')} <span className="text-red-500">*</span></label>
              <input type="text" name="amphoe" value={formData.amphoe} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.province')} <span className="text-red-500">*</span></label>
              <select name="province" value={formData.province} onChange={handleChange} className={inputClass} required>
                 <option value="">{t('profile.select')}</option>
                 {provinceOptions.map(opt => <option key={opt.key} value={opt.value}>{t(`province.${opt.key}`)}</option>)}
                 <option value="Other">{t('profile.other')}</option>
              </select>
              {formData.province === 'Other' && (
                  <input type="text" value={otherProvince} onChange={(e) => setOtherProvince(e.target.value)} className={otherInputClass} placeholder={t('profile.otherPlaceholder')} required />
              )}
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.education')}</label>
               <select name="education" value={formData.education} onChange={handleChange} className={inputClass}>
                 <option value="">{t('profile.select')}</option>
                 {educationOptions.map(opt => <option key={opt.key} value={opt.value}>{t(`education.${opt.key}`)}</option>)}
                 <option value="Other">{t('profile.other')}</option>
               </select>
               {formData.education === 'Other' && (
                  <input type="text" value={otherEducation} onChange={(e) => setOtherEducation(e.target.value)} className={otherInputClass} placeholder={t('profile.otherPlaceholder')} />
               )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.phone')}</label>
              <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className={inputClass} />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.contactEmail')}</label>
              <input type="email" name="contactEmail" value={formData.contactEmail || ''} onChange={handleChange} className={inputClass} />
            </div>
          </div>
          <div className="pt-5 text-right">
             <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400"
            >
              {isLoading ? <LoadingSpinner size={20} /> : t('profile.saveButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
