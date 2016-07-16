var CLIENT_ID = '321128676059-575giah3j036n9usij3d0r8ug1dhvb50.apps.googleusercontent.com';
var CLIENT_SECRET = 'BAIeCKU6gNDvypqdQf8mmLkG';


//Google Authentication
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET);
google.options({ auth: oauth2Client }); // set auth as a global default

var drive = google.drive({ version: 'v2', auth: oauth2Client }); //getting the drive resource object

var vision = google.vision({version: 'v1', auth: oauth2Client}); //getting the vision resource object








