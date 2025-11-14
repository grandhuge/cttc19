
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { firestore, Timestamp, doc, getDoc, collection, getDocs, onSnapshot, updateDoc, addDoc } from '../../services/firebaseService';
import { Course, Enrollment, QuizQuestion, SurveyQuestion, ChatMessage, ReplyContext } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../App';
import { generateCertificate } from '../../utils/certificateGenerator';


const QuizModal = ({ questions, onSubmit, onClose }: { questions: QuizQuestion[], onSubmit: (score: number) => void, onClose: () => void }) => {
    const { t } = useLanguage();
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const handleAnswerChange = (questionId: string, optionId: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const handleSubmit = () => {
        if (Object.keys(answers).length !== questions.length) {
            alert('Please answer all questions.');
            return;
        }

        let correctCount = 0;
        questions.forEach(q => {
            const selectedOptionId = answers[q.id];
            const correctOption = q.options.find(opt => opt.isCorrect);
            if (correctOption && correctOption.id === selectedOptionId) {
                correctCount++;
            }
        });
        
        const score = Math.round((correctCount / questions.length) * 100);
        onSubmit(score);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4">{t('quiz.title')}</h2>
                <div className="my-4 space-y-6 overflow-y-auto flex-grow pr-2">
                    {questions.map((q, index) => (
                        <div key={q.id}>
                            <p className="font-semibold">{index + 1}. {q.questionText}</p>
                            <div className="mt-2 space-y-3 pl-4">
                                {q.options.map(opt => (
                                    <label key={opt.id} className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors duration-200 ${
                                        answers[q.id] === opt.id
                                        ? 'bg-primary-50 dark:bg-primary-900/50 border-primary-500'
                                        : 'bg-transparent border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <input
                                            type="radio"
                                            name={q.id}
                                            value={opt.id}
                                            checked={answers[q.id] === opt.id}
                                            onChange={() => handleAnswerChange(q.id, opt.id)}
                                            className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                        />
                                        <span className="ml-3 text-gray-700 dark:text-gray-300">{opt.text}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-4 mt-6 pt-4 border-t dark:border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200">{t('quiz.cancel')}</button>
                    <button onClick={handleSubmit} className="px-4 py-2 rounded bg-primary-600 text-white">{t('quiz.submit')}</button>
                </div>
            </div>
        </div>
    );
};

const StarIcon = ({ filled, className }: { filled: boolean, className?: string }) => (
  <svg className={`w-8 h-8 ${filled ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-500'} ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// FIX: Moved `onMouseEnter` from `StarIcon` to the parent `label` element to fix the prop type error.
const StarRatingInput = ({ name, value, onChange, required }: { name: string, value: number, onChange: (value: number) => void, required: boolean }) => {
  const [hoverValue, setHoverValue] = useState(0);
  const stars = Array(5).fill(0);

  return (
    <div className="flex items-center space-x-1 mt-2" onMouseLeave={() => setHoverValue(0)}>
      {stars.map((_, index) => {
        const ratingValue = index + 1;
        return (
          <label
            key={index}
            className="cursor-pointer"
            onMouseEnter={() => setHoverValue(ratingValue)}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              value={ratingValue}
              checked={value === ratingValue}
              onChange={() => onChange(ratingValue)}
              required={required}
            />
            <StarIcon
              filled={ratingValue <= (hoverValue || value)}
              className="transition-transform duration-150 ease-in-out hover:scale-125"
            />
          </label>
        );
      })}
    </div>
  );
};


const SurveyModal = ({ questions, onSubmit, onClose }: { questions: SurveyQuestion[], onSubmit: (answers: object) => void, onClose: () => void }) => {
    const { t } = useLanguage();
    const [responses, setResponses] = useState<Record<string, any>>({});

    const handleChange = (questionId: string, value: any) => {
        setResponses(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        for (const q of questions) {
            if (q.required && (responses[q.id] === undefined || responses[q.id] === null || responses[q.id] === '')) {
                 alert(`Please answer the required question: "${q.questionText}"`);
                 return;
            }
        }
        onSubmit(responses);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4">{t('survey.title')}</h2>
                <div className="my-4 space-y-6 overflow-y-auto flex-grow pr-2">
                    {questions.map((q, index) => (
                        <div key={q.id}>
                            <label className="font-semibold">{index + 1}. {q.questionText} {q.required && <span className="text-red-500">*</span>}</label>
                            {q.type === 'rating' && (
                               <StarRatingInput
                                 name={q.id}
                                 value={responses[q.id] || 0}
                                 onChange={(rating) => handleChange(q.id, rating)}
                                 required={q.required}
                               />
                            )}
                            {q.type === 'text' && (
                                <textarea
                                    name={q.id}
                                    rows={3}
                                    value={responses[q.id] || ''}
                                    onChange={(e) => handleChange(q.id, e.target.value)}
                                    required={q.required}
                                    className="mt-2 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-4 mt-6 pt-4 border-t dark:border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200">{t('quiz.cancel')}</button>
                    <button type="submit" className="px-4 py-2 rounded bg-primary-600 text-white">{t('survey.submit')}</button>
                </div>
            </form>
        </div>
    );
};


const CoursePage: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const { currentUser, userProfile } = useAuthContext();
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    
    const [course, setCourse] = useState<Course | null>(null);
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
    const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
    const [survey, setSurvey] = useState<SurveyQuestion[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [showQuiz, setShowQuiz] = useState<'pre' | 'post' | null>(null);
    const [showSurvey, setShowSurvey] = useState(false);
    const [isGeneratingCert, setIsGeneratingCert] = useState(false);

    useEffect(() => {
        if (userProfile && (!userProfile.name || !userProfile.surname || !userProfile.position || !userProfile.organization || !userProfile.province || !userProfile.address || !userProfile.district || !userProfile.amphoe)) {
            showNotification(t('profile.incompleteMessage'), 'error');
            navigate('/profile', { replace: true });
            return;
        }

        if (!currentUser || !courseId) return;

        let isMounted = true;
        const unsubscribers: (() => void)[] = [];

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const coursePromise = getDoc(doc(firestore, `courses/${courseId}`));
                const quizPromise = getDocs(collection(firestore, `courses/${courseId}/quiz`));
                const surveyPromise = getDocs(collection(firestore, `courses/${courseId}/survey`));

                const [courseSnap, quizSnap, surveySnap] = await Promise.all([coursePromise, quizPromise, surveyPromise]);
                if (!isMounted) return;

                if ((courseSnap as any).exists()) setCourse({ id: (courseSnap as any).id, ...(courseSnap as any).data() } as Course);
                setQuiz((quizSnap as any).docs.map((d:any) => ({id: d.id, ...d.data()})).sort((a:any,b:any) => a.order - b.order));
                setSurvey((surveySnap as any).docs.map((d:any) => ({id: d.id, ...d.data()})).sort((a:any,b:any) => a.order - b.order));
                
                const enrollmentRef = doc(firestore, `users/${currentUser.uid}/enrollments/${courseId}`);
                const unsubscribeEnrollment = onSnapshot(enrollmentRef, (doc: any) => {
                    if (isMounted && doc.exists()) {
                        setEnrollment({ courseId, ...doc.data() } as Enrollment);
                    }
                });
                unsubscribers.push(unsubscribeEnrollment);

                const chatRef = collection(firestore, `chat_rooms/${courseId}/messages`);
                const unsubscribeChat = onSnapshot(chatRef, (snapshot: any) => {
                    const chatData = snapshot.docs.map((d: any) => ({id: d.id, ...d.data()})).sort((a:any, b:any) => a.timestamp.seconds - b.timestamp.seconds);
                    if (isMounted) setMessages(chatData);
                });
                unsubscribers.push(unsubscribeChat);

            } catch (error) {
                console.error("Error fetching course data:", error);
                if (isMounted) showNotification(t('notification.error.fetchCourse'), 'error');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
            unsubscribers.forEach(unsub => unsub());
        };

    }, [currentUser, userProfile, courseId, t, showNotification, navigate]);

    const updateEnrollment = async (data: Partial<Omit<Enrollment, 'courseId'>>) => {
        if (!currentUser || !courseId) return;
        const enrollmentRef = doc(firestore, `users/${currentUser.uid}/enrollments/${courseId}`);
        await updateDoc(enrollmentRef, data);
    };
    
    const handlePreTestSubmit = (score: number) => {
        updateEnrollment({ preTestCompleted: true });
        setShowQuiz(null);
        showNotification(t('notification.success.preTest'), 'success');
    };

    const handleContentComplete = () => {
        updateEnrollment({ contentViewed: true });
        showNotification(t('notification.success.contentViewed'), 'success');
    };

    const handlePostTestSubmit = (score: number) => {
        if (course && score >= course.passPercentage) {
            updateEnrollment({ postTestCompleted: true, postTestScore: score });
            showNotification(t('notification.success.postTestPass').replace('{score}', score.toString()), 'success');
        } else {
            showNotification(t('notification.error.postTestFail').replace('{score}', score.toString()), 'error');
        }
        setShowQuiz(null);
    };

    const handleSurveySubmit = (answers: object) => {
        updateEnrollment({ 
            surveyCompleted: true, 
            surveyResponses: answers, 
            status: 'completed',
            completionDate: Timestamp.now() 
        });
        setShowSurvey(false);
        showNotification(t('notification.success.survey'), 'success');
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || !userProfile || !courseId) return;
        
        const messageData = {
            text: newMessage,
            senderId: currentUser.uid,
            senderName: `${userProfile.name} ${userProfile.surname}`.trim(),
            senderRole: userProfile.role,
            timestamp: Timestamp.now(),
            ...(replyingTo && {
                replyTo: {
                    messageId: replyingTo.id,
                    senderName: replyingTo.senderName,
                    text: replyingTo.text.length > 80 ? replyingTo.text.substring(0, 77) + '...' : replyingTo.text,
                }
            })
        };

        try {
            await addDoc(collection(firestore, `chat_rooms/${courseId}/messages`), messageData);
            setNewMessage('');
            setReplyingTo(null);
        } catch (error) {
            console.error("Error sending message:", error);
            showNotification(t('notification.error.sendMessage'), 'error');
        }
    };
    
    const handleDownloadCertificate = async () => {
        if (!course?.hasCertificate || !userProfile || !enrollment?.completionDate) return;
        
        setIsGeneratingCert(true);
        try {
            let fullName = `${userProfile.name} ${userProfile.surname}`;
            if (course.showPrefixOnCertificate !== false && userProfile.prefix) {
                const prefixKey = `prefix.${userProfile.prefix}`;
                const translatedPrefix = t(prefixKey);
                // If translation doesn't exist (e.g., custom prefix), use the stored prefix itself.
                const prefixToShow = (translatedPrefix === prefixKey) ? userProfile.prefix : translatedPrefix;
                fullName = `${prefixToShow} ${fullName}`;
            }

            await generateCertificate({
                templateUrl: course.certificateTemplateUrl!,
                userName: fullName.trim(),
                completionDate: enrollment.completionDate,
                courseTitle: course.title,
                nameCoordinates: course.nameCoordinates!,
                dateCoordinates: course.dateCoordinates!,
                nameFontSettings: course.nameFontSettings,
                dateFontSettings: course.dateFontSettings,
                showDateOnCertificate: course.showDateOnCertificate,
            });
        } catch (error) {
            console.error(error);
            showNotification(t('notification.error.certGeneration'), 'error');
        } finally {
            setIsGeneratingCert(false);
        }
    };

    const formatTimestamp = (ts: Timestamp) => {
      if (!ts?.toDate) return '';
      return ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const ReplyIcon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l4-4m-4 4l4 4" />
      </svg>
    );

    if (isLoading) return <div className="flex justify-center items-center py-20"><LoadingSpinner size={48} /></div>;
    if (!course || !enrollment) return <div className="text-center py-20">{t('course.notFound')}</div>;

    const steps = [
        { name: t('course.preTest'), completed: enrollment.preTestCompleted },
        { name: t('course.contentStep'), completed: enrollment.contentViewed, available: enrollment.preTestCompleted },
        { name: t('course.postTest'), completed: enrollment.postTestCompleted, available: enrollment.contentViewed },
        { name: t('course.survey'), completed: enrollment.surveyCompleted, available: enrollment.postTestCompleted },
    ];
    
    const completedSteps = steps.filter(step => step.completed).length;
    const progressPercentage = (completedSteps / steps.length) * 100;

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{course.title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{course.description}</p>
            
            {enrollment.status === 'completed' && <div className="bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-200 p-4 rounded-md mb-8">{t('course.completedMessage')}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">{t('course.content')}</h2>
                    <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: course.content || `<p>${t('course.noContent')}</p>`}} />
                    
                    <div className="mt-8 border-t dark:border-gray-700 pt-6">
                        <h2 className="text-xl font-bold mb-4">{t('course.discussion')}</h2>
                        <div className="h-64 overflow-y-auto border dark:border-gray-600 rounded-md p-4 mb-4 space-y-2 bg-gray-50 dark:bg-gray-900/50">
                            {messages.map(msg => (
                               <div key={msg.id} className="group relative py-1 pr-8">
                                    {msg.replyTo && (
                                        <div className="ml-4 mb-1 p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 border-l-4 border-gray-400 dark:border-gray-500">
                                            <p className="font-bold">{msg.replyTo.senderName}</p>
                                            <p className="truncate">{msg.replyTo.text}</p>
                                        </div>
                                    )}
                                    <div>
                                        <span className={`font-bold ${msg.senderRole === 'admin' || msg.senderRole === 'sub-admin' ? 'text-primary-500' : 'text-gray-800 dark:text-gray-200'}`}>{msg.senderName}</span>
                                        <span className="text-xs text-gray-400 ml-2">{formatTimestamp(msg.timestamp)}</span>
                                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap ml-1">{msg.text}</p>
                                    </div>
                                    <button
                                        onClick={() => setReplyingTo(msg)}
                                        title={t('chat.replyAction')}
                                        className="absolute top-1/2 -translate-y-1/2 right-0 p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <ReplyIcon />
                                    </button>
                                </div>
                            ))}
                            {messages.length === 0 && <p className="text-gray-400 text-center py-4">{t('course.noMessages')}</p>}
                        </div>
                         {replyingTo && (
                            <div className="p-2 mb-2 rounded-md bg-primary-50 dark:bg-primary-900/40 text-sm text-primary-800 dark:text-primary-200 border-l-4 border-primary-500">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{t('chat.replyingTo')} {replyingTo.senderName}</p>
                                        <p className="truncate text-xs">{replyingTo.text}</p>
                                    </div>
                                    <button onClick={() => setReplyingTo(null)} className="p-1 rounded-full hover:bg-black/10" aria-label="Cancel reply">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>
                        )}
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-grow bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white" placeholder={t('course.messagePlaceholder')} />
                            <button type="submit" className="bg-primary-600 text-white font-bold py-2 px-4 rounded hover:bg-primary-700 disabled:bg-primary-400" disabled={!newMessage.trim()}>{t('course.sendMessage')}</button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md sticky top-24">
                        <h2 className="text-xl font-bold mb-4">{t('course.progress')}</h2>
                        <div className="mb-4">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                             <p className="text-right text-sm text-gray-500 mt-1">{completedSteps} / {steps.length} {t('course.stepsCompleted')}</p>
                        </div>
                        <ul className="space-y-4">
                            {steps.map(step => (
                                <li key={step.name} className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 text-white font-bold transition-colors ${step.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                       {step.completed ? '✓' : ''}
                                    </div>
                                    <span className={`transition-colors ${step.completed ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{step.name}</span>
                                </li>
                            ))}
                        </ul>
                         <div className="mt-6 space-y-3">
                            {!enrollment.preTestCompleted && <button onClick={() => setShowQuiz('pre')} className="w-full bg-primary-600 text-white font-bold py-2 px-4 rounded hover:bg-primary-700">{t('course.startPreTest')}</button>}
                            {enrollment.preTestCompleted && !enrollment.contentViewed && <button onClick={handleContentComplete} className="w-full bg-primary-600 text-white font-bold py-2 px-4 rounded hover:bg-primary-700">{t('course.markAsRead')}</button>}
                            {enrollment.contentViewed && !enrollment.postTestCompleted && (
                                course.isPostTestActive ? (
                                    <button onClick={() => setShowQuiz('post')} className="w-full bg-primary-600 text-white font-bold py-2 px-4 rounded hover:bg-primary-700">
                                        {t('course.startPostTest')}
                                    </button>
                                ) : (
                                    <button disabled className="w-full bg-gray-400 dark:bg-gray-600 text-white font-bold py-2 px-4 rounded cursor-not-allowed">
                                        {t('course.postTestNotAvailable')}
                                    </button>
                                )
                            )}
                            {enrollment.postTestCompleted && !enrollment.surveyCompleted && <button onClick={() => setShowSurvey(true)} className="w-full bg-primary-600 text-white font-bold py-2 px-4 rounded hover:bg-primary-700">{t('course.startSurvey')}</button>}
                            {enrollment.status === 'completed' && course.hasCertificate && (
                                <button 
                                    onClick={handleDownloadCertificate} 
                                    disabled={isGeneratingCert}
                                    className="w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded hover:bg-yellow-600 disabled:bg-yellow-300 flex items-center justify-center"
                                >
                                    {isGeneratingCert ? <LoadingSpinner size={20} /> : t('course.downloadCertificate')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {showQuiz && <QuizModal questions={quiz} onClose={() => setShowQuiz(null)} onSubmit={showQuiz === 'pre' ? handlePreTestSubmit : handlePostTestSubmit} />}
            {showSurvey && <SurveyModal questions={survey} onClose={() => setShowSurvey(false)} onSubmit={handleSurveySubmit} />}
        </div>
    );
};

export default CoursePage;
