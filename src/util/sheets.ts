const CLIENT_ID = '605659287573-tiv2sh52c13498veg7mpnpjc774gcsh6.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBwUnyuY9ayurNHmF1o1DlANjwrr31lMqU';

const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

/* tslint:disable:no-console */
const gapi: any = (window as any).gapi;
let google: any;

export default class SheetsApi {
    private pickerLoaded: boolean;
    private oauthToken: string;
    private readMacros: (values: string[][]) => void;

    constructor(readMacros: (values: string[][]) => void) {
        this.pickerLoaded = false;
        this.readMacros = readMacros;

        gapi.load('picker', () => {
            google = (window as any).google;
            this.pickerLoaded = true;
        });
    }

    public handleAuthClick = (event: any) => {
        if (!this.oauthToken) {
            // Authenticate for picker and sheets
            gapi.auth2.authorize({
                client_id: CLIENT_ID,
                scope: SCOPE,
            }, (authResult: any) => {
                gapi.load('client:auth2', () => {
                    gapi.client.init({
                        apiKey: API_KEY,
                        clientId: CLIENT_ID,
                        discoveryDocs: DISCOVERY_DOCS,
                        scope: SCOPE,
                    }).then(() => {
                        this.handleAuthResult(authResult);
                    }).catch((e: any) => {
                        console.error(e);
                    });
                });
            });
        } else {
            this.createPicker();
        }
    }

    public handleAuthResult = (authResult: any) => {
        if (authResult && !authResult.error) {
            this.oauthToken = authResult.access_token;
            this.createPicker();
        }
    }

    public createPicker = () => {
        if (this.pickerLoaded && this.oauthToken) {
            const picker: any = new google.picker.PickerBuilder()
                .addView(google.picker.ViewId.SPREADSHEETS)
                .setOAuthToken(this.oauthToken)
                .setDeveloperKey(API_KEY)
                .setCallback(this.pickerCallback)
                .build();

            picker.setVisible(true);
        }
    }

    public pickerCallback = async (data: any) => {
        if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
            const doc = data[google.picker.Response.DOCUMENTS][0];

            const { result } = await gapi.client.sheets.spreadsheets.values.get({
                range: 'macros',  // Sheet MUST be named 'macros'
                spreadsheetId: doc.id,
            });

            this.readMacros(result.values);
        }
    }
}
