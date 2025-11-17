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
