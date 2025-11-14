
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firestore, Timestamp, getDocs, collection, doc, getDoc, onSnapshot, updateDoc, addDoc, setDoc } from '../../services/firebaseService';
import { Course, ChatMessage, UserProfile, Coordinates, ReplyContext } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../App';
import QuizEditor from './components/QuizEditor';
import SurveyEditor from './components/SurveyEditor';
import CertificateEditor from './components/CertificateEditor';
import { useAuthContext } from '../../contexts/AuthContext';

declare const Quill: any;

const defaultCoordinates: Coordinates = {
    x: { value: 50, unit: '%' },
    y: { value: 50, unit: '%' }
};

const initialCourseState: Partial<Course> = {
    title: '',
    description: '',
    content: '',
    passPercentage: 70,
    isPostTestActive: false,
    isEnrollmentOpen: true,
    assignedAdmins: [],
    hasCertificate: false,
    certificateTemplateUrl: '',
    nameCoordinates: defaultCoordinates,
    dateCoordinates: { x: { value: 50, unit: '%' }, y: { value: 60, unit: '%' } },
};

// SVG Icons for the sidebar
const GeneralIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);
const CertificateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
);
const QuizIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const SurveyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
);
const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
);


const CourseEditorPage: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const isNewCourse = courseId === 'new';
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const { userProfile } = useAuthContext();
    
    const [course, setCourse] = useState<Partial<Course>>(initialCourseState);
    const [subAdmins, setSubAdmins] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(!isNewCourse);
    const [isSaving, setIsSaving] = useState(false);
    const [activeSection, setActiveSection] = useState<'general' | 'certificate' | 'quiz' | 'survey' | 'chat'>('general');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

    const quillRef = useRef<HTMLDivElement>(null);
    const quillInstanceRef = useRef<any>(null);

    // Effect 1: Fetch course data and sub-admins
    useEffect(() => {
        if (isNewCourse) {
            setCourse(initialCourseState);
            setIsLoading(false);
        }

        let isMounted = true;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch all sub-admins for the assignment UI (only for super-admin)
                if (userProfile?.role === 'admin') {
                    const usersSnap = await getDocs(collection(firestore, 'users'));
                    const allUsers = (usersSnap as any).docs.map((d: any) => d.data()) as UserProfile[];
                    setSubAdmins(allUsers.filter(u => u.role === 'sub-admin'));
                }

                if (!isNewCourse) {
                    const courseSnap = await getDoc(doc(firestore, `courses/${courseId}`));
                    if (!isMounted) return;

                    if ((courseSnap as any).exists()) {
                        const courseData = { id: courseId, ...(courseSnap as any).data() } as Course;
                        // Security check for sub-admins
                        if (userProfile?.role === 'sub-admin' && !courseData.assignedAdmins?.includes(userProfile.uid)) {
                            showNotification('Access denied.', 'error');
                            navigate('/admin');
                            return;
                        }
                        setCourse(courseData);
                    } else {
                        showNotification(t('notification.error.courseNotFound'), 'error');
                        navigate('/admin');
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                showNotification(t('notification.error.fetchCourse'), 'error');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchData();

        return () => { isMounted = false; };
    }, [courseId, isNewCourse, navigate, showNotification, t, userProfile]);

    // Effect 2: Initialize Quill editor.
    useEffect(() => {
        // Exit if still loading, the DOM element is not ready, or if Quill is already initialized.
        if (isLoading || !quillRef.current || quillInstanceRef.current) {
            return;
        }

        // Initialize Quill. This block will now run only once per component mount (after loading).
        const quill = new Quill(quillRef.current, { 
            theme: 'snow', 
            modules: { 
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['link', 'image', 'code-block'],
                    ['clean']
                ] 
            } 
        });
        quillInstanceRef.current = quill;
        
        // Set the initial content from the fetched course data.
        if (course.content) {
            quill.clipboard.dangerouslyPasteHTML(course.content, 'silent');
        }
        
        // Create a handler to update React state from Quill.
        const handler = (delta: any, oldDelta: any, source: string) => {
            if (source === 'user') {
                // Update state only on user input to avoid infinite loops.
                setCourse(prev => ({ ...prev, content: quill.root.innerHTML }));
            }
        };
        
        quill.on('text-change', handler);

        // Return a cleanup function to be run on unmount.
        return () => {
            // Check if the instance exists before trying to clean up.
            if (quillInstanceRef.current) {
                quillInstanceRef.current.off('text-change', handler);
                quillInstanceRef.current = null;
            }
        };
    }, [isLoading]);


     // Effect 3: Fetch chat messages
    useEffect(() => {
        if (activeSection !== 'chat' || isNewCourse || !courseId) return;

        let isMounted = true;
        const chatRef = collection(firestore, `chat_rooms/${courseId}/messages`);
        const unsubscribe = onSnapshot(chatRef, (snapshot: any) => {
            const chatData = snapshot.docs.map((d: any) => ({id: d.id, ...d.data()})).sort((a:any, b:any) => a.timestamp.seconds - b.timestamp.seconds);
            if (isMounted) setMessages(chatData);
        });

        return () => { isMounted = false; unsubscribe(); };
    }, [activeSection, courseId, isNewCourse]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = e.target;
        const { name } = target;
        const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
        setCourse(prev => ({ ...prev, [name]: name === 'passPercentage' ? parseInt(value.toString()) || 0 : value }));
    };

    const handleAdminAssignmentChange = (adminId: string, isChecked: boolean) => {
        setCourse(prev => {
            const currentAdmins = prev.assignedAdmins || [];
            if (isChecked) {
                return { ...prev, assignedAdmins: [...currentAdmins, adminId] };
            } else {
                return { ...prev, assignedAdmins: currentAdmins.filter(id => id !== adminId) };
            }
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!course.title) {
            showNotification(t('notification.error.requiredFields'), 'error');
            return;
        }
        setIsSaving(true);
        try {
            if (isNewCourse) {
                const { id, ...newCourseData } = course;
                
                // Ensure the creator is assigned as an admin to the new course.
                const creatorId = userProfile?.uid;
                let assignedAdmins = newCourseData.assignedAdmins || [];
                if (creatorId && !assignedAdmins.includes(creatorId)) {
                    assignedAdmins.push(creatorId);
                }

                const courseToCreate = {
                    ...newCourseData,
                    assignedAdmins,
                    isEnrollmentOpen: course.isEnrollmentOpen !== false, // Default to true if undefined
                };
                const newCourseRef = await addDoc(collection(firestore, 'courses'), courseToCreate);
                await setDoc(doc(firestore, `chat_rooms/${newCourseRef.id}`), {});
                showNotification(t('notification.success.courseCreated'), 'success');
                navigate(`/admin/course/${newCourseRef.id}`, { replace: true });
            } else if (courseId) {
                const { id, ...updateData } = course;
                await updateDoc(doc(firestore, `courses/${courseId}`), updateData);
                showNotification(t('notification.success.courseUpdated'), 'success');
            }
        } catch (error) {
            console.error("Error saving course:", error);
            showNotification(t('notification.error.saveCourse'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !userProfile || isNewCourse || !courseId) return;
        
        const messageData = {
            text: newMessage,
            senderId: userProfile.uid,
            senderName: `${userProfile.name} ${userProfile.surname}`.trim() || 'Admin',
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
            showNotification(t('notification.error.sendMessage'), 'error');
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

    const inputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm";

    const SidebarNavItem: React.FC<{ sectionName: 'general' | 'certificate' | 'quiz' | 'survey' | 'chat'; label: string; icon: React.ReactNode; disabled?: boolean; }> = 
        ({ sectionName, label, icon, disabled = false }) => (
        <button type="button" disabled={disabled} onClick={() => !disabled && setActiveSection(sectionName)} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${activeSection === sectionName ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`} >
            {icon}
            <span>{label}</span>
        </button>
    );

    if (isLoading) return <div className="flex justify-center items-center py-20"><LoadingSpinner size={48} /></div>;

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{isNewCourse ? t('courseEditor.createTitle') : t('courseEditor.editTitle')}</h1>
                <button onClick={() => navigate('/admin')} className="text-primary-600 dark:text-primary-400 hover:underline">{t('courseEditor.back')}</button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="md:w-64 flex-shrink-0">
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 sticky top-24">
                        <nav className="space-y-1">
                            <SidebarNavItem sectionName="general" label={t('courseEditor.tab.general')} icon={<GeneralIcon />} />
                            <SidebarNavItem sectionName="certificate" label={t('courseEditor.tab.certificate')} icon={<CertificateIcon />} disabled={isNewCourse} />
                            <SidebarNavItem sectionName="quiz" label={t('courseEditor.tab.quiz')} icon={<QuizIcon />} disabled={isNewCourse} />
                            <SidebarNavItem sectionName="survey" label={t('courseEditor.tab.survey')} icon={<SurveyIcon />} disabled={isNewCourse} />
                            <SidebarNavItem sectionName="chat" label={t('courseEditor.tab.chat')} icon={<ChatIcon />} disabled={isNewCourse} />
                        </nav>
                    </div>
                </aside>

                <main className="flex-1 min-w-0">
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
                        {activeSection === 'general' && (
                             <form onSubmit={handleSave}>
                                <div className="p-6 space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium">{t('courseEditor.titleLabel')}</label>
                                        <input type="text" name="title" value={course.title} onChange={handleChange} className={inputClass} required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">{t('courseEditor.descriptionLabel')}</label>
                                        <textarea name="description" value={course.description} onChange={handleChange} rows={3} className={inputClass} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium">{t('courseEditor.passPercentageLabel')}</label>
                                            <input type="number" name="passPercentage" value={course.passPercentage} onChange={handleChange} className={inputClass} required min="0" max="100" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium">{t('courseEditor.postTestStatusLabel')}</label>
                                            <div className="mt-2 h-10 flex items-center"><label className="inline-flex relative items-center cursor-pointer"><input type="checkbox" name="isPostTestActive" className="sr-only peer" checked={course.isPostTestActive || false} onChange={handleChange} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div><span className="ml-3 text-sm font-medium">{course.isPostTestActive ? t('courseEditor.postTestActive') : t('courseEditor.postTestInactive')}</span></label></div>
                                        </div>
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium">{t('courseEditor.enrollmentStatusLabel')}</label>
                                        <div className="mt-2 h-10 flex items-center"><label className="inline-flex relative items-center cursor-pointer"><input type="checkbox" name="isEnrollmentOpen" className="sr-only peer" checked={course.isEnrollmentOpen !== false} onChange={handleChange} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div><span className="ml-3 text-sm font-medium">{course.isEnrollmentOpen !== false ? t('courseEditor.enrollmentOpen') : t('courseEditor.enrollmentClosed')}</span></label></div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">{t('courseEditor.contentLabel')}</label>
                                        <div ref={quillRef} style={{ height: '250px' }} className="bg-white dark:text-gray-900 mt-1"></div>
                                    </div>
                                    
                                    {userProfile?.role === 'admin' && !isNewCourse && (
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('courseEditor.assignedAdmins.title')}</h3>
                                            <div className="mt-2 space-y-2 border dark:border-gray-600 rounded-md p-3 max-h-40 overflow-y-auto">
                                                {subAdmins.length > 0 ? subAdmins.map(admin => (
                                                    <div key={admin.uid} className="flex items-center">
                                                        <input id={`admin_${admin.uid}`} type="checkbox" checked={course.assignedAdmins?.includes(admin.uid) || false} onChange={(e) => handleAdminAssignmentChange(admin.uid, e.target.checked)} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                                                        <label htmlFor={`admin_${admin.uid}`} className="ml-3 text-sm text-gray-700 dark:text-gray-300">{`${admin.name} ${admin.surname}`.trim()} ({admin.email})</label>
                                                    </div>
                                                )) : <p className="text-sm text-gray-500">{t('courseEditor.assignedAdmins.none')}</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 text-right rounded-b-lg">
                                    <button type="submit" disabled={isSaving} className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400">
                                        {isSaving ? <LoadingSpinner size={20} /> : t('courseEditor.saveButton')}
                                    </button>
                                </div>
                            </form>
                        )}
                        
                        {activeSection === 'certificate' && !isNewCourse && courseId && <div className="p-6"><CertificateEditor courseId={courseId} /></div>}
                        {activeSection === 'quiz' && !isNewCourse && courseId && <div className="p-6"><QuizEditor courseId={courseId} /></div>}
                        {activeSection === 'survey' && !isNewCourse && courseId && <div className="p-6"><SurveyEditor courseId={courseId} /></div>}
                        
                        {activeSection === 'chat' && !isNewCourse && courseId && (
                            <div className="p-6">
                                <h2 className="text-xl font-bold mb-4">{t('course.discussion')}</h2>
                                <div className="h-96 overflow-y-auto border dark:border-gray-600 rounded-md p-4 mb-4 space-y-2 bg-gray-50 dark:bg-gray-900/50">
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
                                    {messages.length === 0 && <p className="text-center py-4 text-gray-400">{t('course.noMessages')}</p>}
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
                        )}
                        {(['certificate', 'quiz', 'survey', 'chat'].includes(activeSection)) && isNewCourse && <div className="p-6 text-center text-gray-500 dark:text-gray-400"><p>{t('courseEditor.saveFirstMessage')}</p></div>}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CourseEditorPage;
