
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

const waitForGlobal = <T>(name: string): Promise<T> => {
    return new Promise((resolve) => {
        const check = () => {
            if ((window as any)[name]) {
                resolve((window as any)[name]);
            } else {
                setTimeout(check, 100);
            }
        };
        check();
    });
};

export const initGapiClient = (apiKey: string): Promise<any> => {
    return new Promise(async (resolve, reject) => {
        const gapi = await waitForGlobal<any>('gapi');
        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    apiKey: apiKey,
                    discoveryDocs: [DISCOVERY_DOC],
                });
                resolve(gapi);
            } catch (error) {
                console.error('Error initializing gapi client:', error);
                reject(error);
            }
        });
    });
};

export const initGisClient = (): Promise<any> => {
    return waitForGlobal<any>('google');
};

export const fetchFiles = async (gapi: any): Promise<any[]> => {
    try {
        const response = await gapi.client.drive.files.list({
            pageSize: 50,
            fields: 'nextPageToken, files(id, name, mimeType, webViewLink, modifiedTime)',
            q: "(mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet') and trashed=false",
            orderBy: 'modifiedTime desc'
        });
        return response.result.files || [];
    } catch (err) {
        console.error("Error fetching files:", err);
        throw err;
    }
};
