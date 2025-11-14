
import { Timestamp } from '../services/firebaseService';
import { Coordinates, FontSettings } from '../types';

interface CertificateData {
    templateUrl: string;
    userName: string;
    completionDate: Timestamp;
    courseTitle: string;
    nameCoordinates: Coordinates;
    dateCoordinates: Coordinates;
    nameFontSettings?: FontSettings;
    dateFontSettings?: FontSettings;
    showDateOnCertificate?: boolean;
}

// Helper to format date
const formatDate = (timestamp: Timestamp): string => {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
};

export const generateCertificate = (data: CertificateData): Promise<void> => {
    return new Promise((resolve, reject) => {
        const { templateUrl, userName, completionDate, courseTitle, nameCoordinates, dateCoordinates, nameFontSettings, dateFontSettings, showDateOnCertificate } = data;
        const image = new Image();
        image.crossOrigin = 'Anonymous'; // Handle CORS for images from different domains
        image.src = templateUrl;

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context.'));
            }

            // Draw template
            ctx.drawImage(image, 0, 0);

            // Helper to calculate final position based on unit
            const calculatePosition = (coord: { value: number, unit: 'px' | '%' }, dimensionSize: number) => {
                if (coord.unit === '%') {
                    return (coord.value / 100) * dimensionSize;
                }
                return coord.value; // px is absolute
            };

            // Draw user name
            const nameSize = nameFontSettings?.size || 48;
            const nameFamily = nameFontSettings?.family || 'serif';
            ctx.font = `${nameSize}px ${nameFamily}`;
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            const nameX = calculatePosition(nameCoordinates.x, canvas.width);
            const nameY = calculatePosition(nameCoordinates.y, canvas.height);
            ctx.fillText(userName, nameX, nameY);

            // Draw completion date, defaulting to true if the property is undefined
            if (showDateOnCertificate !== false) {
                const dateSize = dateFontSettings?.size || 24;
                const dateFamily = dateFontSettings?.family || 'serif';
                ctx.font = `${dateSize}px ${dateFamily}`;
                ctx.fillStyle = '#333333';
                ctx.textAlign = 'center';
                const dateX = calculatePosition(dateCoordinates.x, canvas.width);
                const dateY = calculatePosition(dateCoordinates.y, canvas.height);
                ctx.fillText(formatDate(completionDate), dateX, dateY);
            }

            // Trigger download
            const link = document.createElement('a');
            link.download = `Certificate_${courseTitle.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            resolve();
        };

        image.onerror = () => {
            reject(new Error('Failed to load certificate template image.'));
        };
    });
};
