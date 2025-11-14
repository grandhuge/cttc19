
import React, { useState, useEffect, useRef } from 'react';
import { firestore, getDoc, doc, updateDoc } from '../../../services/firebaseService';
import { Course, Coordinates, FontSettings } from '../../../types';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useNotification } from '../../../App';

interface CertificateEditorProps {
    courseId: string;
}

const fontOptions = [
    { value: 'serif', label: 'Serif' },
    { value: 'sans-serif', label: 'Sans-serif' },
    { value: 'monospace', label: 'Monospace' },
    { value: 'cursive', label: 'Cursive' },
    { value: 'fantasy', label: 'Fantasy' },
];

const CertificateEditor: React.FC<CertificateEditorProps> = ({ courseId }) => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const [course, setCourse] = useState<Partial<Course>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const docPath = `courses/${courseId}`;
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const defaultCoords: Coordinates = { x: { value: 50, unit: '%' }, y: { value: 50, unit: '%' } };
    const defaultNameFont: FontSettings = { family: 'serif', size: 48 };
    const defaultDateFont: FontSettings = { family: 'serif', size: 24 };

    useEffect(() => {
        const fetchCourseData = async () => {
            setIsLoading(true);
            try {
                const docSnap = await getDoc(doc(firestore, docPath));
                if ((docSnap as any).exists()) {
                    const courseData = (docSnap as any).data() as Course;
                    setCourse({
                        ...courseData,
                        nameFontSettings: courseData.nameFontSettings || defaultNameFont,
                        dateFontSettings: courseData.dateFontSettings || defaultDateFont,
                    });
                } else {
                    showNotification(t('notification.error.courseNotFound'), 'error');
                }
            } catch (error) {
                showNotification(t('notification.error.fetchCourse'), 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchCourseData();
    }, [docPath, showNotification, t]);
    
    useEffect(() => {
        const canvas = previewCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { certificateTemplateUrl, nameCoordinates, dateCoordinates, showDateOnCertificate, showPrefixOnCertificate, nameFontSettings, dateFontSettings } = course;

        const drawPlaceholder = (message: string) => {
            const container = canvas.parentElement;
            if (!container) return;
            const aspect = 1.414;
            const { width } = container.getBoundingClientRect();
            canvas.width = width;
            canvas.height = width / aspect;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#6b7280';
            ctx.textAlign = 'center';
            ctx.font = '16px sans-serif';
            ctx.fillText(message, canvas.width / 2, canvas.height / 2);
        };

        if (!certificateTemplateUrl) {
            drawPlaceholder(t('courseEditor.certificate.previewNoTemplate'));
            return;
        }

        drawPlaceholder(t('courseEditor.certificate.previewLoading'));
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = certificateTemplateUrl;

        img.onload = () => {
            const container = canvas.parentElement;
            if (!container) return;
            const containerWidth = container.clientWidth;
            
            const scale = containerWidth / img.width;
            canvas.width = containerWidth;
            canvas.height = img.height * scale;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const calculatePosition = (coord: { value: number; unit: 'px' | '%'; }, canvasDimension: number) => {
                if (coord.unit === '%') {
                    return (coord.value / 100) * canvasDimension;
                }
                return coord.value * scale; // px values need to be scaled for preview
            };

            if (nameCoordinates) {
                const nameSize = (nameFontSettings?.size || 48) * scale;
                const nameFamily = nameFontSettings?.family || 'serif';
                ctx.font = `${nameSize}px ${nameFamily}`;
                ctx.fillStyle = '#000000';
                ctx.textAlign = 'center';
                const nameX = calculatePosition(nameCoordinates.x, canvas.width);
                const nameY = calculatePosition(nameCoordinates.y, canvas.height);
                const samplePrefix = t('prefix.mr');
                const sampleName = 'Sample Name';
                const nameToDraw = showPrefixOnCertificate !== false ? `${samplePrefix} ${sampleName}` : sampleName;
                ctx.fillText(nameToDraw, nameX, nameY);
            }

            if (showDateOnCertificate && dateCoordinates) {
                const dateSize = (dateFontSettings?.size || 24) * scale;
                const dateFamily = dateFontSettings?.family || 'serif';
                ctx.font = `${dateSize}px ${dateFamily}`;
                ctx.fillStyle = '#333333';
                ctx.textAlign = 'center';
                const dateX = calculatePosition(dateCoordinates.x, canvas.width);
                const dateY = calculatePosition(dateCoordinates.y, canvas.height);
                ctx.fillText(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), dateX, dateY);
            }
        };

        img.onerror = () => {
            drawPlaceholder(t('courseEditor.certificate.previewNoTemplate'));
        };

    }, [course, t]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, type, checked, value } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setCourse(prev => ({ ...prev, [name]: val }));
    };
    
    const handleCoordinateValueChange = (coord: 'name' | 'date', axis: 'x' | 'y', value: string) => {
        const numValue = parseInt(value, 10) || 0;
        const key = coord === 'name' ? 'nameCoordinates' : 'dateCoordinates';
        setCourse(prev => ({
            ...prev,
            [key]: {
                ...(prev[key] || defaultCoords),
                [axis]: {
                    ...(prev[key]?.[axis] || { value: 0, unit: 'px' }),
                    value: numValue
                }
            }
        }));
    };

    const handleCoordinateUnitChange = (coord: 'name' | 'date', axis: 'x' | 'y', unit: 'px' | '%') => {
        const key = coord === 'name' ? 'nameCoordinates' : 'dateCoordinates';
        setCourse(prev => ({
            ...prev,
            [key]: {
                ...(prev[key] || defaultCoords),
                [axis]: {
                    ...(prev[key]?.[axis] || { value: 0, unit: 'px' }),
                    unit: unit
                }
            }
        }));
    };

    const handleFontSettingChange = (
        setting: 'nameFontSettings' | 'dateFontSettings',
        property: 'family' | 'size',
        value: string | number
    ) => {
        setCourse(prev => ({
            ...prev,
            [setting]: {
                ...(prev[setting] || (setting === 'nameFontSettings' ? defaultNameFont : defaultDateFont)),
                [property]: property === 'size' ? parseInt(value as string, 10) || 0 : value,
            }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const dataToUpdate = {
                hasCertificate: course.hasCertificate || false,
                certificateTemplateUrl: course.certificateTemplateUrl || '',
                nameCoordinates: course.nameCoordinates || defaultCoords,
                dateCoordinates: course.dateCoordinates || defaultCoords,
                nameFontSettings: course.nameFontSettings || defaultNameFont,
                dateFontSettings: course.dateFontSettings || defaultDateFont,
                showDateOnCertificate: course.showDateOnCertificate || false,
                showPrefixOnCertificate: course.showPrefixOnCertificate || false,
            };
            await updateDoc(doc(firestore, docPath), dataToUpdate);
            showNotification(t('notification.success.courseUpdated'), 'success');
        } catch (error) {
            console.error("Error saving certificate settings:", error);
            showNotification(t('notification.error.saveCourse'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const inputClass = "block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm";

    if (isLoading) return <LoadingSpinner />;
    
    const CoordinateInput: React.FC<{ coord: 'name'|'date'; axis: 'x'|'y'}> = ({ coord, axis }) => {
        const key = coord === 'name' ? 'nameCoordinates' : 'dateCoordinates';
        const value = course[key]?.[axis]?.value || 0;
        const unit = course[key]?.[axis]?.unit || 'px';

        return (
             <div className="flex gap-2">
                <input type="number" value={value} onChange={e => handleCoordinateValueChange(coord, axis, e.target.value)} className={inputClass} placeholder={axis === 'x' ? t('courseEditor.certificate.x_axis') : t('courseEditor.certificate.y_axis')} />
                <select value={unit} onChange={e => handleCoordinateUnitChange(coord, axis, e.target.value as 'px' | '%')} className={`${inputClass} w-24`}>
                    <option value="px">{t('courseEditor.certificate.unit_px')}</option>
                    <option value="%">{t('courseEditor.certificate.unit_percent')}</option>
                </select>
            </div>
        )
    };

    return (
         <div>
            <h2 className="text-2xl font-bold mb-4">{t('courseEditor.certificate.title')}</h2>
            <div className="space-y-6">
                <div className="flex items-center">
                    <input type="checkbox" id="hasCertificate" name="hasCertificate" checked={course.hasCertificate || false} onChange={handleChange} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                    <label htmlFor="hasCertificate" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">{t('courseEditor.certificate.enable')}</label>
                </div>
                {course.hasCertificate && (
                    <div className="pl-6 border-l-2 border-primary-500 space-y-4">
                        <div>
                            <label className="block text-sm font-medium">{t('courseEditor.certificate.templateUrl')}</label>
                            <input type="text" name="certificateTemplateUrl" value={course.certificateTemplateUrl || ''} onChange={handleChange} className={inputClass} placeholder="https://example.com/template.png" />
                            <p className="mt-1 text-xs text-gray-500">{t('courseEditor.certificate.templateUrlHelp')}</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <input type="checkbox" id="showPrefixOnCertificate" name="showPrefixOnCertificate" checked={course.showPrefixOnCertificate !== false} onChange={handleChange} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                                <label htmlFor="showPrefixOnCertificate" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">{t('courseEditor.certificate.showPrefix')}</label>
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" id="showDateOnCertificate" name="showDateOnCertificate" checked={course.showDateOnCertificate || false} onChange={handleChange} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                                <label htmlFor="showDateOnCertificate" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">{t('courseEditor.certificate.showDate')}</label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           <div>
                                <label className="block text-sm font-medium">{t('courseEditor.certificate.namePosition')}</label>
                                <div className="mt-1 space-y-2">
                                    <CoordinateInput coord="name" axis="x" />
                                    <CoordinateInput coord="name" axis="y" />
                                </div>
                                <label className="block text-sm font-medium mt-2">Font</label>
                                <div className="flex gap-2 mt-1">
                                    <select
                                        value={course.nameFontSettings?.family || 'serif'}
                                        onChange={e => handleFontSettingChange('nameFontSettings', 'family', e.target.value)}
                                        className={`${inputClass} w-2/3`}
                                    >
                                        {fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <input
                                        type="number"
                                        value={course.nameFontSettings?.size || 48}
                                        onChange={e => handleFontSettingChange('nameFontSettings', 'size', e.target.value)}
                                        className={`${inputClass} w-1/3`}
                                        placeholder="Size (px)"
                                    />
                                </div>
                            </div>
                             {course.showDateOnCertificate && (
                                <div>
                                    <label className="block text-sm font-medium">{t('courseEditor.certificate.datePosition')}</label>
                                    <div className="mt-1 space-y-2">
                                        <CoordinateInput coord="date" axis="x" />
                                        <CoordinateInput coord="date" axis="y" />
                                    </div>
                                    <label className="block text-sm font-medium mt-2">Font</label>
                                    <div className="flex gap-2 mt-1">
                                        <select
                                            value={course.dateFontSettings?.family || 'serif'}
                                            onChange={e => handleFontSettingChange('dateFontSettings', 'family', e.target.value)}
                                            className={`${inputClass} w-2/3`}
                                        >
                                            {fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                        <input
                                            type="number"
                                            value={course.dateFontSettings?.size || 24}
                                            onChange={e => handleFontSettingChange('dateFontSettings', 'size', e.target.value)}
                                            className={`${inputClass} w-1/3`}
                                            placeholder="Size (px)"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                         <div className="mt-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('courseEditor.certificate.previewTitle')}</h3>
                            <div className="mt-2 border dark:border-gray-600 rounded-md p-2 bg-gray-100 dark:bg-gray-900/50 flex justify-center items-center">
                                <canvas ref={previewCanvasRef} className="max-w-full max-h-full"></canvas>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-6 pt-4 border-t dark:border-gray-700 flex justify-end">
                <button onClick={handleSave} disabled={isSaving || isLoading} className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400">
                    {isSaving ? <LoadingSpinner size={20} /> : t('quizEditor.saveChanges')}
                </button>
            </div>
        </div>
    );
};

export default CertificateEditor;
