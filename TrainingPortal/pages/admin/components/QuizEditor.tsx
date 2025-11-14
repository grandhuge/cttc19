
import React, { useState, useEffect } from 'react';
import { firestore, getDocs, collection, deleteDoc, doc, addDoc, updateDoc } from '../../../services/firebaseService';
import { QuizQuestion, QuizOption } from '../../../types';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useNotification } from '../../../App';

interface QuizEditorProps {
    courseId: string;
}

const QuizEditor: React.FC<QuizEditorProps> = ({ courseId }) => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [initialQuestions, setInitialQuestions] = useState<QuizQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const collectionPath = `courses/${courseId}/quiz`;

    useEffect(() => {
        const fetchQuestions = async () => {
            setIsLoading(true);
            try {
                const snapshot = await getDocs(collection(firestore, collectionPath));
                const data = (snapshot as any).docs
                    .map((doc: any) => ({ id: doc.id, ...doc.data() }))
                    .sort((a: any, b: any) => a.order - b.order) as QuizQuestion[];
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
    
            // Determine which documents to delete, add, or update
            const toDelete = initialQuestions.filter(iq => !questionsToSave.some(q => q.id === iq.id));
            const toAdd = questionsToSave.filter(q => q.id.toString().startsWith('new_'));
            const toUpdate = questionsToSave.filter(q => {
                if (q.id.toString().startsWith('new_')) return false;
                const initialQ = initialQuestions.find(iq => iq.id === q.id);
                // An item needs update if it existed before and its stringified version has changed.
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
                .sort((a: any, b: any) => a.order - b.order) as QuizQuestion[];
            setQuestions(data);
            setInitialQuestions(JSON.parse(JSON.stringify(data))); // Reset the 'dirty' check baseline
            
        } catch (error) {
            console.error("Error saving quiz changes:", error);
            showNotification(t('notification.error.saveQuestions'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddQuestion = () => {
        const order = questions.length > 0 ? Math.max(...questions.map(q => q.order)) + 1 : 1;
        const newQuestion: QuizQuestion = {
            id: `new_${Date.now()}`,
            questionText: 'New Multiple Choice Question',
            type: 'multiple-choice',
            order,
            options: [
                { id: `new_opt_${Date.now()}`, text: 'Correct Answer', isCorrect: true },
                { id: `new_opt_${Date.now() + 1}`, text: 'Wrong Answer', isCorrect: false }
            ]
        };
        setQuestions(prev => [...prev, newQuestion]);
    };

    const handleDeleteQuestion = (questionId: string) => {
        if (window.confirm(t('quizEditor.confirmDelete'))) {
            setQuestions(prev => prev.filter(q => q.id !== questionId));
        }
    };

    const handleQuestionTextChange = (id: string, text: string) => {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, questionText: text } : q));
    };

    const handleOptionChange = (qId: string, optId: string, text: string) => {
        setQuestions(prev => prev.map(q => {
            if (q.id === qId) {
                const newOptions = q.options.map(opt => opt.id === optId ? { ...opt, text } : opt);
                return { ...q, options: newOptions };
            }
            return q;
        }));
    };

    const handleCorrectOptionChange = (qId: string, correctOptId: string) => {
        setQuestions(prev => prev.map(q => {
            if (q.id === qId) {
                const newOptions = q.options.map(opt => ({ ...opt, isCorrect: opt.id === correctOptId }));
                return { ...q, options: newOptions };
            }
            return q;
        }));
    };

    const handleAddOption = (qId: string) => {
        setQuestions(prev => prev.map(q => {
            if (q.id === qId) {
                const newOption: QuizOption = { id: `new_opt_${Date.now()}`, text: 'New Option', isCorrect: false };
                return { ...q, options: [...q.options, newOption] };
            }
            return q;
        }));
    };
    
    const handleDeleteOption = (qId: string, optId: string) => {
        setQuestions(prev => prev.map(q => {
            if (q.id === qId) {
                let newOptions = q.options.filter(opt => opt.id !== optId);
                if (newOptions.length < 2) {
                    showNotification(t('quizEditor.error.minOptions'), 'error');
                    return q;
                }
                if (!newOptions.some(opt => opt.isCorrect)) {
                    // Immutably update the first option to be correct
                    newOptions = newOptions.map((opt, index) => 
                        index === 0 ? { ...opt, isCorrect: true } : opt
                    );
                }
                return { ...q, options: newOptions };
            }
            return q;
        }));
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">{t('quizEditor.title')}</h2>
            {isLoading ? <LoadingSpinner /> : (
                <div className="space-y-4">
                    {questions.map((q) => (
                        <div key={q.id} className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex justify-between items-start">
                                <textarea
                                    value={q.questionText}
                                    onChange={(e) => handleQuestionTextChange(q.id, e.target.value)}
                                    className="w-full text-lg font-semibold bg-transparent border-0 focus:ring-0 p-0"
                                    rows={1}
                                />
                                <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:text-red-700 ml-4 font-bold text-2xl leading-none">×</button>
                            </div>
                            <div className="mt-2 pl-4 space-y-2">
                                {q.options.map(opt => (
                                    <div key={opt.id} className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name={`correct_${q.id}`}
                                            checked={opt.isCorrect}
                                            onChange={() => handleCorrectOptionChange(q.id, opt.id)}
                                            className="h-5 w-5 text-primary-600 focus:ring-primary-500"
                                        />
                                        <input
                                            type="text"
                                            value={opt.text}
                                            onChange={(e) => handleOptionChange(q.id, opt.id, e.target.value)}
                                            className="flex-grow bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md px-2 py-1"
                                        />
                                        <button onClick={() => handleDeleteOption(q.id, opt.id)} className="text-gray-400 hover:text-red-500 text-lg">🗑️</button>
                                    </div>
                                ))}
                                <button onClick={() => handleAddOption(q.id)} className="text-sm text-primary-600 hover:text-primary-800 mt-2">+ {t('quizEditor.addOption')}</button>
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

export default QuizEditor;
