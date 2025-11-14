
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { firestore, getDocs, collection, doc, setDoc, onSnapshot } from '../../services/firebaseService';
import { Course, Enrollment, UserProfile } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../App';

interface CourseCardProps {
  course: Course;
  isEnrolled: boolean;
  onEnroll: (course: Course) => void;
  isEnrolling: string | null;
  onGoToCourse: (courseId: string) => void;
  progressPercentage?: number;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, isEnrolled, onEnroll, isEnrolling, onGoToCourse, progressPercentage }) => {
  const { t } = useLanguage();
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden transition-transform hover:scale-105 flex flex-col">
      <div className="p-6 flex-grow">
        <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400">{course.title}</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 min-h-[40px]">{course.description}</p>
      </div>
      <div className="px-6 pb-6">
        {isEnrolled && typeof progressPercentage === 'number' && (
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('dashboard.progress')}</span>
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{t('dashboard.progressComplete').replace('{progress}', progressPercentage.toString())}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
        )}
        {isEnrolled ? (
          <button onClick={() => onGoToCourse(course.id)} className="w-full text-center inline-block bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700">
            {t('dashboard.goToCourse')}
          </button>
        ) : (
          <button 
            onClick={() => onEnroll(course)} 
            disabled={isEnrolling === course.id}
            className="w-full bg-primary-600 text-white font-bold py-2 px-4 rounded hover:bg-primary-700 disabled:bg-primary-400 flex items-center justify-center"
          >
            {isEnrolling === course.id ? <LoadingSpinner size={20} /> : t('dashboard.enrollNow')}
          </button>
        )}
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { currentUser, userProfile } = useAuthContext();
  const { t } = useLanguage();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, Enrollment>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const coursesSnapshot = await getDocs(collection(firestore, 'courses'));
        const coursesData = (coursesSnapshot as any).docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Course[];
        setCourses(coursesData);

        const enrollmentsRef = collection(firestore, `users/${currentUser.uid}/enrollments`);
        const unsubscribe = onSnapshot(enrollmentsRef, (snapshot: any) => {
          const enrollmentsData: Record<string, Enrollment> = {};
          snapshot.docs.forEach((doc: any) => {
            enrollmentsData[doc.id] = { courseId: doc.id, ...doc.data() } as Enrollment;
          });
          setEnrollments(enrollmentsData);
          setIsLoading(false);
        });
        
        return () => unsubscribe();

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleEnroll = async (course: Course) => {
    if (!currentUser) return;
    setIsEnrolling(course.id);
    try {
      const enrollmentRef = doc(firestore, `users/${currentUser.uid}/enrollments/${course.id}`);
      const newEnrollment: Omit<Enrollment, 'courseId'> = {
        status: 'not-started',
        preTestCompleted: false,
        contentViewed: false,
        postTestCompleted: false,
        postTestScore: null,
        surveyCompleted: false,
        surveyResponses: null,
      };
      await setDoc(enrollmentRef, newEnrollment);
      showNotification(t('notification.success.enrollAndRedirect'), 'success');
      navigate('/profile');
    } catch (enrollError) {
      console.error("Error enrolling in course:", enrollError);
      showNotification(t('notification.error.enrollFailed'), 'error');
    } finally {
      setIsEnrolling(null);
    }
  };
  
  const handleGoToCourse = (courseId: string) => {
    if (!userProfile?.name || !userProfile?.surname || !userProfile?.position || !userProfile?.organization || !userProfile?.province || !userProfile?.address || !userProfile?.district || !userProfile?.amphoe) {
        showNotification(t('profile.incompleteMessage'), 'error');
        navigate('/profile');
    } else {
        navigate(`/course/${courseId}`);
    }
  };

  const enrolledCourses = courses.filter(c => enrollments[c.id]);
  // An available course is one the user is not enrolled in AND has enrollment open.
  // We check for `!== false` to treat `undefined` (for older courses) as open.
  const availableCourses = courses.filter(c => !enrollments[c.id] && c.isEnrollmentOpen !== false);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{t('dashboard.title')}</h1>
      
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('dashboard.enrolledCourses')}</h2>
        {enrolledCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map(course => {
              const enrollment = enrollments[course.id];
              if (!enrollment) return null;
              const completedSteps = [
                enrollment.preTestCompleted,
                enrollment.contentViewed,
                enrollment.postTestCompleted,
                enrollment.surveyCompleted,
              ].filter(Boolean).length;
              const progressPercentage = Math.round((completedSteps / 4) * 100);

              return (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  isEnrolled={true} 
                  onEnroll={handleEnroll} 
                  isEnrolling={isEnrolling} 
                  onGoToCourse={handleGoToCourse}
                  progressPercentage={progressPercentage}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">{t('dashboard.noEnrolledCourses')}</p>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('dashboard.availableCourses')}</h2>
         {availableCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCourses.map(course => <CourseCard key={course.id} course={course} isEnrolled={false} onEnroll={handleEnroll} isEnrolling={isEnrolling} onGoToCourse={handleGoToCourse} />)}
          </div>
        ) : (
           <div className="text-center py-10 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">{t('dashboard.noAvailableCourses')}</p>
           </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
