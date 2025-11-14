
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { firestore, deleteCourseAndAssociatedData, getDocs, collection, doc, updateDoc, getDoc, query, where } from '../../services/firebaseService';
import { Course, UserProfile, Enrollment, SurveyQuestion } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../App';
import { useAuthContext } from '../../contexts/AuthContext';

// Note: In a real app, papaparse would be installed via npm.
// For this environment, we assume it's loaded globally via a script tag.
declare const Papa: any;

interface ProgressSummary {
    courseId: string;
    courseTitle: string;
    enrolled: number;
    notStarted: number;
    inProgress: number;
    completed: number;
}

const WarningIcon: React.FC = () => (
    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isLoading: boolean;
}> = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
    const { t } = useLanguage();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full">
                 <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <WarningIcon />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white">{title}</h3>
                        <div className="mt-2">
                             <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                     <button onClick={onConfirm} disabled={isLoading} className="w-full sm:w-auto inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-400 items-center">
                        {isLoading && <LoadingSpinner size={16} className="mr-2" />}
                        {t('admin.dashboard.deleteConfirmButton')}
                    </button>
                    <button onClick={onClose} disabled={isLoading} className="w-full sm:w-auto mt-3 sm:mt-0 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50">
                        {t('admin.dashboard.deleteCancelButton')}
                    </button>
                </div>
            </div>
        </div>
    );
};


const AdminDashboardPage: React.FC = () => {
    const { currentUser, userProfile } = useAuthContext();
    const [stats, setStats] = useState({ users: 0, courses: 0 });
    const [courses, setCourses] = useState<Course[]>([]);
    const [progressData, setProgressData] = useState<ProgressSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [exportingCourseId, setExportingCourseId] = useState<string | null>(null);
    const [togglingEnrollmentId, setTogglingEnrollmentId] = useState<string | null>(null);
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { showNotification } = useNotification();

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser || !userProfile) return;
            setIsLoading(true);
            try {
                let coursesQuery;
                if (userProfile.role === 'admin') {
                    coursesQuery = collection(firestore, 'courses');
                } else { // sub-admin
                    coursesQuery = query(collection(firestore, 'courses'), where('assignedAdmins', 'array-contains', currentUser.uid));
                }

                const coursesSnapshot = await getDocs(coursesQuery);
                const coursesData = (coursesSnapshot as any).docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Course[];
                setCourses(coursesData);

                // Fetch users and calculate progress summary (requires list permission for sub-admin)
                const usersSnapshot = await getDocs(collection(firestore, 'users'));
                const usersData = (usersSnapshot as any).docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as (UserProfile & { id: string })[];
                
                if (userProfile.role === 'admin') {
                     setStats({ users: usersData.length, courses: (await getDocs(collection(firestore, 'courses'))).size });
                }

                // Correctly calculate progress summary by fetching subcollections
                // This is read-intensive but necessary without collection group queries or cloud functions.
                const progressMap: Record<string, Omit<ProgressSummary, 'courseId' | 'courseTitle'>> = {};
                
                const enrollmentPromises = usersData.map(user => 
                    getDocs(collection(firestore, `users/${user.id}/enrollments`))
                );
                const userEnrollmentsSnapshots = await Promise.all(enrollmentPromises);

                userEnrollmentsSnapshots.forEach(snapshot => {
                    snapshot.forEach(enrollmentDoc => {
                        const enrollment = enrollmentDoc.data() as Enrollment;
                        const courseId = enrollmentDoc.id; // The document ID is the courseId
                        
                        if (!progressMap[courseId]) {
                            progressMap[courseId] = { enrolled: 0, notStarted: 0, inProgress: 0, completed: 0 };
                        }
                        
                        progressMap[courseId].enrolled++;
                        switch (enrollment.status) {
                            case 'not-started':
                                progressMap[courseId].notStarted++;
                                break;
                            case 'in-progress':
                                progressMap[courseId].inProgress++;
                                break;
                            case 'completed':
                                progressMap[courseId].completed++;
                                break;
                        }
                    });
                });

                const summary = coursesData.map(course => ({
                    courseId: course.id,
                    courseTitle: course.title,
                    ...progressMap[course.id] || { enrolled: 0, notStarted: 0, inProgress: 0, completed: 0 }
                }));

                setProgressData(summary);

            } catch (error: any) {
                console.error("Failed to fetch admin data:", error);
                if (error.code === 'permission-denied') {
                     showNotification("Permission denied. Sub-admins may need updated security rules to view progress.", 'error');
                } else {
                    showNotification(t('notification.error.fetchCourse'), 'error');
                }
            }
            setIsLoading(false);
        };
        fetchData();
    }, [currentUser, userProfile, t, showNotification]);

    const handleExportUsers = async () => {
        try {
            const usersSnapshot = await getDocs(collection(firestore, 'users'));
            const usersData = (usersSnapshot as any).docs.map((doc: any) => doc.data()) as UserProfile[];

            const csvData = usersData.map(user => ({
                [t('report.header.userId')]: user.uid,
                [t('report.header.email')]: user.email,
                [t('report.header.role')]: user.role,
                [t('report.header.prefix')]: user.prefix,
                [t('report.header.name')]: user.name,
                [t('report.header.surname')]: user.surname,
                [t('report.header.birthYear')]: user.dob ? new Date(user.dob).getFullYear() : 'N/A',
                [t('report.header.position')]: user.position,
                [t('report.header.organization')]: user.organization,
                [t('report.header.address')]: user.address,
                [t('report.header.district')]: user.district,
                [t('report.header.amphoe')]: user.amphoe,
                [t('report.header.province')]: user.province,
                [t('report.header.education')]: user.education,
                [t('report.header.phone')]: user.phone,
                [t('report.header.contactEmail')]: user.contactEmail,
            }));

            const csv = Papa.unparse(csvData);
            const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', 'users_export.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to export users:", error);
        }
    };
    
    const handleExportEnrollments = async (courseId: string, courseTitle?: string) => {
        setExportingCourseId(courseId);
        try {
            // Fetch survey questions for this course to create dynamic CSV headers
            const surveyQuestionsSnap = await getDocs(collection(firestore, `courses/${courseId}/survey`));
            const surveyQuestions = (surveyQuestionsSnap as any).docs
                .map((doc: any) => ({ id: doc.id, ...doc.data() }))
                .sort((a: any, b: any) => a.order - b.order) as SurveyQuestion[];

            const usersSnapshot = await getDocs(collection(firestore, 'users'));
            const users = (usersSnapshot as any).docs.map((doc: any) => doc.data()) as UserProfile[];

            const userEnrollmentPromises = users.map(async (user) => {
                const enrollmentRef = doc(firestore, `users/${user.uid}/enrollments/${courseId}`);
                const enrollmentSnap = await getDoc(enrollmentRef);
                
                if ((enrollmentSnap as any).exists()) {
                    return { user, enrollment: (enrollmentSnap as any).data() as Enrollment };
                }
                return null;
            });
            
            const enrolledUsersData = (await Promise.all(userEnrollmentPromises)).filter(Boolean) as { user: UserProfile, enrollment: Enrollment }[];

            if (enrolledUsersData.length === 0) {
                showNotification(t('admin.dashboard.noEnrollmentsToExport'), 'error');
                return;
            }

            const csvData = enrolledUsersData.map(({ user, enrollment }) => {
                 // Base data for each row
                const rowData: Record<string, any> = {
                    [t('report.header.userId')]: user.uid,
                    [t('report.header.prefix')]: user.prefix,
                    [t('report.header.name')]: user.name,
                    [t('report.header.surname')]: user.surname,
                    [t('report.header.organization')]: user.organization,
                    [t('report.header.address')]: user.address || 'N/A',
                    [t('report.header.district')]: user.district || 'N/A',
                    [t('report.header.amphoe')]: user.amphoe || 'N/A',
                    [t('report.header.phone')]: user.phone || 'N/A',
                    [t('report.header.contactEmail')]: user.contactEmail || 'N/A',
                    [t('report.header.enrollmentStatus')]: enrollment.status,
                    [t('report.header.preTest')]: enrollment.preTestCompleted ? t('report.status.yes') : t('report.status.no'),
                    [t('report.header.contentViewed')]: enrollment.contentViewed ? t('report.status.yes') : t('report.status.no'),
                    [t('report.header.postTest')]: enrollment.postTestCompleted ? t('report.status.yes') : t('report.status.no'),
                    [t('report.header.survey')]: enrollment.surveyCompleted ? t('report.status.yes') : t('report.status.no'),
                    [t('report.header.postTestScore')]: enrollment.postTestScore ?? 'N/A',
                };

                // Dynamically add a column for each survey question and populate the answer
                surveyQuestions.forEach(question => {
                    const header = question.questionText; // PapaParse handles quoting special characters
                    if (enrollment.surveyResponses && enrollment.surveyResponses[question.id] !== undefined) {
                        rowData[header] = enrollment.surveyResponses[question.id];
                    } else {
                        rowData[header] = 'N/A'; // Use 'N/A' if no response is found
                    }
                });

                return rowData;
            });

            const csv = Papa.unparse(csvData);
            const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const safeCourseTitle = courseTitle?.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            link.setAttribute('download', `enrollment_report_${safeCourseTitle}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to export enrollment report:", error);
            showNotification(t('admin.dashboard.exportError'), 'error');
        } finally {
            setExportingCourseId(null);
        }
    };

    const handleDeleteCourse = async () => {
        if (!courseToDelete) return;
        setIsDeleting(true);
        try {
            await deleteCourseAndAssociatedData(courseToDelete.id);
            
            setCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
            setProgressData(prev => prev.filter(p => p.courseId !== courseToDelete.id));
            showNotification(t('notification.success.courseDeleted'), 'success');

        } catch (error) {
            console.error("Failed to delete course:", error);
            showNotification(t('notification.error.courseDeletionFailed'), 'error');
        } finally {
            setIsDeleting(false);
            setCourseToDelete(null);
        }
    };

    const handleToggleEnrollment = async (courseId: string, newStatus: boolean) => {
        setTogglingEnrollmentId(courseId);
        try {
            await updateDoc(doc(firestore, `courses/${courseId}`), { isEnrollmentOpen: newStatus });
            setCourses(prev => prev.map(c => c.id === courseId ? { ...c, isEnrollmentOpen: newStatus } : c));
            showNotification(t('notification.success.enrollmentStatusUpdated'), 'success');
        } catch (error) {
            console.error("Failed to update enrollment status:", error);
            showNotification(t('notification.error.enrollmentStatusUpdateFailed'), 'error');
        } finally {
            setTogglingEnrollmentId(null);
        }
    };


    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><LoadingSpinner size={40} /></div>;
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {courseToDelete && (
                <ConfirmationModal
                    isOpen={!!courseToDelete}
                    onClose={() => setCourseToDelete(null)}
                    onConfirm={handleDeleteCourse}
                    title={t('admin.dashboard.deleteConfirmTitle')}
                    message={t('admin.dashboard.deleteConfirmMessage').replace('{courseTitle}', courseToDelete.title)}
                    isLoading={isDeleting}
                />
            )}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t('admin.dashboard.title')}</h1>

            {/* KPIs for super admin */}
            {userProfile?.role === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-lg font-medium text-gray-500 dark:text-gray-400">{t('admin.dashboard.totalUsers')}</h2>
                        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{stats.users}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-lg font-medium text-gray-500 dark:text-gray-400">{t('admin.dashboard.totalCourses')}</h2>
                        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{stats.courses}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-center">
                       <button onClick={handleExportUsers} className="bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition duration-300">
                            {t('admin.dashboard.exportUsers')}
                        </button>
                    </div>
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-center">
                       <button onClick={() => navigate('/admin/users')} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 transition duration-300">
                            {t('admin.dashboard.manageUsers')}
                        </button>
                    </div>
                </div>
            )}


            {/* User Progress Summary */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('admin.dashboard.progressSummaryTitle')}</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('admin.dashboard.courseTitle')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('admin.dashboard.enrolled')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('admin.dashboard.notStarted')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('admin.dashboard.inProgress')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('admin.dashboard.completed')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {progressData.map((summary) => (
                                <tr key={summary.courseId}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{summary.courseTitle}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{summary.enrolled}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{summary.notStarted}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{summary.inProgress}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{summary.completed}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {progressData.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-4">{userProfile?.role === 'admin' ? t('admin.dashboard.noCourses') : t('admin.dashboard.noAssignedCourses')}</p>}
                </div>
            </div>

            {/* Course List */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{userProfile?.role === 'admin' ? t('admin.dashboard.courses') : t('admin.dashboard.assignedCourses')}</h2>
                     {userProfile?.role === 'admin' && (
                        <button onClick={() => navigate('/admin/course/new')} className="bg-primary-600 text-white font-bold py-2 px-4 rounded hover:bg-primary-700 transition duration-300">
                            {t('admin.dashboard.createCourse')}
                        </button>
                    )}
                </div>
                <div className="flow-root">
                    <ul role="list" className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
                        {courses.map((course) => (
                            <li key={course.id} className="py-4">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{course.title}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{course.description}</p>
                                    </div>
                                    <div className="flex items-center space-x-2 flex-wrap gap-2 justify-end">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('admin.dashboard.enrollmentStatus')}</span>
                                             <label className="inline-flex relative items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" 
                                                    checked={course.isEnrollmentOpen !== false} 
                                                    onChange={(e) => handleToggleEnrollment(course.id, e.target.checked)}
                                                    disabled={togglingEnrollmentId === course.id}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50 flex items-center justify-center">
                                                    {togglingEnrollmentId === course.id && <LoadingSpinner size={12} className="text-primary-500"/>}
                                                </div>
                                                <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                                    {course.isEnrollmentOpen !== false ? t('admin.dashboard.enrollmentOpen') : t('admin.dashboard.enrollmentClosed')}
                                                </span>
                                            </label>
                                        </div>
                                        <button
                                            onClick={() => handleExportEnrollments(course.id, course.title)}
                                            disabled={exportingCourseId === course.id}
                                            className="inline-flex items-center justify-center shadow-sm px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-800/50 disabled:opacity-50"
                                        >
                                            {exportingCourseId === course.id 
                                                ? <><LoadingSpinner size={16} className="mr-2" />{t('admin.dashboard.exporting')}</>
                                                : t('admin.dashboard.exportReport')
                                            }
                                        </button>
                                        <Link to={`/admin/course/${course.id}`} className="inline-flex items-center shadow-sm px-3 py-1 border border-gray-300 dark:border-gray-600 text-sm leading-5 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                            {t('admin.dashboard.manage')}
                                        </Link>
                                        {userProfile?.role === 'admin' && (
                                            <button
                                                onClick={() => setCourseToDelete(course)}
                                                className="inline-flex items-center shadow-sm px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800/50"
                                            >
                                                {t('admin.dashboard.delete')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                         {courses.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-4">{userProfile?.role === 'admin' ? t('admin.dashboard.noCourses') : t('admin.dashboard.noAssignedCourses')}</p>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
