
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { firestore, getDocs, collection, doc, updateDoc } from '../../services/firebaseService';
import { UserProfile } from '../../types';
import { useAuthContext } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../App';
import LoadingSpinner, { FullPageLoader } from '../../components/common/LoadingSpinner';

const UserManagementPage: React.FC = () => {
    const { userProfile } = useAuthContext();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { showNotification } = useNotification();

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (userProfile?.role !== 'admin') {
            navigate('/admin');
            return;
        }

        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                const usersSnapshot = await getDocs(collection(firestore, 'users'));
                const usersData = (usersSnapshot as any).docs.map((doc: any) => doc.data() as UserProfile);
                setUsers(usersData);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [userProfile, navigate]);

    const handleRoleChange = async (userId: string, newRole: 'user' | 'sub-admin' | 'admin') => {
        setSavingStates(prev => ({ ...prev, [userId]: true }));
        try {
            const userDocRef = doc(firestore, `users/${userId}`);
            await updateDoc(userDocRef, { role: newRole });
            
            setUsers(prevUsers => prevUsers.map(user => 
                user.uid === userId ? { ...user, role: newRole } : user
            ));
            showNotification(t('notification.success.userRoleUpdated'), 'success');
        } catch (error) {
            console.error("Error updating user role:", error);
            showNotification(t('notification.error.userRoleUpdateFailed'), 'error');
        } finally {
            setSavingStates(prev => ({ ...prev, [userId]: false }));
        }
    };

    if (isLoading) return <FullPageLoader />;

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t('userManagement.title')}
                </h1>
                <button onClick={() => navigate('/admin')} className="text-primary-600 dark:text-primary-400 hover:underline">
                    {t('userManagement.back')}
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('userManagement.table.name')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('userManagement.table.email')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('userManagement.table.role')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map((user) => (
                                <tr key={user.uid}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{`${user.name} ${user.surname}`.trim() || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        <div className="flex items-center gap-2">
                                             <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.uid, e.target.value as any)}
                                                disabled={savingStates[user.uid] || user.uid === userProfile?.uid}
                                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                <option value="user">{t('userManagement.role.user')}</option>
                                                <option value="sub-admin">{t('userManagement.role.subAdmin')}</option>
                                                <option value="admin">{t('userManagement.role.admin')}</option>
                                            </select>
                                            {savingStates[user.uid] && <LoadingSpinner size={20} />}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagementPage;
