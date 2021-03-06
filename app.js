var App = {};

App.Parser = (function(_){

    /* private */

    var nameRegex = /<b[^>]*>(.*?)<\/b>/;

    function returnSpecificArrayInfo(photo_array) {
        /* Given a big array, search for the element that starts
        with Caption. Grab that el, the previous, and the first 

        _.ltrim each element to prevent 
        more expensive indexOf != -1 conditional
        */

        for (var i = 0; i < photo_array.length; i++) {
            if (_.ltrim(photo_array[i]).indexOf('Caption') == 0) {
                var e = [ photo_array[0], photo_array[i-1], photo_array[i] ];
                return _.map(e, function(el) { return _.trim(el); });
            }
        }   
    }

    function formatCaption(caption) {
        /* remove caption: text from caption string */
        return _.strRightBack(caption, "Caption: ");
    }

    function parseNameAndLocation(nameLocation) {
        /* given input like "&lt;b&gt;THOMAS PETER&lt;/b&gt;, Germany "
        return { name: Thomas Peter, location: Germany }*/

        var results = {};
        nameLocation = _.unescapeHTML(nameLocation);
        /* nameLocation = <b>THOMAS PETER</b>, Germany */

        var capName = nameRegex.exec(nameLocation)[1];
        results.name = formatNameProperly(capName);
        results.location = _.trim(_.strRightBack(nameLocation, ','));

        return results;
    }

    function formatNameProperly(name) {
        /* given THOMAS PETER return Thomas Peter */
        name = name.split(' ');
        name = _.map(name, function(word) { 
            return _.capitalize(word.toLowerCase()) 
        }).join(' ');
        return name;
    }

    /* public */

    function parsePhoto(photoObject) {
        /* split a photo caption string into an array 
        save only the parts we want. parse those parts 
        into an object  */

        var photoArray = photoObject.caption.split('&lt;br/&gt; &lt;br/&gt;');
        photoArray = returnSpecificArrayInfo(photoArray);
        /* photoArray is now [name and location, camera string, caption string]
        all of which must be properly formatted */

        var nameAndLocation = parseNameAndLocation(photoArray[0]);
        var formattedCaption = formatCaption(photoArray[2]);
        return {
            name: nameAndLocation.name,
            location: nameAndLocation.location,
            image: {
                big: photoObject.image,
                small: photoObject.thumbnail
            },
            caption: formattedCaption,
            camera: App.CameraParser.parseCamera(photoArray[1])
        }
    }

    return {
        parsePhoto: parsePhoto
    }
}(_));

App.CameraParser = (function(_){

    /* Private */

    var lensRegex = /lens (.*)/;
    var isoReplacementRegex = /\D/g;

    function parseCameraIntoArray(cameraString) {
        /* turn string into array and trim whitespace 
        from "Canon 5D Mark III, lens 24-70mm, f3.5, 1/250, ISO 400  "
        into array with proper whitespace  */

        var cameraArray = cameraString.split(',');
        cameraArray = _.map(cameraArray, 
            function(n) { return _.trim(n) });
        return cameraArray;
    }

    function parseMakeAndModel(cameraString){
      /* given "Canon 5D Mark III"
      return { make: "Canon", model: "5D Mark III"} */

      /* given a string, iterate until the character is " "
      return everything before it and everything past it */

      var cameraObject = {};

      for (var i = 0; i < cameraString.length; i++) {
        if (cameraString[i] == " ") {
          cameraObject.make = cameraString.slice(0,i);
          cameraObject.model = cameraString.slice(i+1);
          break;
        }
      }
      return cameraObject;
    }

    function formatCamera(cameraArray) {
        /* turn an unformatted array into a formatted object */
        var makeAndModel = parseMakeAndModel(cameraArray[0]);
        var parsedLens = regexLens(cameraArray[1]);

        return {
            manufacturer: makeAndModel.make,
            model: makeAndModel.model,
            lens: parsedLens,
            prime: checkForPrimeLens(parsedLens),
            aperture: cameraArray[2],
            iso: regexISO(cameraArray[4]),
            shutter: cameraArray[3]
        }
    }

    function regexLens(lensInfo) {
        /* regex for lens and remove superfluous info
         turns "lens 16-35mm at 16mm " into "16-35mm" */
        var lens = lensRegex.exec(lensInfo)[1];
        return _.strLeft(lens,' at');
    }

    function regexISO(iso) {
        /* If photo has ISO, turns "ISO 400 " into "400" */
        try {
            iso = iso.replace(isoReplacementRegex,'')
        } catch(e) {
            iso = "";
        }
        return iso;
    }

    function checkForPrimeLens(lens) {
        return (lens.indexOf('-') == -1) ? false : true;
    }

    /* Public */
    function parseCamera(cameraString) {
        /* public interface. accepts a string
        turns into an array and then returns an obj */
        var cameraArray = parseCameraIntoArray(cameraString);
        return formatCamera(cameraArray);
    }

    return {
        parseCamera: parseCamera
    }
}(_));

global.App = App;
