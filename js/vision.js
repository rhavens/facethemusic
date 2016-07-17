
var gcloud = require('gcloud')({
  keyFilename: './keys/service_account.json',
  projectId: 'instant-gecko-761'
});

var vision = gcloud.vision();

analyseImage('./manav.PNG');

function analyseImage(image_path){
    vision.detectFaces(image_path, function(err, faces, apiResponse, other){
        if (err){
            console.log(err);
        }

        var faceObj = {
            "joy": getValue(apiResponse.responses[0].faceAnnotations[0].joyLikelihood),
            "anger": getValue(apiResponse.responses[0].faceAnnotations[0].angerLikelihood),
            "sad": getValue(apiResponse.responses[0].faceAnnotations[0].sorrowLikelihood),
            "surprise": getValue(apiResponse.responses[0].faceAnnotations[0].surpriseLikelihood),
            "hat": getValue(apiResponse.responses[0].faceAnnotations[0].headwearLikelihood)
        }

        console.log(faceObj);
        return faceObj;
    });
}

/*
VERY_UNLIKELY = 5
LIKELY = 4
POSSIBLE = 3
UNLIKELY = 2
VERY_UNLIKELY = 1
*/
function getValue(likelihood){
    switch (likelihood){    
        case 'VERY_UNLIKELY':
            return 1;
        case 'UNLIKELY':
            return 2;
        case 'POSSIBLE':
            return 3;
        case 'LIKELY':
            return 4;
        case 'VERY_LIKELY':
            return 5;
        default:
            return 'error'
    }
}







