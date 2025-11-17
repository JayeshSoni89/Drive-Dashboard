// These should be set in your environment variables.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let gapiLoaded = false;
let gisLoaded = false;

export const initGapiClient = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (gapiLoaded) {
        resolve(window.gapi);
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
          });
          gapiLoaded = true;
          resolve(window.gapi);
        } catch (error) {
          reject(error);
        }
      });
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

export const initGisClient = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        if (gisLoaded) {
            resolve(window.google);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            gisLoaded = true;
            resolve(window.google)
        };
        script.onerror = reject;
        document.body.appendChild(script);
    });
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
