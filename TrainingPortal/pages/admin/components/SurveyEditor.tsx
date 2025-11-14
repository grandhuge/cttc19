
import React, { useState, useEffect } from 'react';
import { firestore, getDocs, collection, deleteDoc, doc, addDoc, updateDoc } from '../../../services/firebaseService';
import { SurveyQuestion } from '../../../types';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useNotification } from '../../../App';

interface SurveyEditorProps {
    courseId: string;
}

const SurveyEditor: React.FC<SurveyEditorProps> = ({ courseId }) => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
    const [initialQuestions, setInitialQuestions] = useState<SurveyQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const collectionPath = `courses/${courseId}/survey`;

    useEffect(() => {
        const fetchQuestions = async () => {
            setIsLoading(true);
            try {
                const snapshot = await getDocs(collection(firestore, collectionPath));
                const data = (snapshot as any).docs
                    .map((doc: any) => ({ id: doc.id, ...doc.data() }))
                    .sort((a: any, b: any) => a.order - b.order) as SurveyQuestion[];
                setQuestions(data);
                setInitialQuestions(JSON.parse(JSON.stringify(data)));
            } catch (error) {
                showNotification(t('notification.error.fetchQuestions'), 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuestions();
    }, [collectionPath, showNotification, t]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Ensure order is sequential before comparing and saving
            const questionsToSave = questions.map((q, index) => ({ ...q, order: index + 1 }));
    
            const toDelete = initialQuestions.filter(iq => !questionsToSave.some(q => q.id === iq.id));
            const toAdd = questionsToSave.filter(q => q.id.toString().startsWith('new_'));
            const toUpdate = questionsToSave.filter(q => {
                if (q.id.toString().startsWith('new_')) return false;
                const initialQ = initialQuestions.find(iq => iq.id === q.id);
                return initialQ && JSON.stringify(initialQ) !== JSON.stringify(q);
            });
    
            const promises: Promise<any>[] = [
                ...toDelete.map(q => deleteDoc(doc(firestore, `${collectionPath}/${q.id}`))),
                ...toAdd.map(q => {
                    const { id, ...data } = q;
                    return addDoc(collection(firestore, collectionPath), data);
                }),
                ...toUpdate.map(q => {
                    const { id, ...data } = q;
                    return updateDoc(doc(firestore, `${collectionPath}/${id}`), data);
                })
            ];
    
            if (promises.length > 0) {
                await Promise.all(promises);
                showNotification(t('notification.success.saveQuestions'), 'success');
            }
    
            // Always refetch to ensure client is in sync with DB and has the new Firestore-generated IDs
            const snapshot = await getDocs(collection(firestore, collectionPath));
            const data = (snapshot as any).docs
                .map((doc: any) => ({ id: doc.id, ...doc.data() }))
                .sort((a: any, b: any) => a.order - b.order) as SurveyQuestion[];
            setQuestions(data);
            setInitialQuestions(JSON.parse(JSON.stringify(data)));
            
        } catch (error) {
            console.error("Error saving survey changes:", error);
            showNotification(t('notification.error.saveQuestions'), 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleAddQuestion = () => {
        const order = questions.length > 0 ? Math.max(...questions.map(q => q.order)) + 1 : 1;
        const newQuestion: SurveyQuestion = {
            id: `new_${Date.now()}`,
            questionText: 'New Rating Question',
            type: 'rating',
            order,
            required: true
        };
        setQuestions(prev => [...prev, newQuestion]);
    };

    const handleDeleteQuestion = (questionId: string) => {
        if (window.confirm(t('surveyEditor.confirmDelete'))) {
            setQuestions(prev => prev.filter(q => q.id !== questionId));
        }
    };

    const handleQuestionChange = (id: string, field: keyof SurveyQuestion, value: any) => {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">{t('surveyEditor.title')}</h2>
            {isLoading ? <LoadingSpinner /> : (
                <div className="space-y-4">
                    {questions.map((q) => (
                        <div key={q.id} className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex justify-between items-start">
                                <textarea
                                    value={q.questionText}
                                    onChange={(e) => handleQuestionChange(q.id, 'questionText', e.target.value)}
                                    className="w-full text-lg font-semibold bg-transparent border-0 focus:ring-0 p-0"
                                    rows={1}
                                />
                                <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:text-red-700 ml-4 font-bold text-2xl leading-none">×</button>
                            </div>
                             <div className="mt-2 pl-4 space-y-2">
                                <div className="flex items-center gap-4">
                                     <label className="text-sm font-medium">Question Type:</label>
                                     <select value={q.type} onChange={e => handleQuestionChange(q.id, 'type', e.target.value)} className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm">
                                        <option value="rating">Rating (1-5)</option>
                                        <option value="text">Text</option>
                                     </select>
                                </div>
                                 <div className="flex items-center gap-2">
                                     <input type="checkbox" id={`required_${q.id}`} checked={q.required} onChange={e => handleQuestionChange(q.id, 'required', e.target.checked)} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"/>
                                     <label htmlFor={`required_${q.id}`} className="text-sm">Required</label>
                                 </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="mt-6 pt-4 border-t dark:border-gray-700 flex justify-between">
                <button onClick={handleAddQuestion} className="px-4 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600">{t('quizEditor.addQuestion')}</button>
                <button onClick={handleSave} disabled={isSaving || isLoading} className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-400 flex items-center gap-2">
                    {isSaving && <LoadingSpinner size={20} />}
                    {t('quizEditor.saveChanges')}
                </button>
            </div>
        </div>
    );
};

export default SurveyEditor;
